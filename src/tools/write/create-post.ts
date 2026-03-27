/**
 * `create_post` tool — submit a text or link post to a subreddit.
 *
 * Validates content, appends bot footer (text posts only),
 * checks for duplicates, then calls `POST /api/submit`.
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
  validateTitle,
  validateBody,
  appendBotFooter,
  contentLengthWithFooter,
  DuplicateDetector,
  CONTENT_LIMITS,
} from "../../utils/safety.js";

/** Shared duplicate detector instance for post submissions. */
const duplicateDetector = new DuplicateDetector();

/** Shape of the Reddit submit response. */
interface SubmitResponse {
  json: {
    errors: string[][];
    data: {
      name: string;
      url: string;
      id: string;
    };
  };
}

/**
 * Register the `create_post` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerCreatePost(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "create_post",
    "Submit a text or link post to a subreddit. Requires user-level authentication (Tier 3).",
    {
      subreddit: z.string().describe("Target subreddit name (without r/ prefix)"),
      title: z.string().describe("Post title (max 300 characters)"),
      text: z
        .string()
        .optional()
        .describe("Self-post body text in Markdown (max 40,000 characters). Omit for link posts."),
      url: z
        .string()
        .optional()
        .describe("URL for a link post. Omit for self/text posts."),
      flair_id: z
        .string()
        .optional()
        .describe("Flair template ID (if the subreddit requires or supports flairs)"),
      nsfw: z
        .boolean()
        .optional()
        .describe("Mark post as NSFW. Defaults to false."),
      spoiler: z
        .boolean()
        .optional()
        .describe("Mark post as spoiler. Defaults to false."),
      force: z
        .boolean()
        .optional()
        .describe("Bypass duplicate detection. Defaults to false."),
    },
    async ({ subreddit, title, text, url, flair_id, nsfw, spoiler, force }) => {
      try {
        // Auth guard: require Tier 3
        requireAuth(authManager.tier, "user");

        // Determine post kind
        const isLink = !!url && !text;
        const kind = isLink ? "link" : "self";

        // Validate title
        const titleResult = validateTitle(title);
        if (!titleResult.valid) {
          return { content: [{ type: "text" as const, text: titleResult.error! }], isError: true };
        }

        // Validate body for text posts
        let submissionText = text ?? "";
        if (!isLink && submissionText) {
          // Check that body + footer stays within limit
          const totalLen = contentLengthWithFooter(submissionText);
          if (totalLen > CONTENT_LIMITS.BODY_STANDARD) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `body + bot footer exceeds ${CONTENT_LIMITS.BODY_STANDARD.toLocaleString()} character limit (got ${totalLen}). Shorten your text to leave room for the bot disclosure footer.`,
                },
              ],
              isError: true,
            };
          }
          const bodyResult = validateBody(submissionText);
          if (!bodyResult.valid) {
            return { content: [{ type: "text" as const, text: bodyResult.error! }], isError: true };
          }
          submissionText = appendBotFooter(submissionText);
        } else if (!isLink) {
          // Empty self post — still append footer
          submissionText = appendBotFooter("");
        }

        // Duplicate detection
        if (duplicateDetector.isDuplicate(subreddit, title, force)) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Duplicate detected: a post with this title was already submitted to r/${subreddit} recently. Use force=true to bypass.`,
              },
            ],
            isError: true,
          };
        }

        // Build POST body
        const body: Record<string, string> = {
          sr: subreddit,
          title,
          kind,
        };
        if (kind === "self") {
          body.text = submissionText;
        } else {
          body.url = url!;
        }
        if (flair_id) body.flair_id = flair_id;
        if (nsfw) body.nsfw = "true";
        if (spoiler) body.spoiler = "true";

        const response = await client.post<SubmitResponse>("/api/submit", body);

        const data = response.data.json?.data;
        if (!data) {
          return {
            content: [
              { type: "text" as const, text: "Post submitted but received unexpected response format." },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  id: data.name,
                  url: data.url,
                  message: `Post created successfully in r/${subreddit}`,
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
          content: [{ type: "text" as const, text: `Failed to create post: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
