import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetCommentsTool } from "../../../tools/read/get-comments.js";

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

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    name: "t1_c1",
    author: "commenter",
    body: "A comment",
    body_html: "<p>A comment</p>",
    subreddit: "test",
    link_id: "t3_abc",
    parent_id: "t3_abc",
    score: 10,
    created_utc: 1700000100,
    edited: false,
    replies: "",
    stickied: false,
    locked: false,
    archived: false,
    distinguished: null,
    likes: null,
    saved: false,
    depth: 0,
    is_submitter: false,
    author_flair_text: null,
    score_hidden: false,
    ...overrides,
  };
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
  registerGetCommentsTool(mockServer, client, mockConfig);
}

describe("get_comments tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns flattened comment tree", async () => {
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      {
        kind: "Listing",
        data: {
          children: [{ kind: "t1", data: makeComment() }],
          after: null,
          before: null,
          dist: 1,
        },
      },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.comments).toHaveLength(1);
    expect(data.comments[0]).toMatchObject({
      id: "t1_c1",
      author: "commenter",
      body: "A comment",
      depth: 0,
    });
  });

  it("handles replies: '' (empty string) without crash", async () => {
    const comment = makeComment({ replies: "" });
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      {
        kind: "Listing",
        data: { children: [{ kind: "t1", data: comment }], after: null, before: null, dist: 1 },
      },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.comments).toHaveLength(1);
  });

  it("includes 'more' comment stubs", async () => {
    const moreObj = {
      kind: "more",
      data: { count: 5, parent_id: "t1_c1", children: ["c2", "c3", "c4"] },
    };
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      {
        kind: "Listing",
        data: { children: [moreObj], after: null, before: null, dist: 0 },
      },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });
    const data = JSON.parse(result.content[0].text);

    expect(data.more_comments).toHaveLength(1);
    expect(data.more_comments[0]).toMatchObject({
      type: "more",
      count: 5,
      children: ["c2", "c3", "c4"],
    });
  });

  it("passes sort and depth params", async () => {
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "top",
      depth: 3,
      limit: 100,
    });

    expect(client.get).toHaveBeenCalledWith(
      "/r/test/comments/abc123",
      expect.objectContaining({ sort: "top", depth: "3", limit: "100" }),
    );
  });

  it("detects deleted comments", async () => {
    const comment = makeComment({ author: "[deleted]", body: "[deleted]" });
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      {
        kind: "Listing",
        data: { children: [{ kind: "t1", data: comment }], after: null, before: null, dist: 1 },
      },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.comments[0].is_deleted).toBe(true);
  });

  it("detects removed comments", async () => {
    const comment = makeComment({ body: "[removed]" });
    const twoElementArray = [
      { kind: "Listing", data: { children: [], after: null, before: null, dist: 0 } },
      {
        kind: "Listing",
        data: { children: [{ kind: "t1", data: comment }], after: null, before: null, dist: 1 },
      },
    ];
    const client = createMockClient(twoElementArray);
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.comments[0].is_removed).toBe(true);
  });

  it("returns isError on API failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(client);

    const result = await capturedHandler({
      post_id: "abc123",
      subreddit: "test",
      sort: "best",
      limit: 200,
    });
    expect(result.isError).toBe(true);
  });
});
