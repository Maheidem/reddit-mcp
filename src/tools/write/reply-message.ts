/**
 * `reply_message` tool — reply to a private message.
 *
 * Uses the same `POST /api/comment` endpoint as comments,
 * but with a t4_xxx parent. Requires `privatemessages` scope.
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
  validateMessage,
  appendBotFooter,
  contentLengthWithFooter,
  CONTENT_LIMITS,
} from "../../utils/safety.js";

/** Shape of the Reddit comment/reply response. */
interface ReplyResponse {
  json: {
    errors: string[][];
    data: {
      things: Array<{ data: { name: string; id: string } }>;
    };
  };
}

/**
 * Register the `reply_message` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerReplyMessage(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "reply_message",
    "Reply to a private message (t4_xxx). Requires user-level authentication (Tier 3) with privatemessages scope.",
    {
      parent: z
        .string()
        .describe("Fullname of the message to reply to (t4_xxx)"),
      text: z
        .string()
        .describe("Reply text in Markdown (max 10,000 characters)"),
    },
    async ({ parent, text }) => {
      try {
        requireAuth(authManager.tier, "user");

        // Validate content + footer fits within limit
        const totalLen = contentLengthWithFooter(text);
        if (totalLen > CONTENT_LIMITS.MESSAGE) {
          return {
            content: [
              {
                type: "text" as const,
                text: `message + bot footer exceeds ${CONTENT_LIMITS.MESSAGE.toLocaleString()} character limit (got ${totalLen}). Shorten your text.`,
              },
            ],
            isError: true,
          };
        }

        const msgResult = validateMessage(text);
        if (!msgResult.valid) {
          return {
            content: [{ type: "text" as const, text: msgResult.error! }],
            isError: true,
          };
        }

        const body = appendBotFooter(text);

        const response = await client.post<ReplyResponse>("/api/comment", {
          parent,
          text: body,
        });

        const things = response.data.json?.data?.things;
        const replyId = things?.[0]?.data?.name;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  id: replyId ?? "unknown",
                  parent,
                  message: "Message reply sent successfully",
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
          content: [{ type: "text" as const, text: `Failed to reply to message: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
