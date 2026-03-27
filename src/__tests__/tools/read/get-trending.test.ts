import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetTrendingTool } from "../../../tools/read/get-trending.js";

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
  registerGetTrendingTool(mockServer, client, mockConfig);
}

describe("get_trending tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns list of subreddits with subscriber counts", async () => {
    const listing = {
      kind: "Listing",
      data: {
        children: [
          {
            kind: "t5",
            data: {
              id: "2qh1i",
              name: "t5_2qh1i",
              display_name: "programming",
              display_name_prefixed: "r/programming",
              title: "programming",
              public_description: "Computer programming",
              description: "",
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
          },
        ],
        after: "t5_next",
        before: null,
        dist: 1,
      },
    };
    const client = createMockClient(listing);
    captureHandler(client);

    const result = await capturedHandler({ limit: 25 });
    const data = JSON.parse(result.content[0].text);

    expect(data.subreddits).toHaveLength(1);
    expect(data.subreddits[0].name).toBe("programming");
    expect(data.subreddits[0].subscribers).toBe(5000000);
    expect(data.after).toBe("t5_next");
  });

  it("uses over18 for NSFW", async () => {
    const listing = {
      kind: "Listing",
      data: {
        children: [
          {
            kind: "t5",
            data: {
              display_name: "nsfw",
              title: "NSFW",
              public_description: "",
              subscribers: 100,
              active_user_count: 5,
              over18: true,
              subreddit_type: "public",
              url: "/r/nsfw/",
              created_utc: 1200000000,
            },
          },
        ],
        after: null,
        before: null,
        dist: 1,
      },
    };
    const client = createMockClient(listing);
    captureHandler(client);

    const result = await capturedHandler({ limit: 25 });
    const data = JSON.parse(result.content[0].text);
    expect(data.subreddits[0].is_nsfw).toBe(true);
  });

  it("passes after cursor for pagination", async () => {
    const client = createMockClient({
      kind: "Listing",
      data: { children: [], after: null, before: null, dist: 0 },
    });
    captureHandler(client);

    await capturedHandler({ limit: 10, after: "t5_abc" });
    expect(client.get).toHaveBeenCalledWith(
      "/subreddits/popular",
      expect.objectContaining({ after: "t5_abc", limit: "10" }),
    );
  });

  it("returns isError on failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(client);

    const result = await capturedHandler({ limit: 25 });
    expect(result.isError).toBe(true);
  });
});
