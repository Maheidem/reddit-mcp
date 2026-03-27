/**
 * Get subreddit rules tool for the Reddit MCP Server.
 *
 * Retrieves a structured list of rules for a subreddit.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditConfig } from "../../reddit/config.js";

/** A single subreddit rule from the Reddit API. */
interface SubredditRule {
  kind: string;
  short_name: string;
  description: string;
  violation_reason: string;
  created_utc: number;
  priority: number;
}

/** Response shape from GET /r/{sub}/about/rules. */
interface RulesResponse {
  rules: SubredditRule[];
}

/**
 * Register the `get_subreddit_rules` tool on the MCP server.
 *
 * Returns the rules of a subreddit as a structured list.
 * Works at all auth tiers.
 */
export function registerGetSubredditRulesTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_subreddit_rules",
    "Get the rules of a subreddit. Returns structured list of rules with descriptions and applicable scope.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
    },
    async ({ subreddit }) => {
      try {
        const response = await client.get<RulesResponse>(`/r/${subreddit}/about/rules`);
        const rules = (response.data.rules ?? []).map((rule) => ({
          kind: rule.kind,
          name: rule.short_name,
          description: rule.description,
          violation_reason: rule.violation_reason,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ subreddit, rules, count: rules.length }, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get rules for r/${subreddit}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
