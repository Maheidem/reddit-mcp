/**
 * Phase 1 Write Tools barrel.
 *
 * Registers all 7 write tools on the MCP server.
 * All write tools require Tier 3 (user) authentication.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { registerCreatePost } from "./create-post.js";
import { registerCreateComment } from "./create-comment.js";
import { registerReplyMessage } from "./reply-message.js";
import { registerEditText } from "./edit-text.js";
import { registerDeleteContent } from "./delete-content.js";
import { registerVote } from "./vote.js";
import { registerSendMessage } from "./send-message.js";

/**
 * Register all Phase 1 write tools on the MCP server.
 *
 * Tools registered:
 * - `create_post` — submit text or link post (submit scope)
 * - `create_comment` — reply to post or comment (submit scope)
 * - `reply_message` — reply to private message (privatemessages scope)
 * - `edit_text` — edit own post or comment body (edit scope)
 * - `delete_content` — permanently delete own post or comment (edit scope)
 * - `vote` — upvote/downvote/clear on post or comment (vote scope)
 * - `send_message` — send private message (privatemessages scope)
 *
 * @param server - MCP server instance.
 * @param client - Reddit HTTP client with auth manager wired.
 * @param authManager - Auth manager for tier/scope checks.
 */
export function registerWriteTools(
  server: McpServer,
  client: RedditClient,
  authManager: RedditAuthManager,
): void {
  registerCreatePost(server, client, authManager);
  registerCreateComment(server, client, authManager);
  registerReplyMessage(server, client, authManager);
  registerEditText(server, client, authManager);
  registerDeleteContent(server, client, authManager);
  registerVote(server, client, authManager);
  registerSendMessage(server, client, authManager);
}

export { registerCreatePost } from "./create-post.js";
export { registerCreateComment } from "./create-comment.js";
export { registerReplyMessage } from "./reply-message.js";
export { registerEditText } from "./edit-text.js";
export { registerDeleteContent } from "./delete-content.js";
export { registerVote } from "./vote.js";
export { registerSendMessage } from "./send-message.js";
