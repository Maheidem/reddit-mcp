/**
 * `create_comment` tool — reply to a post or comment.
 *
 * Validates content length, appends bot footer,
 * then calls `POST /api/comment`.
 * Requires Tier 3 auth with `submit` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";
import {
  validateComment,
  appendBotFooter,
  contentLengthWithFooter,
  CONTENT_LIMITS,
} from "../../utils/safety.js";

/** Shape of the Reddit comment response. */
interface CommentResponse {
  json: {
    errors: string[][];
    data: {
      things: Array<{ data: { name: string; id: string } }>;
    };
  };
}

/**
 * Register the `create_comment` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerCreateComment(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "create_comment",
    "Reply to a post (t3_xxx) or comment (t1_xxx). Requires user-level authentication (Tier 3).",
    {
      parent: z
        .string()
        .describe("Fullname of the parent to reply to (t3_xxx for post, t1_xxx for comment)"),
      text: z
        .string()
        .describe("Comment text in Markdown (max 10,000 characters)"),
    },
    async ({ parent, text }) => {
      try {
        requireAuth(authManager.tier, "user");

        // Validate content + footer fits within limit
        const totalLen = contentLengthWithFooter(text);
        if (totalLen > CONTENT_LIMITS.COMMENT) {
          return {
            content: [
              {
                type: "text" as const,
                text: `comment + bot footer exceeds ${CONTENT_LIMITS.COMMENT.toLocaleString()} character limit (got ${totalLen}). Shorten your text.`,
              },
            ],
            isError: true,
          };
        }

        const commentResult = validateComment(text);
        if (!commentResult.valid) {
          return {
            content: [{ type: "text" as const, text: commentResult.error! }],
            isError: true,
          };
        }

        const body = appendBotFooter(text);

        const response = await client.post<CommentResponse>("/api/comment", {
          parent,
          text: body,
        });

        const things = response.data.json?.data?.things;
        const commentId = things?.[0]?.data?.name;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  id: commentId ?? "unknown",
                  parent,
                  message: "Comment created successfully",
                },
                null,
                2,
              ),
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
          content: [{ type: "text" as const, text: `Failed to create comment: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
