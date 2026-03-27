/**
 * `get_mod_notes` tool — read moderator notes for a user.
 *
 * Special 30 QPM rate limit (vs standard 100 QPM).
 * Supports 8 label types for filtering.
 * Requires Tier 3 auth with `modnote` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { TokenBucketRateLimiter } from "../../reddit/rate-limiter.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/** Valid mod note label types. */
const NOTE_LABELS = [
  "BOT_BAN",
  "PERMA_BAN",
  "BAN",
  "ABUSE_WARNING",
  "SPAM_WARNING",
  "SPAM_WATCH",
  "SOLID_CONTRIBUTOR",
  "HELPFUL_USER",
] as const;

/** A single mod note. */
interface ModNote {
  note_id: string;
  subreddit: string;
  user: string;
  created_at: number;
  created_by: string;
  note: string;
  label: string | null;
  reddit_id: string | null;
}

/** Mod notes API response. */
interface ModNotesResponse {
  mod_notes: ModNote[];
  start_cursor: string | null;
  end_cursor: string | null;
  has_next_page: boolean;
}

/** Format a mod note for display. */
function formatNote(note: ModNote): string {
  const date = new Date(note.created_at * 1000).toISOString().slice(0, 16);
  const label = note.label ? `[${note.label}] ` : "";
  const link = note.reddit_id ? ` (linked: ${note.reddit_id})` : "";
  return `${label}${date} by u/${note.created_by}: ${note.note}${link}`;
}

/**
 * Dedicated 30 QPM rate limiter for the mod notes endpoint.
 *
 * Reddit enforces a separate, stricter rate limit (30 QPM) for mod notes
 * vs the standard 100 QPM for other endpoints.
 */
const modNotesRateLimiter = new TokenBucketRateLimiter({
  capacity: 30,
  windowSeconds: 60,
});

/**
 * Register the `get_mod_notes` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerGetModNotes(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "get_mod_notes",
    "Mod-only: Read moderator notes for a user in a subreddit. Rate limited to 30 requests/minute. Requires moderator permissions with 'Manage Users' and user-level authentication.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      user: z.string().describe("Username to fetch notes for (without u/ prefix)"),
      filter: z
        .enum(NOTE_LABELS)
        .optional()
        .describe(
          "Filter by note label: BOT_BAN, PERMA_BAN, BAN, ABUSE_WARNING, SPAM_WARNING, SPAM_WATCH, SOLID_CONTRIBUTOR, HELPFUL_USER",
        ),
      before: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ subreddit, user, filter, before }) => {
      try {
        requireAuth(authManager.tier, "user");

        // Enforce 30 QPM rate limit for mod notes endpoint
        await modNotesRateLimiter.acquire();

        const params: Record<string, string> = {
          subreddit,
          user,
        };
        if (filter) params.filter = filter;
        if (before) params.before = before;

        const response = await client.get<ModNotesResponse>("/api/mod/notes", params);

        const notes = response.data.mod_notes ?? [];
        const hasMore = response.data.has_next_page;
        const cursor = response.data.end_cursor;

        if (notes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No mod notes found for u/${user} in r/${subreddit}${filter ? ` (filter: ${filter})` : ""}.`,
              },
            ],
          };
        }

        const lines = [
          `Mod notes for u/${user} in r/${subreddit}:`,
          "",
          ...notes.map(formatNote),
        ];

        if (hasMore && cursor) {
          lines.push(`\n--- More notes available. Use before="${cursor}" to continue ---`);
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
                text: `You do not have moderator permissions to view mod notes in r/${subreddit}. Requires "Manage Users" permission.`,
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
