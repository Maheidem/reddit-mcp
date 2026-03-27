/**
 * Get subreddit tool for the Reddit MCP Server.
 *
 * Retrieves subreddit information including description, subscribers, and status.
 * Handles private, banned, and nonexistent subreddit edge cases.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Thing, RedditSubreddit } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_subreddit` tool on the MCP server.
 *
 * Returns subreddit metadata including description, subscriber count,
 * and NSFW status. Works at all auth tiers.
 */
export function registerGetSubredditTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_subreddit",
    "Get subreddit information including description, subscriber count, and rules. Returns key metadata about a subreddit.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
    },
    async ({ subreddit }) => {
      try {
        const response = await client.get<Thing<RedditSubreddit>>(`/r/${subreddit}/about`);
        const sub = response.data.data;

        // Check if we got redirected to search (nonexistent sub)
        if (!sub || !sub.display_name) {
          return {
            content: [
              { type: "text" as const, text: `Subreddit not found: r/${subreddit}` },
            ],
            isError: true,
          };
        }

        const result = {
          name: sub.display_name,
          title: sub.title,
          description: sub.public_description,
          full_description: sub.description,
          subscribers: sub.subscribers,
          active_users: sub.active_user_count,
          created_utc: sub.created_utc,
          is_nsfw: sub.over18, // NOTE: subreddits use over18 (no underscore)
          type: sub.subreddit_type,
          url: sub.url,
          lang: sub.lang,
          allow_images: sub.allow_images,
          allow_videos: sub.allow_videos,
          allow_polls: sub.allow_polls,
          user_is_subscriber: sub.user_is_subscriber,
          user_is_moderator: sub.user_is_moderator,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("403") || message.includes("Forbidden")) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Subreddit r/${subreddit} is private or banned.`,
              },
            ],
            isError: true,
          };
        }
        if (message.includes("404") || message.includes("Not Found")) {
          return {
            content: [
              { type: "text" as const, text: `Subreddit not found: r/${subreddit}` },
            ],
            isError: true,
          };
        }
        return {
          content: [
            { type: "text" as const, text: `Failed to get subreddit: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
}
