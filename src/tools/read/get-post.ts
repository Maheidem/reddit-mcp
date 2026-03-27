/**
 * Get post tool for the Reddit MCP Server.
 *
 * Retrieves a single Reddit post by ID with full details.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Listing, RedditPost, RedditComment } from "../../reddit/types.js";
import { detectPostType } from "../../reddit/types.js";
import { isDeleted, isRemoved } from "../../utils/normalize.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_post` tool on the MCP server.
 *
 * Retrieves a single Reddit post by fullname (t3_xxx) or bare ID.
 * Works at all auth tiers.
 */
export function registerGetPostTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_post",
    "Get a Reddit post by ID. Returns full post details including title, body, score, and metadata.",
    {
      post_id: z
        .string()
        .describe("Post ID — either fullname (t3_xxx) or bare ID (xxx)"),
      subreddit: z
        .string()
        .optional()
        .describe("Subreddit the post is in (without r/ prefix). Helps with faster lookup."),
    },
    async ({ post_id, subreddit }) => {
      try {
        const bareId = post_id.startsWith("t3_") ? post_id.slice(3) : post_id;
        let post: RedditPost;

        if (subreddit) {
          // GET /r/{sub}/comments/{id} returns [post_listing, comment_listing]
          const response = await client.get<[Listing<RedditPost>, Listing<RedditComment>]>(
            `/r/${subreddit}/comments/${bareId}`,
          );
          const postListing = response.data[0];
          if (!postListing.data.children.length) {
            return {
              content: [{ type: "text" as const, text: `Post not found: ${post_id}` }],
              isError: true,
            };
          }
          post = postListing.data.children[0].data;
        } else {
          // GET /api/info with id=t3_{id}
          const fullname = post_id.startsWith("t3_") ? post_id : `t3_${post_id}`;
          const response = await client.get<Listing<RedditPost>>("/api/info", { id: fullname });
          if (!response.data.data.children.length) {
            return {
              content: [{ type: "text" as const, text: `Post not found: ${post_id}` }],
              isError: true,
            };
          }
          post = response.data.data.children[0].data;
        }

        const result = {
          id: post.name,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          selftext: post.selftext,
          url: post.url,
          permalink: `https://reddit.com${post.permalink}`,
          score: post.score,
          upvote_ratio: post.upvote_ratio,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          edited: post.edited,
          post_type: detectPostType(post),
          is_nsfw: post.over_18,
          is_spoiler: post.spoiler,
          is_locked: post.locked,
          is_stickied: post.stickied,
          is_deleted: isDeleted(post),
          is_removed: isRemoved(post),
          link_flair: post.link_flair_text,
          domain: post.domain,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Failed to get post: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
