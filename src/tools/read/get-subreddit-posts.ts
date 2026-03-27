/**
 * Get subreddit posts tool for the Reddit MCP Server.
 *
 * Lists posts from a subreddit feed with sort, time filter, and pagination.
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
 * Register the `get_subreddit_posts` tool on the MCP server.
 *
 * Lists posts from a subreddit with 5 sort modes and pagination.
 * Time filter only applies to `top` and `controversial` sorts.
 * Works at all auth tiers.
 */
export function registerGetSubredditPostsTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_subreddit_posts",
    "List posts from a subreddit feed. Supports hot, new, top, rising, and controversial sort modes with pagination.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      sort: z
        .enum(["hot", "new", "top", "rising", "controversial"])
        .optional()
        .default("hot")
        .describe("Sort mode for posts"),
      time: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .default("day")
        .describe("Time filter — only applies to top and controversial sorts"),
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
    async ({ subreddit, sort, time, limit, after }) => {
      try {
        const effectiveSort = sort ?? "hot";
        const path = `/r/${subreddit}/${effectiveSort}`;
        const params: Record<string, string> = {
          limit: String(limit ?? 25),
        };

        // Time filter only applies to top and controversial
        if (effectiveSort === "top" || effectiveSort === "controversial") {
          params.t = time ?? "day";
        }

        if (after) params.after = after;

        const response = await client.get<Listing<RedditPost>>(path, params);
        const listing = response.data;

        const posts = listing.data.children.map((child: Thing<RedditPost>) => ({
          id: child.data.name,
          title: child.data.title,
          author: child.data.author,
          subreddit: child.data.subreddit,
          score: child.data.score,
          upvote_ratio: child.data.upvote_ratio,
          num_comments: child.data.num_comments,
          url: child.data.url,
          permalink: `https://reddit.com${child.data.permalink}`,
          created_utc: child.data.created_utc,
          post_type: detectPostType(child.data),
          is_nsfw: child.data.over_18,
          is_spoiler: child.data.spoiler,
          is_stickied: child.data.stickied,
          is_locked: child.data.locked,
          link_flair: child.data.link_flair_text,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  subreddit,
                  sort: effectiveSort,
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
              text: `Failed to get posts from r/${subreddit}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
