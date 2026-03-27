/**
 * MCP Resources barrel.
 *
 * Registers all Reddit MCP resources on the server.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { RedditConfig } from "../reddit/config.js";
import { registerSubredditResources } from "./subreddit.js";
import { registerUserResource } from "./user.js";
import { registerPostResource } from "./post.js";
import { registerWikiResource } from "./wiki.js";
import { registerMeResource } from "./me.js";

/**
 * Register all MCP resources on the server.
 *
 * Resources provide cacheable, addressable Reddit data via `reddit://` URIs:
 * - `reddit://subreddit/{name}/info` — subreddit metadata
 * - `reddit://subreddit/{name}/rules` — subreddit rules
 * - `reddit://user/{username}/about` — user profile
 * - `reddit://post/{id}` — post details
 * - `reddit://subreddit/{name}/wiki/{page}` — wiki page
 * - `reddit://me` — authenticated user profile
 */
export function registerResources(
  server: McpServer,
  client: RedditClient,
  config: RedditConfig,
): void {
  registerSubredditResources(server, client, config);
  registerUserResource(server, client, config);
  registerPostResource(server, client, config);
  registerWikiResource(server, client, config);
  registerMeResource(server, client, config);
}

export { registerSubredditResources } from "./subreddit.js";
export { registerUserResource } from "./user.js";
export { registerPostResource } from "./post.js";
export { registerWikiResource } from "./wiki.js";
export { registerMeResource } from "./me.js";
