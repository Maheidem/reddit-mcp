import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetSubredditTool } from "../../../tools/read/get-subreddit.js";
import { registerGetSubredditRulesTool } from "../../../tools/read/get-subreddit-rules.js";

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

function captureHandler(
  registerFn: (server: McpServer, client: RedditClient, config: RedditConfig) => void,
  client: RedditClient,
) {
  const mockServer = {
    tool: vi.fn(
      (_name: string, _desc: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
        capturedHandler = handler as typeof capturedHandler;
      },
    ),
  } as unknown as McpServer;
  registerFn(mockServer, client, mockConfig);
  return mockServer;
}

describe("get_subreddit tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns subreddit info with correct fields", async () => {
    const subData = {
      kind: "t5",
      data: {
        id: "2qh1i",
        name: "t5_2qh1i",
        display_name: "programming",
        display_name_prefixed: "r/programming",
        title: "programming",
        public_description: "Computer programming",
        description: "Full description here",
        description_html: null,
        subscribers: 5000000,
        active_user_count: 10000,
        created_utc: 1200000000,
        over18: false,
        subreddit_type: "public",
        url: "/r/programming/",
        icon_img: "",
        community_icon: "",
        banner_img: "",
        lang: "en",
        allow_images: true,
        allow_videos: true,
        allow_polls: true,
        spoilers_enabled: true,
        user_is_subscriber: null,
        user_is_moderator: null,
        user_is_banned: null,
      },
    };
    const client = createMockClient(subData);
    captureHandler(registerGetSubredditTool, client);

    const result = await capturedHandler({ subreddit: "programming" });
    const data = JSON.parse(result.content[0].text);

    expect(data.name).toBe("programming");
    expect(data.subscribers).toBe(5000000);
    expect(data.is_nsfw).toBe(false);
  });

  it("uses over18 (not over_18) for NSFW", async () => {
    const subData = {
      kind: "t5",
      data: {
        id: "nsfw1",
        name: "t5_nsfw1",
        display_name: "nsfw_sub",
        display_name_prefixed: "r/nsfw_sub",
        title: "NSFW Sub",
        public_description: "NSFW content",
        description: "",
        description_html: null,
        subscribers: 1000,
        active_user_count: 50,
        created_utc: 1300000000,
        over18: true,
        subreddit_type: "public",
        url: "/r/nsfw_sub/",
        icon_img: "",
        community_icon: "",
        banner_img: "",
        lang: "en",
        allow_images: true,
        allow_videos: true,
        allow_polls: false,
        spoilers_enabled: true,
        user_is_subscriber: null,
        user_is_moderator: null,
        user_is_banned: null,
      },
    };
    const client = createMockClient(subData);
    captureHandler(registerGetSubredditTool, client);

    const result = await capturedHandler({ subreddit: "nsfw_sub" });
    const data = JSON.parse(result.content[0].text);
    expect(data.is_nsfw).toBe(true);
  });

  it("returns isError for private subreddit (403)", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("403 Forbidden"));
    captureHandler(registerGetSubredditTool, client);

    const result = await capturedHandler({ subreddit: "private_sub" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("private or banned");
  });

  it("returns isError for nonexistent subreddit (404)", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("404 Not Found"));
    captureHandler(registerGetSubredditTool, client);

    const result = await capturedHandler({ subreddit: "nonexistent" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });
});

describe("get_subreddit_rules tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns rules as structured list", async () => {
    const rulesResponse = {
      rules: [
        {
          kind: "all",
          short_name: "Be nice",
          description: "Be respectful to others",
          violation_reason: "Not being nice",
          created_utc: 1400000000,
          priority: 0,
        },
        {
          kind: "link",
          short_name: "No spam",
          description: "Don't post spam",
          violation_reason: "Spam",
          created_utc: 1400000001,
          priority: 1,
        },
      ],
    };
    const client = createMockClient(rulesResponse);
    captureHandler(registerGetSubredditRulesTool, client);

    const result = await capturedHandler({ subreddit: "test" });
    const data = JSON.parse(result.content[0].text);

    expect(data.rules).toHaveLength(2);
    expect(data.rules[0]).toMatchObject({
      kind: "all",
      name: "Be nice",
      description: "Be respectful to others",
    });
    expect(data.count).toBe(2);
  });

  it("handles empty rules list", async () => {
    const client = createMockClient({ rules: [] });
    captureHandler(registerGetSubredditRulesTool, client);

    const result = await capturedHandler({ subreddit: "test" });
    const data = JSON.parse(result.content[0].text);
    expect(data.rules).toHaveLength(0);
    expect(data.count).toBe(0);
  });

  it("returns isError on failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(registerGetSubredditRulesTool, client);

    const result = await capturedHandler({ subreddit: "test" });
    expect(result.isError).toBe(true);
  });
});
