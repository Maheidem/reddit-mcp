import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetWikiPageTool } from "../../../tools/read/get-wiki-page.js";

const mockConfig: RedditConfig = {
  tier: "anon",
  clientId: null,
  clientSecret: null,
  username: null,
  password: null,
  userAgent: "test:app:1.0.0 (by /u/test)",
};

function createMockClient(response: unknown) {
  return {
    get: vi.fn().mockResolvedValue({
      data: response,
      headers: new Headers(),
      status: 200,
      rateLimitWarning: null,
    }),
    post: vi.fn(),
    setAuthHeader: vi.fn(),
  } as unknown as RedditClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedHandler: (...args: any[]) => Promise<any>;

function captureHandler(client: RedditClient) {
  const mockServer = {
    tool: vi.fn(
      (_name: string, _desc: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
        capturedHandler = handler as typeof capturedHandler;
      },
    ),
  } as unknown as McpServer;
  registerGetWikiPageTool(mockServer, client, mockConfig);
}

describe("get_wiki_page tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns wiki content as markdown", async () => {
    const wikiResponse = {
      data: {
        content_md: "# Wiki Page\n\nSome content here.",
        content_html: "<h1>Wiki Page</h1>",
        revision_by: { data: { name: "wiki_editor" } },
        revision_date: 1700000000,
        may_revise: false,
      },
      kind: "wikipage",
    };
    const client = createMockClient(wikiResponse);
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", page: "index" });
    const data = JSON.parse(result.content[0].text);

    expect(data.content).toBe("# Wiki Page\n\nSome content here.");
    expect(data.revised_by).toBe("wiki_editor");
    expect(data.page).toBe("index");
  });

  it("returns isError for wiki not found (404)", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("404 Not Found"));
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", page: "nonexistent" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });

  it("returns isError for wiki disabled (403)", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("403 Forbidden"));
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", page: "index" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("disabled or restricted");
  });

  it("returns isError on generic failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", page: "index" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get wiki page");
  });
});
