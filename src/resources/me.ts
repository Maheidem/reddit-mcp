/**
 * Authenticated user MCP Resource for the Reddit MCP Server.
 *
 * Exposes the authenticated user's profile as an MCP resource
 * via `reddit://me`. Requires Tier 3 (user) authentication.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { RedditConfig } from "../reddit/config.js";
import { requireAuth, AuthGuardError } from "../reddit/auth-guard.js";

/** Response shape from GET /api/v1/me. */
interface MeResponse {
  name: string;
  id: string;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  created_utc: number;
  inbox_count: number;
  has_mail: boolean;
  has_mod_mail: boolean;
  is_gold: boolean;
  is_mod: boolean;
  has_verified_email: boolean;
  icon_img: string;
  snoovatar_img?: string;
  over_18: boolean;
}

/**
 * Register the authenticated user resource on the MCP server.
 *
 * `reddit://me` — authenticated user profile. Requires user-level auth.
 */
export function registerMeResource(
  server: McpServer,
  client: RedditClient,
  config: RedditConfig,
): void {
  server.resource(
    "me",
    "reddit://me",
    { description: "Authenticated user's profile. Requires user-level authentication." },
    async (uri) => {
      try {
        requireAuth(config.tier, "user");
      } catch (error: unknown) {
        if (error instanceof AuthGuardError) {
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify({ error: error.message }),
                mimeType: "application/json",
              },
            ],
          };
        }
        throw error;
      }

      const response = await client.get<MeResponse>("/api/v1/me");
      const me = response.data;

      const data = {
        username: me.name,
        id: me.id,
        link_karma: me.link_karma,
        comment_karma: me.comment_karma,
        total_karma: me.total_karma,
        created_utc: me.created_utc,
        inbox_count: me.inbox_count,
        has_mail: me.has_mail,
        has_mod_mail: me.has_mod_mail,
        is_gold: me.is_gold,
        is_mod: me.is_mod,
        has_verified_email: me.has_verified_email,
        icon_img: me.icon_img,
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
