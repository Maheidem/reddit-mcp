/**
 * `ban_user` tool — ban a user from a subreddit.
 *
 * Supports temporary (1-999 days) and permanent bans.
 * Uses Reddit's relationship API (`POST /r/{sub}/api/friend` with `type=banned`).
 * Requires Tier 3 auth with `modcontributors` scope.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { requireAuth, AuthGuardError } from "../../reddit/auth-guard.js";
import { RedditApiError } from "../../reddit/errors.js";

/**
 * Register the `ban_user` tool on the MCP server.
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerBanUser(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  server.tool(
    "ban_user",
    "Mod-only: Ban a user from a subreddit. Supports temporary (1-999 days) and permanent bans with optional ban message and mod note. Requires moderator permissions and user-level authentication.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      username: z.string().describe("Username to ban (without u/ prefix)"),
      duration: z
        .number()
        .int()
        .min(0)
        .max(999)
        .optional()
        .describe("Ban duration in days: 1-999 for temporary, 0 or omit for permanent"),
      reason: z
        .string()
        .max(300)
        .optional()
        .describe("Internal mod note for the ban (visible only to other mods, max 300 chars)"),
      message: z
        .string()
        .optional()
        .describe("Message sent to the banned user via PM"),
    },
    async ({ subreddit, username, duration, reason, message }) => {
      try {
        requireAuth(authManager.tier, "user");

        const body: Record<string, string> = {
          name: username,
          type: "banned",
        };

        if (duration !== undefined && duration > 0) {
          body.duration = String(duration);
        }
        if (reason) body.note = reason;
        if (message) body.ban_message = message;

        await client.post(`/r/${subreddit}/api/friend`, body);

        const durationText =
          duration && duration > 0 ? `${duration} day(s)` : "permanently";
        return {
          content: [
            {
              type: "text" as const,
              text: `Banned u/${username} from r/${subreddit} ${durationText}.`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof AuthGuardError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        if (error instanceof RedditApiError && error.status === 403) {
          return {
            content: [
              {
                type: "text" as const,
                text: `You do not have moderator permissions to ban users in r/${subreddit}.`,
              },
            ],
            isError: true,
          };
        }
        if (error instanceof RedditApiError) {
          return { content: [{ type: "text" as const, text: error.message }], isError: true };
        }
        throw error;
      }
    },
  );
}
