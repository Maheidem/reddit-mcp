/**
 * Get user comments tool for the Reddit MCP Server.
 *
 * Lists a Reddit user's comments with sort and pagination.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Listing, RedditComment, Thing } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_user_comments` tool on the MCP server.
 *
 * Lists a Reddit user's comments with sort, time filter, and pagination.
 * Works at all auth tiers.
 */
export function registerGetUserCommentsTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_user_comments",
    "List a Reddit user's comments. Supports sort and pagination.",
    {
      username: z.string().describe("Reddit username (without u/ prefix)"),
      sort: z
        .enum(["hot", "new", "top"])
        .optional()
        .default("new")
        .describe("Sort order for comments"),
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
        .describe("Number of comments to return (1-100)"),
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

        const response = await client.get<Listing<RedditComment>>(
          `/user/${username}/comments`,
          params,
        );
        const listing = response.data;

        const comments = listing.data.children.map((child: Thing<RedditComment>) => {
          const c = child.data;
          // Reddit includes link_title in user comment listings (not in our type)
          const linkTitle = (c as unknown as Record<string, unknown>).link_title as
            | string
            | undefined;

          return {
            id: c.name,
            author: c.author,
            body: c.body,
            subreddit: c.subreddit,
            score: c.score,
            created_utc: c.created_utc,
            edited: c.edited,
            permalink: `https://reddit.com${(c as unknown as Record<string, unknown>).permalink ?? ""}`,
            link_title: linkTitle ?? null,
            is_submitter: c.is_submitter,
            is_deleted: c.author === "[deleted]" && c.body === "[deleted]",
            is_removed: c.body === "[removed]",
          };
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  username,
                  comments,
                  after: listing.data.after,
                  count: listing.data.dist ?? comments.length,
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
              text: `Failed to get comments for u/${username}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
