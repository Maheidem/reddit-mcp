import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerSearchTool } from "../../../tools/read/search.js";

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

const mockConfig: RedditConfig = {
  tier: "anon",
  clientId: null,
  clientSecret: null,
  username: null,
  password: null,
  userAgent: "test:app:1.0.0 (by /u/test)",
};

function makeMockPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "abc123",
    name: "t3_abc123",
    title: "Test Post",
    author: "testuser",
    subreddit: "test",
    subreddit_name_prefixed: "r/test",
    selftext: "Hello world",
    selftext_html: null,
    url: "https://reddit.com/r/test/comments/abc123/test_post/",
    permalink: "/r/test/comments/abc123/test_post/",
    domain: "self.test",
    score: 42,
    upvote_ratio: 0.95,
    num_comments: 10,
    created_utc: 1700000000,
    edited: false,
    over_18: false,
    spoiler: false,
    stickied: false,
    locked: false,
    archived: false,
    is_self: true,
    is_video: false,
    is_crosspostable: true,
    thumbnail: "self",
    media: null,
    likes: null,
    saved: false,
    distinguished: null,
    score_hidden: false,
    link_flair_text: null,
    author_flair_text: null,
    ...overrides,
  };
}

function makeListing(posts: unknown[], after: string | null = null) {
  return {
    kind: "Listing",
    data: {
      children: posts.map((p) => ({ kind: "t3", data: p })),
      after,
      before: null,
      dist: posts.length,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedHandler: (...args: any[]) => Promise<any>;

function captureHandler(client: RedditClient) {
  const mockServer = {
    tool: vi.fn(
      (
        _name: string,
        _desc: string,
        _schema: unknown,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (...args: any[]) => Promise<any>,
      ) => {
        capturedHandler = handler;
      },
    ),
  } as unknown as McpServer;
  registerSearchTool(mockServer, client, mockConfig);
  return mockServer;
}

describe("search tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registers with correct name", () => {
    const client = createMockClient(makeListing([]));
    const server = captureHandler(client);
    expect((server as unknown as { tool: ReturnType<typeof vi.fn> }).tool).toHaveBeenCalledWith(
      "search",
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("returns posts with expected fields", async () => {
    const client = createMockClient(makeListing([makeMockPost()]));
    captureHandler(client);

    const result = await capturedHandler({ q: "test", sort: "relevance", time: "all", limit: 25 });
    const data = JSON.parse(result.content[0].text);

    expect(data.posts).toHaveLength(1);
    expect(data.posts[0]).toMatchObject({
      id: "t3_abc123",
      title: "Test Post",
      author: "testuser",
      subreddit: "test",
      score: 42,
    });
  });

  it("uses subreddit-scoped search with restrict_sr=true", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ q: "test", subreddit: "programming", sort: "relevance", time: "all", limit: 25 });

    expect(client.get).toHaveBeenCalledWith(
      "/r/programming/search",
      expect.objectContaining({ restrict_sr: "true" }),
    );
  });

  it("uses global search when no subreddit specified", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ q: "test", sort: "relevance", time: "all", limit: 25 });

    expect(client.get).toHaveBeenCalledWith("/search", expect.not.objectContaining({ restrict_sr: "true" }));
  });

  it("passes sort and time params", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ q: "test", sort: "top", time: "week", limit: 10 });

    expect(client.get).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({ sort: "top", t: "week", limit: "10" }),
    );
  });

  it("passes after cursor for pagination", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ q: "test", sort: "relevance", time: "all", limit: 25, after: "t3_xyz" });

    expect(client.get).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({ after: "t3_xyz" }),
    );
  });

  it("returns after cursor in response", async () => {
    const client = createMockClient(makeListing([makeMockPost()], "t3_next"));
    captureHandler(client);

    const result = await capturedHandler({ q: "test", sort: "relevance", time: "all", limit: 25 });
    const data = JSON.parse(result.content[0].text);

    expect(data.after).toBe("t3_next");
  });

  it("returns isError on failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
    captureHandler(client);

    const result = await capturedHandler({ q: "test", sort: "relevance", time: "all", limit: 25 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Search failed");
  });
});
