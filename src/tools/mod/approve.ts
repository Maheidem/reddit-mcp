/**
 * `approve` tool — approve an item from the modqueue.
 *
 * Removes the item from modqueue and spam filter.
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
 * Register the `approve` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerApprove(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "approve",
    "Mod-only: Approve content from the modqueue (removes it from modqueue and spam filter). Requires moderator permissions and user-level authentication.",
    {
      id: z
        .string()
        .describe("Fullname of the item to approve (e.g., t3_abc123 for a post, t1_xyz789 for a comment)"),
    },
    async ({ id }) => {
      try {
        requireAuth(authManager.tier, "user");

        await client.post("/api/approve", { id });

        return {
          content: [
            { type: "text" as const, text: `Approved ${id}. Item removed from modqueue.` },
          ],
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
                text: "You do not have moderator permissions to approve this content.",
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
