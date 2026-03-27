/**
 * Get me tool for the Reddit MCP Server.
 *
 * Returns the authenticated user's own profile.
 * Requires Tier 3 (user) authentication.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditConfig } from "../../reddit/config.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";

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
  is_employee: boolean;
}

/**
 * Register the `get_me` tool on the MCP server.
 *
 * Returns the authenticated user's own profile data.
 * Requires Tier 3 (user) authentication — enforced via auth guard.
 */
export function registerGetMeTool(
  server: McpServer,
  client: RedditClient,
  config: RedditConfig,
): void {
  server.tool(
    "get_me",
    "Get the authenticated user's own profile. Requires user-level authentication. Returns username, karma, inbox count, and preferences.",
    {},
    async () => {
      try {
        // Enforce user-level auth
        requireAuth(config.tier, "user");

        const response = await client.get<MeResponse>("/api/v1/me");
        const me = response.data;

        const result = {
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
          snoovatar_img: me.snoovatar_img ?? null,
          is_over_18: me.over_18,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        if (error instanceof AuthGuardError) {
          return {
            content: [{ type: "text" as const, text: error.message }],
            isError: true,
          };
        }
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Failed to get profile: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
