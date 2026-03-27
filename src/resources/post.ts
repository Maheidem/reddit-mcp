/**
 * Post details MCP Resource for the Reddit MCP Server.
 *
 * Exposes post details as cacheable MCP resources
 * via `reddit://post/{id}`.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { Listing, RedditPost } from "../reddit/types.js";
import { detectPostType } from "../reddit/types.js";
import { isDeleted, isRemoved } from "../utils/normalize.js";
import type { RedditConfig } from "../reddit/config.js";

/**
 * Register the post details resource on the MCP server.
 *
 * `reddit://post/{id}` — full post details. Accepts bare ID or t3_ prefixed.
 */
export function registerPostResource(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.resource(
    "post_details",
    new ResourceTemplate("reddit://post/{id}", { list: undefined }),
    { description: "Reddit post details including title, body, score, and metadata" },
    async (uri, variables) => {
      const postId = variables.id as string;
      const fullname = postId.startsWith("t3_") ? postId : `t3_${postId}`;

      const response = await client.get<Listing<RedditPost>>("/api/info", { id: fullname });

      if (!response.data.data.children.length) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: `Post not found: ${postId}` }),
              mimeType: "application/json",
            },
          ],
        };
      }

      const post = response.data.data.children[0].data;

      const data = {
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
        is_deleted: isDeleted(post),
        is_removed: isRemoved(post),
        link_flair: post.link_flair_text,
        domain: post.domain,
      };

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(data, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    },
  );
}
