/**
 * Get user posts tool for the Reddit MCP Server.
 *
 * Lists a Reddit user's submitted posts with sort and pagination.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Listing, RedditPost, Thing } from "../../reddit/types.js";
import { detectPostType } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_user_posts` tool on the MCP server.
 *
 * Lists a Reddit user's submitted posts with sort, time filter, and pagination.
 * Works at all auth tiers.
 */
export function registerGetUserPostsTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_user_posts",
    "List a Reddit user's submitted posts. Supports sort and pagination.",
    {
      username: z.string().describe("Reddit username (without u/ prefix)"),
      sort: z
        .enum(["hot", "new", "top"])
        .optional()
        .default("new")
        .describe("Sort order for posts"),
      time: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .default("all")
        .describe("Time filter — only applies to top sort"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Number of posts to return (1-100)"),
      after: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response for next page"),
    },
    async ({ username, sort, time, limit, after }) => {
      try {
        const effectiveSort = sort ?? "new";
        const params: Record<string, string> = {
          sort: effectiveSort,
          limit: String(limit ?? 25),
        };
        if (effectiveSort === "top") {
          params.t = time ?? "all";
        }
        if (after) params.after = after;

        const response = await client.get<Listing<RedditPost>>(
          `/user/${username}/submitted`,
          params,
        );
        const listing = response.data;

        const posts = listing.data.children.map((child: Thing<RedditPost>) => ({
          id: child.data.name,
          title: child.data.title,
          subreddit: child.data.subreddit,
          score: child.data.score,
          num_comments: child.data.num_comments,
          url: child.data.url,
          permalink: `https://reddit.com${child.data.permalink}`,
          created_utc: child.data.created_utc,
          post_type: detectPostType(child.data),
          is_nsfw: child.data.over_18,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  username,
                  posts,
                  after: listing.data.after,
                  count: listing.data.dist ?? posts.length,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get posts for u/${username}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
