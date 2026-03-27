/**
 * Subreddit MCP Resources for the Reddit MCP Server.
 *
 * Exposes subreddit info and rules as cacheable MCP resources
 * via `reddit://subreddit/{name}/info` and `reddit://subreddit/{name}/rules`.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { Thing, RedditSubreddit } from "../reddit/types.js";
import type { RedditConfig } from "../reddit/config.js";

/** Response shape from GET /r/{sub}/about/rules. */
interface SubredditRule {
  kind: string;
  short_name: string;
  description: string;
  violation_reason: string;
}

interface RulesResponse {
  rules: SubredditRule[];
}

/**
 * Register subreddit info and rules resources on the MCP server.
 *
 * - `reddit://subreddit/{name}/info` — subreddit metadata
 * - `reddit://subreddit/{name}/rules` — subreddit rules list
 */
export function registerSubredditResources(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  // Subreddit info resource
  server.resource(
    "subreddit_info",
    new ResourceTemplate("reddit://subreddit/{name}/info", { list: undefined }),
    { description: "Subreddit metadata including description, subscriber count, and settings" },
    async (uri, variables) => {
      const name = variables.name as string;
      const response = await client.get<Thing<RedditSubreddit>>(`/r/${name}/about`);
      const sub = response.data.data;

      const data = {
        name: sub.display_name,
        title: sub.title,
        description: sub.public_description,
        full_description: sub.description,
        subscribers: sub.subscribers,
        active_users: sub.active_user_count,
        created_utc: sub.created_utc,
        is_nsfw: sub.over18,
        type: sub.subreddit_type,
        url: sub.url,
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

  // Subreddit rules resource
  server.resource(
    "subreddit_rules",
    new ResourceTemplate("reddit://subreddit/{name}/rules", { list: undefined }),
    { description: "Subreddit rules with descriptions and applicable scope" },
    async (uri, variables) => {
      const name = variables.name as string;
      const response = await client.get<RulesResponse>(`/r/${name}/about/rules`);
      const rules = (response.data.rules ?? []).map((rule) => ({
        kind: rule.kind,
        name: rule.short_name,
        description: rule.description,
        violation_reason: rule.violation_reason,
      }));

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({ subreddit: name, rules, count: rules.length }, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    },
  );
}
