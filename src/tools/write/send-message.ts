/**
 * `send_message` tool — send a private message to a Reddit user.
 *
 * Validates subject/body length, appends bot footer to body,
 * then calls `POST /api/compose`.
 * Requires Tier 3 auth with `privatemessages` scope.
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

/** Maximum subject length for Reddit private messages. */
const SUBJECT_MAX_LENGTH = 100;

/**
 * Register the `send_message` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerSendMessage(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "send_message",
    "Send a private message to a Reddit user. Requires user-level authentication (Tier 3) with privatemessages scope.",
    {
      to: z
        .string()
        .describe("Recipient username (without u/ prefix)"),
      subject: z
        .string()
        .describe("Message subject (max 100 characters)"),
      text: z
        .string()
        .describe("Message body in Markdown (max 10,000 characters)"),
    },
    async ({ to, subject, text }) => {
      try {
        requireAuth(authManager.tier, "user");

        // Validate subject length
        if ([...subject].length === 0) {
          return {
            content: [{ type: "text" as const, text: "subject must not be empty" }],
            isError: true,
          };
        }
        if ([...subject].length > SUBJECT_MAX_LENGTH) {
          return {
            content: [
              {
                type: "text" as const,
                text: `subject exceeds ${SUBJECT_MAX_LENGTH} character limit (got ${[...subject].length})`,
              },
            ],
            isError: true,
          };
        }

        // Validate body + footer fits within limit
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
          return { content: [{ type: "text" as const, text: msgResult.error! }], isError: true };
        }

        const body = appendBotFooter(text);

        // Strip u/ prefix if user included it
        const recipient = to.startsWith("u/") ? to.slice(2) : to;

        await client.post("/api/compose", {
          to: recipient,
          subject,
          text: body,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { to: recipient, subject, message: "Message sent successfully" },
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
          content: [{ type: "text" as const, text: `Failed to send message: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
