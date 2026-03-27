/**
 * Read tools barrel and registration for the Reddit MCP Server.
 *
 * Registers all 12 Phase 1 read tools on the MCP server instance.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditConfig } from "../../reddit/config.js";

import { registerSearchTool } from "./search.js";
import { registerGetPostTool } from "./get-post.js";
import { registerGetCommentsTool } from "./get-comments.js";
import { registerGetSubredditTool } from "./get-subreddit.js";
import { registerGetSubredditRulesTool } from "./get-subreddit-rules.js";
import { registerGetSubredditPostsTool } from "./get-subreddit-posts.js";
import { registerGetUserTool } from "./get-user.js";
import { registerGetUserPostsTool } from "./get-user-posts.js";
import { registerGetUserCommentsTool } from "./get-user-comments.js";
import { registerGetTrendingTool } from "./get-trending.js";
import { registerGetWikiPageTool } from "./get-wiki-page.js";
import { registerGetMeTool } from "./get-me.js";

/**
 * Register all 12 Phase 1 read tools on the MCP server.
 *
 * Tools registered:
 * - `search` — Search Reddit posts
 * - `get_post` — Get a post by ID
 * - `get_comments` — Get comment tree for a post
 * - `get_subreddit` — Get subreddit info
 * - `get_subreddit_rules` — Get subreddit rules
 * - `get_subreddit_posts` — List posts from a subreddit
 * - `get_user` — Get user profile
 * - `get_user_posts` — List user's posts
 * - `get_user_comments` — List user's comments
 * - `get_trending` — Get popular subreddits
 * - `get_wiki_page` — Read a wiki page
 * - `get_me` — Get authenticated user's profile
 *
 * @param server - The MCP server instance to register tools on.
 * @param client - The Reddit HTTP client for API calls.
 * @param config - The Reddit configuration with auth tier info.
 */
export function registerReadTools(
  server: McpServer,
  client: RedditClient,
  config: RedditConfig,
): void {
  registerSearchTool(server, client, config);
  registerGetPostTool(server, client, config);
  registerGetCommentsTool(server, client, config);
  registerGetSubredditTool(server, client, config);
  registerGetSubredditRulesTool(server, client, config);
  registerGetSubredditPostsTool(server, client, config);
  registerGetUserTool(server, client, config);
  registerGetUserPostsTool(server, client, config);
  registerGetUserCommentsTool(server, client, config);
  registerGetTrendingTool(server, client, config);
  registerGetWikiPageTool(server, client, config);
  registerGetMeTool(server, client, config);
}

// Re-export individual registration functions for selective use
export { registerSearchTool } from "./search.js";
export { registerGetPostTool } from "./get-post.js";
export { registerGetCommentsTool } from "./get-comments.js";
export { registerGetSubredditTool } from "./get-subreddit.js";
export { registerGetSubredditRulesTool } from "./get-subreddit-rules.js";
export { registerGetSubredditPostsTool } from "./get-subreddit-posts.js";
export { registerGetUserTool } from "./get-user.js";
export { registerGetUserPostsTool } from "./get-user-posts.js";
export { registerGetUserCommentsTool } from "./get-user-comments.js";
export { registerGetTrendingTool } from "./get-trending.js";
export { registerGetWikiPageTool } from "./get-wiki-page.js";
export { registerGetMeTool } from "./get-me.js";
