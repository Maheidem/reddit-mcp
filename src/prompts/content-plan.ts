/**
 * Reddit Content Plan MCP Prompt for the Reddit MCP Server.
 *
 * Provides a structured content strategy workflow template that guides
 * the LLM through researching, analyzing, and planning content for a subreddit.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the `reddit_content_plan` prompt on the MCP server.
 *
 * Generates a content strategy workflow that references read and write
 * tools to research what works and plan new content.
 */
export function registerContentPlanPrompt(server: McpServer): void {
  server.prompt(
    "reddit_content_plan",
    "Plan a content strategy for a subreddit. Guides research, analysis, and content creation.",
    {
      subreddit: z
        .string()
        .describe("The target subreddit for content planning (without r/ prefix)"),
      goal: z
        .string()
        .describe("The content goal (e.g. 'increase engagement', 'share tutorials', 'build community presence')"),
    },
    ({ subreddit, goal }) => {
      const text = `# Content Strategy: r/${subreddit}

## Goal
${goal}

## Content Planning Workflow

### Step 1: Understand the Community
Research r/${subreddit} to understand what content resonates:
- Use \`get_subreddit\` to review the subreddit's description, subscriber count, and activity level
- Use \`get_subreddit_rules\` to understand posting guidelines and restrictions
- Use \`get_subreddit_posts\` with sort "top" and time "month" to identify high-performing content patterns
- Use \`get_subreddit_posts\` with sort "hot" to see what's currently trending

### Step 2: Analyze Top Content
For the highest-scoring posts found in Step 1:
- Use \`get_post\` to examine post structure, formatting, and content style
- Use \`get_comments\` to understand what drives discussion and engagement
- Note patterns: post type (text/link/image), title style, posting time, content length
- Identify content gaps — topics the community wants but aren't being covered

### Step 3: Study the Competition
Look at successful contributors:
- Use \`search\` to find posts related to your goal in r/${subreddit}
- Use \`get_trending\` to discover related subreddits for cross-posting opportunities
- Identify what differentiates high-engagement posts from low-engagement ones

### Step 4: Create Content Plan
Based on your research, outline:

1. **Content themes** — 3-5 recurring topics that align with "${goal}"
2. **Post formats** — which formats work best (text guides, links, questions, discussions)
3. **Title strategies** — patterns from successful posts (questions, how-tos, case studies)
4. **Engagement tactics** — how to encourage comments and discussion
5. **Cross-posting** — related subreddits where content could also be shared

### Step 5: Draft Content
When ready to create content:
- Use \`create_post\` to publish posts to r/${subreddit}
- Use \`create_comment\` to engage in existing discussions (builds credibility before posting)
- Follow subreddit rules strictly — rule violations can result in bans

## Tips
- Consistency matters more than volume — regular posting builds recognition
- Engage with comments on your posts to boost visibility
- Provide genuine value — communities reward helpful, authentic content
- Respect self-promotion limits (most subreddits enforce a 10:1 ratio of community participation to self-promotion)
- Check subreddit wiki pages for additional posting guidelines`;

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
