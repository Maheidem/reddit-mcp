/**
 * `remove` tool — remove an item from a subreddit.
 *
 * Optionally marks as spam to train Reddit's spam filter.
 * Requires Tier 3 auth with `modposts` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/**
 * Register the `remove` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerRemove(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "remove",
    "Mod-only: Remove content from a subreddit. Optionally mark as spam to train the spam filter. Requires moderator permissions and user-level authentication.",
    {
      id: z
        .string()
        .describe("Fullname of the item to remove (e.g., t3_abc123 for a post, t1_xyz789 for a comment)"),
      spam: z
        .boolean()
        .optional()
        .describe("If true, marks as spam (trains Reddit's spam filter for this subreddit). Default false."),
    },
    async ({ id, spam }) => {
      try {
        requireAuth(authManager.tier, "user");

        const body: Record<string, string> = { id };
        if (spam) body.spam = "true";

        await client.post("/api/remove", body);

        const action = spam ? "Removed and marked as spam" : "Removed";
        return {
          content: [{ type: "text" as const, text: `${action}: ${id}.` }],
        };
      } catch (error) {
        if (error instanceof AuthGuardError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        if (error instanceof RedditApiError && error.status === 403) {
          return {
            content: [
              {
                type: "text" as const,
                text: "You do not have moderator permissions to remove this content.",
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
