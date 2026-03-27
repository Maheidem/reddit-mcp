/**
 * Reddit User Analysis MCP Prompt for the Reddit MCP Server.
 *
 * Provides a structured user analysis workflow template that guides
 * the LLM through examining a Reddit user's profile, posts, and comments.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register the `reddit_user_analysis` prompt on the MCP server.
 *
 * Generates a user analysis workflow that references `get_user`,
 * `get_user_posts`, and `get_user_comments` tools by name.
 */
export function registerUserAnalysisPrompt(server: McpServer): void {
  server.prompt(
    "reddit_user_analysis",
    "Analyze a Reddit user's posting history, engagement patterns, and interests.",
    {
      username: z
        .string()
        .describe("The Reddit username to analyze (without u/ prefix)"),
    },
    ({ username }) => {
      const text = `# User Analysis: u/${username}

## Objective
Build a comprehensive profile of u/${username}'s Reddit activity, interests, and engagement patterns.

## Analysis Workflow

### Step 1: Profile Overview
Use \`get_user\` with username "${username}" to retrieve their profile:
- Account age and total karma (link + comment)
- Whether they have verified email, Reddit Premium, or moderator status
- Profile description and avatar

### Step 2: Posting History
Use \`get_user_posts\` with username "${username}" to examine their submissions:
- What subreddits do they post in most frequently?
- What types of content do they share (text, links, images)?
- What are their highest-scored posts?
- How frequently do they post?
- What topics or themes recur in their posts?

### Step 3: Comment Activity
Use \`get_user_comments\` with username "${username}" to analyze their comments:
- Which subreddits do they comment in most?
- What is their typical comment length and style?
- Do they tend to ask questions, provide answers, or engage in debate?
- What are their highest-scored comments?
- Are they generally constructive, critical, or neutral in tone?

### Step 4: Pattern Analysis
Cross-reference posts and comments to identify:

1. **Primary interests** — top 3-5 topics/subreddits by activity volume
2. **Expertise areas** — where they consistently provide detailed, well-received answers
3. **Activity patterns** — posting frequency and engagement trends
4. **Community standing** — karma distribution, awards received, moderator roles
5. **Content style** — do they create original content, share links, or primarily comment?

### Step 5: Summary Report
Compile findings into a structured profile:
- **Who**: Account overview and key stats
- **Where**: Primary subreddits and communities
- **What**: Content types and topics
- **How**: Engagement style and patterns
- **Notable**: Any standout posts, comments, or achievements

## Guidelines
- Focus on publicly available information only
- Present findings objectively without making personal judgments
- Note if the account appears to be a bot, spam account, or throwaway
- If the account is suspended or deleted, report that finding early
- Consider karma-to-account-age ratio as an activity indicator`;

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
