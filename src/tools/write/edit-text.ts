/**
 * `edit_text` tool — edit the body of a self-post or comment.
 *
 * Re-appends bot footer after the new text.
 * Uses `POST /api/editusertext`. Requires `edit` scope.
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
  validateBody,
  validateComment,
  appendBotFooter,
  contentLengthWithFooter,
  CONTENT_LIMITS,
} from "../../utils/safety.js";

/** Shape of the Reddit editusertext response. */
interface EditResponse {
  json: {
    errors: string[][];
    data: {
      things: Array<{ data: { name: string; body: string } }>;
    };
  };
}

/**
 * Register the `edit_text` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerEditText(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "edit_text",
    "Edit the body text of your own self-post (t3_xxx) or comment (t1_xxx). Bot footer is re-appended. Requires user-level authentication (Tier 3).",
    {
      fullname: z
        .string()
        .describe("Fullname of the content to edit (t3_xxx for post, t1_xxx for comment)"),
      text: z
        .string()
        .describe("New body text in Markdown. Replaces the existing content entirely."),
    },
    async ({ fullname, text }) => {
      try {
        requireAuth(authManager.tier, "user");

        // Determine limit based on content type
        const isPost = fullname.startsWith("t3_");
        const limit = isPost ? CONTENT_LIMITS.BODY_STANDARD : CONTENT_LIMITS.COMMENT;

        // Validate content + footer fits within limit
        const totalLen = contentLengthWithFooter(text);
        if (totalLen > limit) {
          return {
            content: [
              {
                type: "text" as const,
                text: `text + bot footer exceeds ${limit.toLocaleString()} character limit (got ${totalLen}). Shorten your text.`,
              },
            ],
            isError: true,
          };
        }

        // Validate raw text
        const result = isPost ? validateBody(text) : validateComment(text);
        if (!result.valid) {
          return { content: [{ type: "text" as const, text: result.error! }], isError: true };
        }

        // Re-append bot footer
        const body = appendBotFooter(text);

        const response = await client.post<EditResponse>("/api/editusertext", {
          thing_id: fullname,
          text: body,
        });

        const things = response.data.json?.data?.things;
        const editedId = things?.[0]?.data?.name ?? fullname;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { id: editedId, message: "Content edited successfully" },
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
          content: [{ type: "text" as const, text: `Failed to edit content: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
