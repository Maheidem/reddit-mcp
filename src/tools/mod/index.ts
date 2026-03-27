/**
 * Phase 1 Moderation Tools barrel.
 *
 * Registers all 6 mod tools on the MCP server.
 * All mod tools require Tier 3 (user) authentication
 * with appropriate mod scopes.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { registerGetModqueue } from "./get-modqueue.js";
import { registerApprove } from "./approve.js";
import { registerRemove } from "./remove.js";
import { registerBanUser } from "./ban-user.js";
import { registerGetModLog } from "./get-mod-log.js";
import { registerGetModNotes } from "./get-mod-notes.js";

/**
 * Register all Phase 1 moderation tools on the MCP server.
 *
 * Tools registered:
 * - `get_modqueue` — list items pending review (modposts + read)
 * - `approve` — approve content from modqueue (modposts)
 * - `remove` — remove content, optionally as spam (modposts)
 * - `ban_user` — ban user from subreddit (modcontributors)
 * - `get_mod_log` — view moderation action history (modlog)
 * - `get_mod_notes` — read mod notes for a user (modnote, 30 QPM)
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client with auth manager wired.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerModTools(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  registerGetModqueue(server, client, authManager);
  registerApprove(server, client, authManager);
  registerRemove(server, client, authManager);
  registerBanUser(server, client, authManager);
  registerGetModLog(server, client, authManager);
  registerGetModNotes(server, client, authManager);
}

export { registerGetModqueue } from "./get-modqueue.js";
export { registerApprove } from "./approve.js";
export { registerRemove } from "./remove.js";
export { registerBanUser } from "./ban-user.js";
export { registerGetModLog } from "./get-mod-log.js";
export { registerGetModNotes } from "./get-mod-notes.js";
