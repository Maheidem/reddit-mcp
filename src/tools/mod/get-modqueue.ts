/**
 * `get_modqueue` tool — list items pending moderator review.
 *
 * Fetches reported and spam-filtered content from a subreddit's modqueue.
 * Requires Tier 3 auth with `modposts` + `read` scopes.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/** Modqueue item with report metadata. */
interface ModqueueItem {
  name: string;
  author: string;
  subreddit: string;
  title?: string;
  body?: string;
  num_reports: number;
  mod_reports: Array<[string, string]>;
  user_reports: Array<[string, number]>;
  created_utc: number;
  permalink: string;
}

/** Format a modqueue item for display. */
function formatItem(item: ModqueueItem): string {
  const kind = item.name.startsWith("t3_") ? "Post" : "Comment";
  const title = item.title ?? item.body?.slice(0, 80) ?? "(no content)";
  const reports = `${item.num_reports} report(s)`;
  return `[${kind}] ${title}\n  by u/${item.author} in r/${item.subreddit} | ${reports} | ${item.name}`;
}

/**
 * Register the `get_modqueue` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerGetModqueue(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "get_modqueue",
    "Mod-only: List items pending moderator review (reported and spam-filtered). Requires moderator permissions and user-level authentication.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      type: z
        .enum(["links", "comments"])
        .optional()
        .describe("Filter by type: links (posts only), comments (comments only), or omit for all"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of items to return (1-100, default 25)"),
      after: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ subreddit, type, limit, after }) => {
      try {
        requireAuth(authManager.tier, "user");

        const params: Record<string, string> = {};
        if (type) params.type = type;
        if (limit !== undefined) params.limit = String(limit);
        if (after) params.after = after;

        const response = await client.get<{
          data: { children: Array<{ data: ModqueueItem }>; after: string | null };
        }>(`/r/${subreddit}/about/modqueue`, params);

        const items = response.data.data.children.map((c) => c.data);
        const afterCursor = response.data.data.after;

        if (items.length === 0) {
          return {
            content: [{ type: "text" as const, text: `No items in r/${subreddit} modqueue.` }],
          };
        }

        const lines = items.map(formatItem);
        if (afterCursor) {
          lines.push(`\n--- More items available. Use after="${afterCursor}" to continue ---`);
        }

        return { content: [{ type: "text" as const, text: lines.join("\n\n") }] };
      } catch (error) {
        if (error instanceof AuthGuardError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        if (error instanceof RedditApiError && error.status === 403) {
          return {
            content: [
              {
                type: "text" as const,
                text: `You are not a moderator of r/${subreddit}. Modqueue access requires moderator permissions.`,
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
