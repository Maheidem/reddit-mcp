/**
 * Get comments tool for the Reddit MCP Server.
 *
 * Retrieves the comment tree for a Reddit post with sort and depth control.
 * Handles the `replies: ""` quirk and "more" comment stubs.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Listing, RedditPost, RedditComment } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/** Flattened comment for the response. */
interface FormattedComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  edited: boolean | number;
  depth: number;
  is_submitter: boolean;
  is_deleted: boolean;
  is_removed: boolean;
  distinguished: string | null;
  stickied: boolean;
}

/** Stub for comments not yet loaded. */
interface MoreComments {
  type: "more";
  count: number;
  parent_id: string;
  children: string[];
}

/**
 * Flatten a nested comment Listing into a depth-ordered array.
 * Handles `replies: ""` (empty string = no replies).
 */
function flattenComments(
  listing: Listing<RedditComment>,
  result: { comments: FormattedComment[]; more: MoreComments[] },
): void {
  for (const child of listing.data.children) {
    if (child.kind === "more") {
      const moreData = child.data as unknown as {
        count: number;
        parent_id: string;
        children: string[];
      };
      result.more.push({
        type: "more",
        count: moreData.count,
        parent_id: moreData.parent_id,
        children: moreData.children ?? [],
      });
      continue;
    }

    const comment = child.data as RedditComment;

    result.comments.push({
      id: comment.name,
      author: comment.author,
      body: comment.body,
      score: comment.score,
      created_utc: comment.created_utc,
      edited: comment.edited,
      depth: comment.depth,
      is_submitter: comment.is_submitter,
      is_deleted: comment.author === "[deleted]" && comment.body === "[deleted]",
      is_removed: comment.body === "[removed]",
      distinguished: comment.distinguished,
      stickied: comment.stickied,
    });

    // Recurse into replies — handle replies: "" (empty string) quirk
    if (comment.replies && typeof comment.replies !== "string") {
      flattenComments(comment.replies, result);
    }
  }
}

/**
 * Register the `get_comments` tool on the MCP server.
 *
 * Retrieves a threaded comment tree for a Reddit post.
 * Works at all auth tiers.
 */
export function registerGetCommentsTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_comments",
    "Get comments for a Reddit post. Returns threaded comment tree with sort and depth control.",
    {
      post_id: z
        .string()
        .describe("Post ID — either fullname (t3_xxx) or bare ID (xxx)"),
      subreddit: z.string().describe("Subreddit the post is in (without r/ prefix)"),
      sort: z
        .enum(["best", "top", "new", "controversial", "old"])
        .optional()
        .default("best")
        .describe("Comment sort order"),
      depth: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe("Maximum depth of comment tree to return (0 = top-level only)"),
      limit: z
        .number()
        .min(1)
        .max(500)
        .optional()
        .default(200)
        .describe("Maximum number of comments to return"),
    },
    async ({ post_id, subreddit, sort, depth, limit }) => {
      try {
        const bareId = post_id.startsWith("t3_") ? post_id.slice(3) : post_id;
        const params: Record<string, string> = {
          sort: sort ?? "best",
          limit: String(limit ?? 200),
        };
        if (depth !== undefined) params.depth = String(depth);

        const response = await client.get<[Listing<RedditPost>, Listing<RedditComment>]>(
          `/r/${subreddit}/comments/${bareId}`,
          params,
        );

        const commentListing = response.data[1];
        const result: { comments: FormattedComment[]; more: MoreComments[] } = {
          comments: [],
          more: [],
        };
        flattenComments(commentListing as unknown as Listing<RedditComment>, result);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  post_id: post_id.startsWith("t3_") ? post_id : `t3_${post_id}`,
                  subreddit,
                  sort: sort ?? "best",
                  comments: result.comments,
                  more_comments: result.more,
                  total_comments: result.comments.length,
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
          content: [{ type: "text" as const, text: `Failed to get comments: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
