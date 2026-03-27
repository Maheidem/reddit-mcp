/**
 * Search tool for the Reddit MCP Server.
 *
 * Searches posts across Reddit or within a specific subreddit.
 * Supports sort, time filter, and pagination.
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
 * Register the `search` tool on the MCP server.
 *
 * Searches Reddit posts by query, optionally scoped to a subreddit.
 * Works at all auth tiers (anonymous and above).
 */
export function registerSearchTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "search",
    "Search Reddit posts by query. Optionally scope to a subreddit. Supports sort, time filter, and pagination.",
    {
      q: z.string().describe("Search query string"),
      subreddit: z
        .string()
        .optional()
        .describe(
          "Subreddit to search within (without r/ prefix). Omit to search all of Reddit.",
        ),
      sort: z
        .enum(["relevance", "hot", "top", "new"])
        .optional()
        .default("relevance")
        .describe("Sort order for results"),
      time: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .default("all")
        .describe("Time filter for results"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Number of results to return (1-100)"),
      after: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response for next page"),
    },
    async ({ q, subreddit, sort, time, limit, after }) => {
      try {
        const path = subreddit ? `/r/${subreddit}/search` : "/search";
        const params: Record<string, string> = {
          q,
          sort: sort ?? "relevance",
          t: time ?? "all",
          limit: String(limit ?? 25),
        };
        if (subreddit) params.restrict_sr = "true";
        if (after) params.after = after;

        const response = await client.get<Listing<RedditPost>>(path, params);
        const listing = response.data;

        const posts = listing.data.children.map((child: Thing<RedditPost>) => ({
          id: child.data.name,
          title: child.data.title,
          author: child.data.author,
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
                { posts, after: listing.data.after, count: listing.data.dist ?? posts.length },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Search failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
