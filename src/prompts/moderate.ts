/**
 * Reddit Moderation MCP Prompt for the Reddit MCP Server.
 *
 * Provides a structured moderation workflow template that guides the LLM
 * through reviewing the modqueue and taking appropriate actions.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the `reddit_moderate` prompt on the MCP server.
 *
 * Generates a moderation workflow that references `get_modqueue`,
 * `approve`, `remove`, and `ban_user` tools by name.
 */
export function registerModeratePrompt(server: McpServer): void {
  server.prompt(
    "reddit_moderate",
    "Review modqueue and take moderation actions. Guides systematic review of reported content.",
    {
      subreddit: z
        .string()
        .describe("The subreddit to moderate (without r/ prefix)"),
    },
    ({ subreddit }) => {
      const text = `# Moderation Review: r/${subreddit}

## Objective
Systematically review the moderation queue for r/${subreddit} and take appropriate actions on reported/flagged content.

## Moderation Workflow

### Step 1: Review Subreddit Rules
Before moderating, understand the community standards:
- Use \`get_subreddit_rules\` to fetch r/${subreddit}'s rules
- Use \`get_subreddit\` to understand the subreddit's description and type
- Note any specific content policies or restrictions

### Step 2: Check the Modqueue
Use \`get_modqueue\` with subreddit "${subreddit}" to retrieve items pending review.
- Review each item's content, author, and reason for being flagged
- Check the report reasons — they indicate what community members flagged

### Step 3: Evaluate Each Item
For each modqueue item, assess whether it violates subreddit rules:

**Approve** (using the \`approve\` tool) if the content:
- Does not violate any subreddit rules
- Was incorrectly reported or auto-flagged
- Is borderline but ultimately acceptable

**Remove** (using the \`remove\` tool) if the content:
- Clearly violates one or more subreddit rules
- Is spam, harassment, or otherwise harmful
- Contains prohibited content types

**Ban** (using the \`ban_user\` tool) if the user:
- Is a repeat offender with multiple violations
- Posted egregious content (hate speech, doxxing, etc.)
- Is clearly a spam bot
- Always include a ban reason and appropriate duration

### Step 4: Check Mod Log
After taking actions, use \`get_mod_log\` to verify your actions were recorded and review recent moderation history for patterns.

### Step 5: Review Mod Notes
Use \`get_mod_notes\` for any users you're unsure about — check their moderation history for prior warnings or violations.

## Guidelines
- When in doubt, start with the least restrictive action
- Temporary bans are preferred over permanent bans for first offenses
- Document your reasoning in removal messages
- Be consistent — similar violations should receive similar actions
- Check user history with \`get_user_posts\` and \`get_user_comments\` if unsure about intent`;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text,
            },
          },
        ],
      };
    },
  );
}
