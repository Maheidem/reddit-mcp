/**
 * Get user tool for the Reddit MCP Server.
 *
 * Retrieves a Reddit user's profile with karma and status information.
 * Handles suspended, deleted, and shadow-banned users.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { Thing, RedditUser } from "../../reddit/types.js";
import type { RedditConfig } from "../../reddit/config.js";

/**
 * Register the `get_user` tool on the MCP server.
 *
 * Returns a Reddit user's profile including karma breakdown and account age.
 * Works at all auth tiers.
 */
export function registerGetUserTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_user",
    "Get a Reddit user's profile. Returns karma, account age, and status information.",
    {
      username: z.string().describe("Reddit username (without u/ prefix)"),
    },
    async ({ username }) => {
      try {
        const response = await client.get<Thing<RedditUser>>(`/user/${username}/about`);
        const user = response.data.data;

        const result = {
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
          snoovatar_img: user.snoovatar_img ?? null,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("404") || message.includes("Not Found")) {
          return {
            content: [
              {
                type: "text" as const,
                text: `User not found: u/${username}. The user may be deleted or shadow-banned.`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: "text" as const, text: `Failed to get user: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
