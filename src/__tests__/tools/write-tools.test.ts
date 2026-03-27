import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient, RedditResponse } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import { registerCreatePost } from "../../tools/write/create-post.js";
import { registerCreateComment } from "../../tools/write/create-comment.js";
import { registerReplyMessage } from "../../tools/write/reply-message.js";
import { registerEditText } from "../../tools/write/edit-text.js";
import { registerDeleteContent } from "../../tools/write/delete-content.js";
import { registerVote } from "../../tools/write/vote.js";
import { registerSendMessage } from "../../tools/write/send-message.js";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Captured tool handler from `server.tool()`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (...args: any[]) => Promise<any>;

function createMockServer(): { server: McpServer; getHandler: () => ToolHandler } {
  let captured: ToolHandler | undefined;
  const server = {
    tool: vi.fn(
      (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
        captured = handler;
      },
    ),
  } as unknown as McpServer;
  return {
    server,
    getHandler: () => {
      if (!captured) throw new Error("No handler captured — was register* called?");
      return captured;
    },
  };
}

function createMockClient(postResponse?: unknown): RedditClient {
  return {
    post: vi.fn().mockResolvedValue({
      data: postResponse ?? {},
      headers: new Headers(),
      status: 200,
      rateLimitWarning: null,
    } as RedditResponse),
    get: vi.fn(),
    setAuthHeader: vi.fn(),
  } as unknown as RedditClient;
}

function createMockAuthManager(tier: "anon" | "app" | "user" = "user"): RedditAuthManager {
  return {
    tier,
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    hasValidToken: true,
  } as unknown as RedditAuthManager;
}

// ---------------------------------------------------------------------------
// create_post
// ---------------------------------------------------------------------------

describe("create_post", () => {
  let handler: ToolHandler;
  let client: RedditClient;
  let authManager: RedditAuthManager;

  function register(tier: "anon" | "app" | "user" = "user", postResponse?: unknown) {
    client = createMockClient(postResponse);
    authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerCreatePost(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear env overrides
    delete process.env.REDDIT_BOT_FOOTER;
  });

  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ subreddit: "test", title: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("rejects when auth tier is app", async () => {
    register("app");
    const result = await handler({ subreddit: "test", title: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("rejects empty title", async () => {
    register("user");
    const result = await handler({ subreddit: "test", title: "" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("title must not be empty");
  });

  it("rejects title exceeding 300 characters", async () => {
    register("user");
    const longTitle = "a".repeat(301);
    const result = await handler({ subreddit: "test", title: longTitle });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("title exceeds 300 character limit");
  });

  it("accepts title at exactly 300 characters", async () => {
    register("user", {
      json: { errors: [], data: { name: "t3_xyz", url: "https://reddit.com/r/test/xyz", id: "xyz" } },
    });
    const title = "a".repeat(300);
    const result = await handler({ subreddit: "test", title });
    expect(result.isError).toBeFalsy();
  });

  it("detects duplicate submission (same title+subreddit)", async () => {
    // First call records the submission
    register("user", {
      json: { errors: [], data: { name: "t3_first", url: "https://reddit.com/r/test/first", id: "first" } },
    });
    await handler({ subreddit: "test", title: "Duplicate Title" });

    // Second call with the same title+subreddit should be blocked.
    // We need a fresh handler but the DuplicateDetector is module-scoped,
    // so re-registering on a new server still shares the module-level detector.
    const { server: server2, getHandler: getHandler2 } = createMockServer();
    registerCreatePost(server2, client, authManager);
    const handler2 = getHandler2();
    const result = await handler2({ subreddit: "test", title: "Duplicate Title" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Duplicate detected");
  });

  it("allows duplicate submission when force=true", async () => {
    register("user", {
      json: { errors: [], data: { name: "t3_dup", url: "https://reddit.com/r/test/dup", id: "dup" } },
    });
    // Submit once
    await handler({ subreddit: "test", title: "Force Dup Title" });

    // Submit again with force
    const { server: server2, getHandler: getHandler2 } = createMockServer();
    registerCreatePost(server2, client, authManager);
    const handler2 = getHandler2();
    const result = await handler2({ subreddit: "test", title: "Force Dup Title", force: true });
    expect(result.isError).toBeFalsy();
  });

  it("appends bot footer for text post", async () => {
    register("user", {
      json: { errors: [], data: { name: "t3_foot", url: "https://reddit.com/r/test/foot", id: "foot" } },
    });
    await handler({ subreddit: "test", title: "Footer Test Unique", text: "Hello world" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = postCall[1] as Record<string, string>;
    expect(body.text).toContain("Hello world");
    expect(body.text).toContain("I am a bot");
  });

  it("does NOT include footer text in body for link posts", async () => {
    register("user", {
      json: { errors: [], data: { name: "t3_link", url: "https://example.com", id: "link" } },
    });
    await handler({
      subreddit: "test",
      title: "Link Post Footer Unique",
      url: "https://example.com",
    });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = postCall[1] as Record<string, string>;
    // Link posts have kind=link and url, no text body with footer
    expect(body.kind).toBe("link");
    expect(body.url).toBe("https://example.com");
    expect(body.text).toBeUndefined();
  });

  it("returns post fullname and URL on success", async () => {
    register("user", {
      json: {
        errors: [],
        data: { name: "t3_success", url: "https://reddit.com/r/test/success", id: "success" },
      },
    });
    const result = await handler({ subreddit: "test", title: "Success Post Unique" });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("t3_success");
    expect(data.url).toBe("https://reddit.com/r/test/success");
    expect(data.message).toContain("r/test");
  });

  it("sends correct POST body parameters", async () => {
    register("user", {
      json: { errors: [], data: { name: "t3_params", url: "https://reddit.com/r/test/params", id: "params" } },
    });
    await handler({
      subreddit: "mytest",
      title: "Params Post Unique",
      text: "body text",
      flair_id: "flair123",
      nsfw: true,
      spoiler: true,
    });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/submit");
    const body = postCall[1] as Record<string, string>;
    expect(body.sr).toBe("mytest");
    expect(body.title).toBe("Params Post Unique");
    expect(body.kind).toBe("self");
    expect(body.flair_id).toBe("flair123");
    expect(body.nsfw).toBe("true");
    expect(body.spoiler).toBe("true");
  });

  it("handles unexpected response format gracefully", async () => {
    register("user", { json: { errors: [] } });
    const result = await handler({ subreddit: "test", title: "Unexpected Resp Unique" });
    expect(result.content[0].text).toContain("unexpected response format");
  });
});

// ---------------------------------------------------------------------------
// create_comment
// ---------------------------------------------------------------------------

describe("create_comment", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user", postResponse?: unknown) {
    client = createMockClient(postResponse);
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerCreateComment(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.REDDIT_BOT_FOOTER;
  });

  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ parent: "t3_abc", text: "Hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("rejects comment exceeding 10K chars (with footer)", async () => {
    register("user");
    // The footer adds extra characters, so we create text that + footer > 10K
    const longText = "a".repeat(10_000);
    const result = await handler({ parent: "t3_abc", text: longText });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("character limit");
    expect(result.content[0].text).toContain("bot footer exceeds");
  });

  it("appends bot footer to comment text", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t1_new", id: "new" } }] } },
    });
    await handler({ parent: "t3_abc", text: "Great post!" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/comment");
    const body = postCall[1] as Record<string, string>;
    expect(body.text).toContain("Great post!");
    expect(body.text).toContain("I am a bot");
    expect(body.parent).toBe("t3_abc");
  });

  it("returns comment fullname on success", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t1_comment1", id: "comment1" } }] } },
    });
    const result = await handler({ parent: "t3_abc", text: "Nice" });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("t1_comment1");
    expect(data.parent).toBe("t3_abc");
    expect(data.message).toBe("Comment created successfully");
  });

  it("returns 'unknown' when response has no things", async () => {
    register("user", {
      json: { errors: [], data: { things: [] } },
    });
    const result = await handler({ parent: "t3_abc", text: "OK" });
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// reply_message
// ---------------------------------------------------------------------------

describe("reply_message", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user", postResponse?: unknown) {
    client = createMockClient(postResponse);
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerReplyMessage(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.REDDIT_BOT_FOOTER;
  });

  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ parent: "t4_abc", text: "Reply" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("rejects message exceeding 10K chars (with footer)", async () => {
    register("user");
    const longText = "a".repeat(10_000);
    const result = await handler({ parent: "t4_abc", text: longText });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("character limit");
    expect(result.content[0].text).toContain("bot footer exceeds");
  });

  it("appends bot footer to reply text", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t4_reply1", id: "reply1" } }] } },
    });
    await handler({ parent: "t4_abc", text: "Thanks for the message" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/comment");
    const body = postCall[1] as Record<string, string>;
    expect(body.text).toContain("Thanks for the message");
    expect(body.text).toContain("I am a bot");
  });

  it("returns reply ID on success", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t4_reply2", id: "reply2" } }] } },
    });
    const result = await handler({ parent: "t4_abc", text: "Hello" });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("t4_reply2");
    expect(data.parent).toBe("t4_abc");
    expect(data.message).toBe("Message reply sent successfully");
  });

  it("returns 'unknown' when response has no things", async () => {
    register("user", {
      json: { errors: [], data: { things: [] } },
    });
    const result = await handler({ parent: "t4_abc", text: "OK" });
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// edit_text
// ---------------------------------------------------------------------------

describe("edit_text", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user", postResponse?: unknown) {
    client = createMockClient(postResponse);
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerEditText(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.REDDIT_BOT_FOOTER;
  });

  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ fullname: "t3_abc", text: "Updated" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("re-appends bot footer after new text", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t3_edited", body: "new text" } }] } },
    });
    await handler({ fullname: "t3_abc", text: "Edited content" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/editusertext");
    const body = postCall[1] as Record<string, string>;
    expect(body.text).toContain("Edited content");
    expect(body.text).toContain("I am a bot");
    expect(body.thing_id).toBe("t3_abc");
  });

  it("uses 40K limit for t3_ posts (with footer)", async () => {
    register("user");
    // Create text that + footer > 40K
    const longText = "a".repeat(40_000);
    const result = await handler({ fullname: "t3_abc", text: longText });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("character limit");
    expect(result.content[0].text).toContain("bot footer exceeds");
  });

  it("uses 10K limit for t1_ comments (with footer)", async () => {
    register("user");
    // Create text that + footer > 10K
    const longText = "a".repeat(10_000);
    const result = await handler({ fullname: "t1_abc", text: longText });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("character limit");
    expect(result.content[0].text).toContain("bot footer exceeds");
  });

  it("accepts t1_ comment within 10K limit", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t1_ok", body: "short" } }] } },
    });
    const result = await handler({ fullname: "t1_abc", text: "short comment" });
    expect(result.isError).toBeFalsy();
  });

  it("returns edited fullname on success", async () => {
    register("user", {
      json: { errors: [], data: { things: [{ data: { name: "t3_edited", body: "new" } }] } },
    });
    const result = await handler({ fullname: "t3_abc", text: "Updated" });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("t3_edited");
    expect(data.message).toBe("Content edited successfully");
  });

  it("falls back to provided fullname when response has no things", async () => {
    register("user", {
      json: { errors: [], data: { things: [] } },
    });
    const result = await handler({ fullname: "t3_fallback", text: "Updated" });
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe("t3_fallback");
  });
});

// ---------------------------------------------------------------------------
// delete_content
// ---------------------------------------------------------------------------

describe("delete_content", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user") {
    client = createMockClient({});
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerDeleteContent(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ fullname: "t3_abc" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("calls POST /api/del with the fullname", async () => {
    register("user");
    await handler({ fullname: "t3_del123" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/del");
    expect(postCall[1]).toEqual({ id: "t3_del123" });
  });

  it("returns success message containing the fullname", async () => {
    register("user");
    const result = await handler({ fullname: "t1_comment_del" });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("t1_comment_del");
    expect(result.content[0].text).toContain("permanent");
  });

  it("returns error on API failure", async () => {
    client = createMockClient();
    (client.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));
    const authManager = createMockAuthManager("user");
    const { server, getHandler } = createMockServer();
    registerDeleteContent(server, client, authManager);
    handler = getHandler();

    const result = await handler({ fullname: "t3_fail" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to delete content");
  });
});

// ---------------------------------------------------------------------------
// vote
// ---------------------------------------------------------------------------

describe("vote", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user") {
    client = createMockClient({});
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerVote(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ fullname: "t3_abc", dir: 1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("upvote (dir=1) calls POST /api/vote", async () => {
    register("user");
    await handler({ fullname: "t3_up", dir: 1 });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/vote");
    expect(postCall[1]).toEqual({ id: "t3_up", dir: "1" });
  });

  it("downvote (dir=-1) works", async () => {
    register("user");
    await handler({ fullname: "t3_down", dir: -1 });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[1]).toEqual({ id: "t3_down", dir: "-1" });
  });

  it("clear vote (dir=0) works", async () => {
    register("user");
    await handler({ fullname: "t3_clear", dir: 0 });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[1]).toEqual({ id: "t3_clear", dir: "0" });
  });

  it("returns 'Upvoted' label for dir=1", async () => {
    register("user");
    const result = await handler({ fullname: "t3_up", dir: 1 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe("Upvoted t3_up");
  });

  it("returns 'Downvoted' label for dir=-1", async () => {
    register("user");
    const result = await handler({ fullname: "t3_down", dir: -1 });
    expect(result.content[0].text).toBe("Downvoted t3_down");
  });

  it("returns 'Vote cleared on' label for dir=0", async () => {
    register("user");
    const result = await handler({ fullname: "t3_clear", dir: 0 });
    expect(result.content[0].text).toBe("Vote cleared on t3_clear");
  });

  it("returns error on API failure", async () => {
    client = createMockClient();
    (client.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Rate limited"));
    const authManager = createMockAuthManager("user");
    const { server, getHandler } = createMockServer();
    registerVote(server, client, authManager);
    handler = getHandler();

    const result = await handler({ fullname: "t3_fail", dir: 1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to vote");
  });
});

// ---------------------------------------------------------------------------
// send_message
// ---------------------------------------------------------------------------

describe("send_message", () => {
  let handler: ToolHandler;
  let client: RedditClient;

  function register(tier: "anon" | "app" | "user" = "user") {
    client = createMockClient({});
    const authManager = createMockAuthManager(tier);
    const { server, getHandler } = createMockServer();
    registerSendMessage(server, client, authManager);
    handler = getHandler();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.REDDIT_BOT_FOOTER;
  });

  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("rejects when auth tier is anon", async () => {
    register("anon");
    const result = await handler({ to: "someuser", subject: "Hi", text: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
  });

  it("rejects empty subject", async () => {
    register("user");
    const result = await handler({ to: "someuser", subject: "", text: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("subject must not be empty");
  });

  it("rejects subject exceeding 100 characters", async () => {
    register("user");
    const longSubject = "a".repeat(101);
    const result = await handler({ to: "someuser", subject: longSubject, text: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("100 character limit");
  });

  it("accepts subject at exactly 100 characters", async () => {
    register("user");
    const subject = "a".repeat(100);
    const result = await handler({ to: "someuser", subject, text: "Hello" });
    expect(result.isError).toBeFalsy();
  });

  it("rejects body exceeding 10K chars (with footer)", async () => {
    register("user");
    const longBody = "a".repeat(10_000);
    const result = await handler({ to: "someuser", subject: "Hi", text: longBody });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("character limit");
    expect(result.content[0].text).toContain("bot footer exceeds");
  });

  it("appends bot footer to body", async () => {
    register("user");
    await handler({ to: "someuser", subject: "Hi", text: "Message body" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(postCall[0]).toBe("/api/compose");
    const body = postCall[1] as Record<string, string>;
    expect(body.text).toContain("Message body");
    expect(body.text).toContain("I am a bot");
  });

  it("strips u/ prefix from recipient", async () => {
    register("user");
    await handler({ to: "u/prefixeduser", subject: "Hi", text: "Hello" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = postCall[1] as Record<string, string>;
    expect(body.to).toBe("prefixeduser");
  });

  it("does not strip prefix when no u/ present", async () => {
    register("user");
    await handler({ to: "plainuser", subject: "Hi", text: "Hello" });

    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = postCall[1] as Record<string, string>;
    expect(body.to).toBe("plainuser");
  });

  it("returns success with recipient and subject", async () => {
    register("user");
    const result = await handler({ to: "testuser", subject: "Greetings", text: "Hi there" });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.to).toBe("testuser");
    expect(data.subject).toBe("Greetings");
    expect(data.message).toBe("Message sent successfully");
  });

  it("returns error on API failure", async () => {
    client = createMockClient();
    (client.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Forbidden"));
    const authManager = createMockAuthManager("user");
    const { server, getHandler } = createMockServer();
    registerSendMessage(server, client, authManager);
    handler = getHandler();

    const result = await handler({ to: "user", subject: "Hi", text: "Hello" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to send message");
  });
});
