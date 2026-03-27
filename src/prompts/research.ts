/**
 * Reddit Research MCP Prompt for the Reddit MCP Server.
 *
 * Provides a structured research workflow template that guides the LLM
 * to use search and read tools systematically across subreddits.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** Map human-readable time ranges to Reddit `t` parameter values. */
const TIME_RANGE_MAP: Record<string, string> = {
  hour: "hour",
  day: "day",
  week: "week",
  month: "month",
  year: "year",
  all: "all",
};

/**
 * Register the `reddit_research` prompt on the MCP server.
 *
 * Generates a structured research workflow that references
 * `search`, `get_post`, and `get_comments` tools by name.
 */
export function registerResearchPrompt(server: McpServer): void {
  server.prompt(
    "reddit_research",
    "Deep-dive research on a topic across subreddits. Guides systematic use of search and read tools.",
    {
      topic: z
        .string()
        .describe("The topic to research across Reddit"),
      subreddits: z
        .string()
        .optional()
        .describe("Comma-separated list of subreddits to search (e.g. 'python,learnpython,programming'). If omitted, searches all of Reddit."),
      time_range: z
        .enum(["hour", "day", "week", "month", "year", "all"])
        .optional()
        .describe("Time range filter for search results. Maps to Reddit sort parameter t=hour|day|week|month|year|all."),
    },
    ({ topic, subreddits, time_range }) => {
      const subredditList = subreddits
        ? subreddits.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const timeParam = time_range ? TIME_RANGE_MAP[time_range] : "all";
      const timeDescription = time_range ?? "all time";

      const subredditContext = subredditList.length > 0
        ? `Focus your research on these subreddits: ${subredditList.map((s) => `r/${s}`).join(", ")}.`
        : "Search across all of Reddit for the broadest perspective.";

      const text = `# Reddit Research: ${topic}

## Objective
Conduct a thorough research investigation on "${topic}" using Reddit as your primary source. ${subredditContext}

## Research Workflow

### Step 1: Initial Search (Broad Discovery)
Use the \`search\` tool to find relevant posts about "${topic}".
- Sort by "relevance" first, then try "top" to find highest-quality discussions
- Use time filter: \`t=${timeParam}\` (${timeDescription})
${subredditList.length > 0 ? subredditList.map((s) => `- Search in r/${s} using the \`subreddit\` parameter`).join("\n") : "- Search without a subreddit filter for broad results"}
- Try different search queries: exact topic, related terms, synonyms

### Step 2: Deep-Dive into Top Results
For the most relevant posts found in Step 1:
- Use \`get_post\` to retrieve full post details including body text and metadata
- Use \`get_comments\` to read discussion threads — this is where the real insights live
- Pay attention to highly upvoted comments — they often contain expert perspectives
- Look for comments with links to external resources or detailed explanations

### Step 3: Cross-Reference and Validate
- Compare perspectives across different posts and subreddits
- Note areas of consensus vs. disagreement in the community
- Identify frequently cited sources, tools, or recommendations
- Flag any outdated information (check post dates)

### Step 4: Synthesize Findings
Compile your research into a structured summary:
1. **Key findings** — main takeaways supported by multiple sources
2. **Community consensus** — what most Redditors agree on
3. **Dissenting views** — notable counterpoints or minority opinions
4. **Recommendations** — actionable advice from the community
5. **Sources** — links to the most valuable posts and comments

## Tips
- Reddit comments often contain more valuable information than the original post
- Look for posts with high comment counts — they indicate active discussion
- Users with domain-specific flair or high karma in a subreddit are often subject matter experts
- "Ask" or "question" posts tend to have practical, experience-based answers
- Wiki pages (via \`get_wiki_page\`) may contain curated community knowledge`;

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
