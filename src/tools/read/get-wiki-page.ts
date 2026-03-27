/**
 * Get wiki page tool for the Reddit MCP Server.
 *
 * Reads a wiki page from a subreddit, returning content as markdown text.
 * Handles wiki not found and wiki disabled edge cases.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditConfig } from "../../reddit/config.js";

/** Response shape from GET /r/{sub}/wiki/{page}. */
interface WikiPageResponse {
  data: {
    content_md: string;
    content_html: string;
    revision_by: { data: { name: string } };
    revision_date: number;
    may_revise: boolean;
  };
  kind: string;
}

/**
 * Register the `get_wiki_page` tool on the MCP server.
 *
 * Reads a wiki page from a subreddit and returns the content as markdown.
 * Works at all auth tiers. Uses `wikiread` scope when authenticated.
 */
export function registerGetWikiPageTool(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.tool(
    "get_wiki_page",
    "Read a wiki page from a subreddit. Returns the page content as markdown text.",
    {
      subreddit: z.string().describe("Subreddit name (without r/ prefix)"),
      page: z
        .string()
        .describe("Wiki page name (e.g., 'index', 'rules', 'faq'). Case-sensitive."),
    },
    async ({ subreddit, page }) => {
      try {
        const response = await client.get<WikiPageResponse>(
          `/r/${subreddit}/wiki/${page}`,
        );
        const wiki = response.data.data;

        const result = {
          subreddit,
          page,
          content: wiki.content_md,
          revised_by: wiki.revision_by?.data?.name ?? "unknown",
          revision_date: wiki.revision_date,
          may_revise: wiki.may_revise,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("404") || message.includes("Not Found")) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Wiki page not found: r/${subreddit}/wiki/${page}`,
              },
            ],
            isError: true,
          };
        }
        if (message.includes("403") || message.includes("Forbidden")) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Wiki is disabled or restricted on r/${subreddit}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            { type: "text" as const, text: `Failed to get wiki page: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
}
