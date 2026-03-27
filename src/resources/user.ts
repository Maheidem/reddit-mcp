/**
 * User profile MCP Resource for the Reddit MCP Server.
 *
 * Exposes user profiles as cacheable MCP resources
 * via `reddit://user/{username}/about`.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { Thing, RedditUser } from "../reddit/types.js";
import type { RedditConfig } from "../reddit/config.js";

/**
 * Register the user profile resource on the MCP server.
 *
 * `reddit://user/{username}/about` — user profile summary.
 */
export function registerUserResource(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.resource(
    "user_profile",
    new ResourceTemplate("reddit://user/{username}/about", { list: undefined }),
    { description: "Reddit user profile with karma, account age, and status" },
    async (uri, variables) => {
      const username = variables.username as string;
      const response = await client.get<Thing<RedditUser>>(`/user/${username}/about`);
      const user = response.data.data;

      const data = {
        username: user.name,
        id: user.id,
        link_karma: user.link_karma,
        comment_karma: user.comment_karma,
        total_karma: user.total_karma,
        created_utc: user.created_utc,
        is_gold: user.is_gold,
        is_mod: user.is_mod,
        has_verified_email: user.has_verified_email,
        icon_img: user.icon_img,
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
