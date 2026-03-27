import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetUserTool } from "../../../tools/read/get-user.js";
import { registerGetUserPostsTool } from "../../../tools/read/get-user-posts.js";
import { registerGetUserCommentsTool } from "../../../tools/read/get-user-comments.js";

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

function captureHandler(registerFn: (server: McpServer, client: RedditClient, config: RedditConfig) => void, client: RedditClient) {
  const mockServer = {
    tool: vi.fn(
      (_name: string, _desc: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
        capturedHandler = handler as typeof capturedHandler;
      },
    ),
  } as unknown as McpServer;
  registerFn(mockServer, client, mockConfig);
}

describe("get_user tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns user profile with karma breakdown", async () => {
    const userData = {
      kind: "t2",
      data: {
        id: "user1",
        name: "testuser",
        link_karma: 1000,
        comment_karma: 5000,
        total_karma: 6000,
        created_utc: 1500000000,
        is_gold: false,
        is_mod: true,
        has_verified_email: true,
        icon_img: "https://example.com/icon.png",
        snoovatar_img: "https://example.com/snoo.png",
      },
    };
    const client = createMockClient(userData);
    captureHandler(registerGetUserTool, client);

    const result = await capturedHandler({ username: "testuser" });
    const data = JSON.parse(result.content[0].text);

    expect(data.username).toBe("testuser");
    expect(data.link_karma).toBe(1000);
    expect(data.comment_karma).toBe(5000);
    expect(data.total_karma).toBe(6000);
    expect(data.is_mod).toBe(true);
  });

  it("returns isError for deleted user (404)", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("404 Not Found"));
    captureHandler(registerGetUserTool, client);

    const result = await capturedHandler({ username: "deleted_user" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });

  it("returns isError on generic failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
    captureHandler(registerGetUserTool, client);

    const result = await capturedHandler({ username: "testuser" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get user");
  });
});

describe("get_user_posts tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns posts with pagination", async () => {
    const listing = {
      kind: "Listing",
      data: {
        children: [
          {
            kind: "t3",
            data: {
              id: "p1",
              name: "t3_p1",
              title: "User Post",
              author: "testuser",
              subreddit: "test",
              subreddit_name_prefixed: "r/test",
              selftext: "",
              selftext_html: null,
              url: "https://example.com",
              permalink: "/r/test/comments/p1/user_post/",
              domain: "example.com",
              score: 50,
              upvote_ratio: 0.9,
              num_comments: 5,
              created_utc: 1700000000,
              edited: false,
              over_18: false,
              spoiler: false,
              stickied: false,
              locked: false,
              archived: false,
              is_self: false,
              is_video: false,
              is_crosspostable: true,
              thumbnail: "default",
              media: null,
              likes: null,
              saved: false,
              distinguished: null,
              score_hidden: false,
              link_flair_text: null,
              author_flair_text: null,
            },
          },
        ],
        after: "t3_next",
        before: null,
        dist: 1,
      },
    };
    const client = createMockClient(listing);
    captureHandler(registerGetUserPostsTool, client);

    const result = await capturedHandler({ username: "testuser", sort: "new", limit: 25 });
    const data = JSON.parse(result.content[0].text);

    expect(data.posts).toHaveLength(1);
    expect(data.after).toBe("t3_next");
    expect(data.posts[0].post_type).toBe("link");
  });

  it("passes time filter for top sort", async () => {
    const client = createMockClient({
      kind: "Listing",
      data: { children: [], after: null, before: null, dist: 0 },
    });
    captureHandler(registerGetUserPostsTool, client);

    await capturedHandler({ username: "testuser", sort: "top", time: "month", limit: 25 });
    expect(client.get).toHaveBeenCalledWith(
      "/user/testuser/submitted",
      expect.objectContaining({ t: "month", sort: "top" }),
    );
  });

  it("does NOT pass time filter for new sort", async () => {
    const client = createMockClient({
      kind: "Listing",
      data: { children: [], after: null, before: null, dist: 0 },
    });
    captureHandler(registerGetUserPostsTool, client);

    await capturedHandler({ username: "testuser", sort: "new", limit: 25 });
    const callArgs = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, string>;
    expect(callArgs.t).toBeUndefined();
  });
});

describe("get_user_comments tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns comments with post context", async () => {
    const listing = {
      kind: "Listing",
      data: {
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              name: "t1_c1",
              author: "testuser",
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
              link_title: "Parent Post Title",
              permalink: "/r/test/comments/abc/parent_post/c1/",
            },
          },
        ],
        after: null,
        before: null,
        dist: 1,
      },
    };
    const client = createMockClient(listing);
    captureHandler(registerGetUserCommentsTool, client);

    const result = await capturedHandler({ username: "testuser", sort: "new", limit: 25 });
    const data = JSON.parse(result.content[0].text);

    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].body).toBe("A comment");
    expect(data.comments[0].link_title).toBe("Parent Post Title");
  });

  it("passes after cursor for pagination", async () => {
    const client = createMockClient({
      kind: "Listing",
      data: { children: [], after: null, before: null, dist: 0 },
    });
    captureHandler(registerGetUserCommentsTool, client);

    await capturedHandler({ username: "testuser", sort: "new", limit: 25, after: "t1_xyz" });
    expect(client.get).toHaveBeenCalledWith(
      "/user/testuser/comments",
      expect.objectContaining({ after: "t1_xyz" }),
    );
  });
});
