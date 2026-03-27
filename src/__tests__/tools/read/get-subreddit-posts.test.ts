import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetSubredditPostsTool } from "../../../tools/read/get-subreddit-posts.js";

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
    selftext: "content",
    selftext_html: null,
    url: "https://reddit.com/r/test/comments/abc123/test/",
    permalink: "/r/test/comments/abc123/test/",
    domain: "self.test",
    score: 100,
    upvote_ratio: 0.95,
    num_comments: 42,
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
    link_flair_text: "Discussion",
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
  registerGetSubredditPostsTool(mockServer, client, mockConfig);
}

describe("get_subreddit_posts tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses /r/{sub}/hot path for hot sort", async () => {
    const client = createMockClient(makeListing([makeMockPost()]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "hot", limit: 25 });
    expect(client.get).toHaveBeenCalledWith(
      "/r/test/hot",
      expect.objectContaining({ limit: "25" }),
    );
  });

  it("passes t param for top sort", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "top", time: "week", limit: 25 });
    expect(client.get).toHaveBeenCalledWith(
      "/r/test/top",
      expect.objectContaining({ t: "week" }),
    );
  });

  it("passes t param for controversial sort", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "controversial", time: "month", limit: 25 });
    expect(client.get).toHaveBeenCalledWith(
      "/r/test/controversial",
      expect.objectContaining({ t: "month" }),
    );
  });

  it("does NOT pass t param for rising sort", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "rising", limit: 25 });
    const callArgs = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, string>;
    expect(callArgs.t).toBeUndefined();
  });

  it("does NOT pass t param for new sort", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "new", limit: 25 });
    const callArgs = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, string>;
    expect(callArgs.t).toBeUndefined();
  });

  it("passes after cursor for pagination", async () => {
    const client = createMockClient(makeListing([]));
    captureHandler(client);

    await capturedHandler({ subreddit: "test", sort: "hot", limit: 25, after: "t3_xyz" });
    expect(client.get).toHaveBeenCalledWith(
      "/r/test/hot",
      expect.objectContaining({ after: "t3_xyz" }),
    );
  });

  it("detects post type", async () => {
    const client = createMockClient(makeListing([makeMockPost()]));
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", sort: "hot", limit: 25 });
    const data = JSON.parse(result.content[0].text);
    expect(data.posts[0].post_type).toBe("self");
  });

  it("returns isError on failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(client);

    const result = await capturedHandler({ subreddit: "test", sort: "hot", limit: 25 });
    expect(result.isError).toBe(true);
  });
});
