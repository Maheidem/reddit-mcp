/**
 * Wiki page MCP Resource for the Reddit MCP Server.
 *
 * Exposes wiki pages as cacheable MCP resources
 * via `reddit://subreddit/{name}/wiki/{page}`.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../reddit/client.js";
import type { RedditConfig } from "../reddit/config.js";

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
 * Register the wiki page resource on the MCP server.
 *
 * `reddit://subreddit/{name}/wiki/{page}` — wiki page content as markdown.
 */
export function registerWikiResource(
  server: McpServer,
  client: RedditClient,
  _config: RedditConfig,
): void {
  server.resource(
    "wiki_page",
    new ResourceTemplate("reddit://subreddit/{name}/wiki/{page}", { list: undefined }),
    { description: "Subreddit wiki page content in markdown format" },
    async (uri, variables) => {
      const name = variables.name as string;
      const page = variables.page as string;

      const response = await client.get<WikiPageResponse>(`/r/${name}/wiki/${page}`);
      const wiki = response.data.data;

      const data = {
        subreddit: name,
        page,
        content: wiki.content_md,
        revised_by: wiki.revision_by?.data?.name ?? "unknown",
        revision_date: wiki.revision_date,
      };

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(data, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    },
  );
}
