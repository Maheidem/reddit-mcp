/**
 * `delete_content` tool — permanently delete your own post or comment.
 *
 * Uses `POST /api/del`. Requires `edit` scope.
 * This action is permanent and cannot be undone.
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
 * Register the `delete_content` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerDeleteContent(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "delete_content",
    "Permanently delete your own post (t3_xxx) or comment (t1_xxx). This cannot be undone. Requires user-level authentication (Tier 3).",
    {
      fullname: z
        .string()
        .describe("Fullname of the content to delete (t3_xxx for post, t1_xxx for comment)"),
    },
    async ({ fullname }) => {
      try {
        requireAuth(authManager.tier, "user");

        await client.post("/api/del", { id: fullname });

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted ${fullname}. This action is permanent and cannot be undone.`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof AuthGuardError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        if (error instanceof RedditApiError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Failed to delete content: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
