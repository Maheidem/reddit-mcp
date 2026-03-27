/**
 * `get_mod_log` tool — view moderation action history.
 *
 * Fetches mod actions with optional filters for action type and moderator.
 * 90-day data retention. Requires Tier 3 auth with `modlog` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/** A single mod log entry. */
interface ModLogEntry {
  id: string;
  created_utc: number;
  mod: string;
  action: string;
  target_fullname: string | null;
  target_author: string | null;
  target_title: string | null;
  target_body: string | null;
  details: string | null;
  description: string | null;
  subreddit: string;
}

/** Format a mod log entry for display. */
function formatEntry(entry: ModLogEntry): string {
  const date = new Date(entry.created_utc * 1000).toISOString().slice(0, 16);
  const target = entry.target_author ? ` -> u/${entry.target_author}` : "";
  const detail = entry.details ?? entry.description ?? "";
  return `[${date}] ${entry.action} by u/${entry.mod}${target}${detail ? ` (${detail})` : ""}`;
}

/**
 * Register the `get_mod_log` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerGetModLog(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "get_mod_log",
    "Mod-only: View moderation action history for a subreddit (90-day retention). Filter by action type or moderator. Requires moderator permissions and user-level authentication.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      type: z
        .string()
        .optional()
        .describe(
          "Filter by action type (e.g., banuser, removelink, approvecomment, spamlink). Omit for all actions.",
        ),
      mod: z
        .string()
        .optional()
        .describe("Filter by moderator username (without u/ prefix)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Number of entries to return (1-500, default 25)"),
      after: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ subreddit, type, mod, limit, after }) => {
      try {
        requireAuth(authManager.tier, "user");

        const params: Record<string, string> = {};
        if (type) params.type = type;
        if (mod) params.mod = mod;
        if (limit !== undefined) params.limit = String(limit);
        if (after) params.after = after;

        const response = await client.get<{
          data: { children: Array<{ data: ModLogEntry }>; after: string | null };
        }>(`/r/${subreddit}/about/log`, params);

        const entries = response.data.data.children.map((c) => c.data);
        const afterCursor = response.data.data.after;

        if (entries.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No mod log entries found for r/${subreddit}${type ? ` (action: ${type})` : ""}.`,
              },
            ],
          };
        }

        const lines = entries.map(formatEntry);
        if (afterCursor) {
          lines.push(`\n--- More entries available. Use after="${afterCursor}" to continue ---`);
        }

        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      } catch (error) {
        if (error instanceof AuthGuardError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        if (error instanceof RedditApiError && error.status === 403) {
          return {
            content: [
              {
                type: "text" as const,
                text: `You are not a moderator of r/${subreddit}. Mod log access requires moderator permissions.`,
              },
            ],
            isError: true,
          };
        }
        if (error instanceof RedditApiError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        throw error;
      }
    },
  );
}
