/**
 * Get trending tool for the Reddit MCP Server.
 *
 * Retrieves popular subreddits with subscriber counts and descriptions.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Listing, RedditSubreddit, Thing } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_trending` tool on the MCP server.
 *
 * Returns popular subreddits with subscriber counts, descriptions, and pagination.
 * Works at all auth tiers.
 */
export function registerGetTrendingTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_trending",
    "Get popular subreddits. Returns a list of subreddits with subscriber counts and descriptions.",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Number of subreddits to return (1-100)"),
      after: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response for next page"),
    },
    async ({ limit, after }) => {
      try {
        const params: Record<string, string> = {
          limit: String(limit ?? 25),
        };
        if (after) params.after = after;

        const response = await client.get<Listing<RedditSubreddit>>(
          "/subreddits/popular",
          params,
        );
        const listing = response.data;

        const subreddits = listing.data.children.map((child: Thing<RedditSubreddit>) => ({
          name: child.data.display_name,
          title: child.data.title,
          description: child.data.public_description,
          subscribers: child.data.subscribers,
          active_users: child.data.active_user_count,
          is_nsfw: child.data.over18, // NOTE: subreddits use over18 (no underscore)
          url: child.data.url,
          type: child.data.subreddit_type,
          created_utc: child.data.created_utc,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  subreddits,
                  after: listing.data.after,
                  count: listing.data.dist ?? subreddits.length,
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
              text: `Failed to get trending subreddits: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
