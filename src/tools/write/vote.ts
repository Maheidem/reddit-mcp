/**
 * `vote` tool — upvote, downvote, or clear vote on a post or comment.
 *
 * Uses `POST /api/vote`. Requires `vote` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/** Vote direction labels for response messages. */
const VOTE_LABELS: Record<number, string> = {
  1: "Upvoted",
  [-1]: "Downvoted",
  0: "Vote cleared on",
};

/**
 * Register the `vote` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerVote(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "vote",
    "Vote on a post or comment: upvote (1), downvote (-1), or clear (0). Requires user-level authentication (Tier 3).",
    {
      fullname: z
        .string()
        .describe("Fullname of the target (t3_xxx for post, t1_xxx for comment)"),
      dir: z
        .number()
        .int()
        .min(-1)
        .max(1)
        .describe("Vote direction: 1 = upvote, -1 = downvote, 0 = clear vote"),
    },
    async ({ fullname, dir }) => {
      try {
        requireAuth(authManager.tier, "user");

        await client.post("/api/vote", {
          id: fullname,
          dir: String(dir),
        });

        const label = VOTE_LABELS[dir] ?? "Voted on";
        return {
          content: [{ type: "text" as const, text: `${label} ${fullname}` }],
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
          content: [{ type: "text" as const, text: `Failed to vote: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
