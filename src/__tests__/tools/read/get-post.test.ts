import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetPostTool } from "../../../tools/read/get-post.js";

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
  registerGetPostTool(mockServer, client, mockConfig);
}

describe("get_post tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retrieves post by bare ID with subreddit", async () => {
    const post = makeMockPost();
    const twoElementArray = [
      { kind: "Listing", data: { children: [{ kind: "t3", data: post }], after: null, before: null, dist: 1 } },
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({ post_id: "abc123", subreddit: "test" });
    const data = JSON.parse(result.content[0].text);

    expect(data.id).toBe("t3_abc123");
    expect(data.title).toBe("Test Post");
    expect(client.get).toHaveBeenCalledWith("/r/test/comments/abc123");
  });

  it("strips t3_ prefix for comments endpoint", async () => {
    const post = makeMockPost();
    const twoElementArray = [
      { kind: "Listing", data: { children: [{ kind: "t3", data: post }], after: null, before: null, dist: 1 } },
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    await capturedHandler({ post_id: "t3_abc123", subreddit: "test" });
    expect(client.get).toHaveBeenCalledWith("/r/test/comments/abc123");
  });

  it("uses /api/info when no subreddit specified", async () => {
    const listing = {
      kind: "Listing",
      data: { children: [{ kind: "t3", data: makeMockPost() }], after: null, before: null, dist: 1 },
    };
    const client = createMockClient(listing);
    captureHandler(client);

    await capturedHandler({ post_id: "abc123" });
    expect(client.get).toHaveBeenCalledWith("/api/info", { id: "t3_abc123" });
  });

  it("returns isError when post not found", async () => {
    const emptyListing = {
      kind: "Listing",
      data: { children: [], after: null, before: null, dist: 0 },
    };
    const client = createMockClient(emptyListing);
    captureHandler(client);

    const result = await capturedHandler({ post_id: "nonexistent" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Post not found");
  });

  it("detects deleted posts", async () => {
    const post = makeMockPost({ author: "[deleted]", selftext: "[deleted]" });
    const listing = {
      kind: "Listing",
      data: { children: [{ kind: "t3", data: post }], after: null, before: null, dist: 1 },
    };
    const client = createMockClient(listing);
    captureHandler(client);

    const result = await capturedHandler({ post_id: "abc123" });
    const data = JSON.parse(result.content[0].text);
    expect(data.is_deleted).toBe(true);
  });

  it("detects removed posts", async () => {
    const post = makeMockPost({ selftext: "[removed]" });
    const listing = {
      kind: "Listing",
      data: { children: [{ kind: "t3", data: post }], after: null, before: null, dist: 1 },
    };
    const client = createMockClient(listing);
    captureHandler(client);

    const result = await capturedHandler({ post_id: "abc123" });
    const data = JSON.parse(result.content[0].text);
    expect(data.is_removed).toBe(true);
  });

  it("returns isError on API failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(client);

    const result = await capturedHandler({ post_id: "abc123" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get post");
  });
});
