/**
 * Integration tests for all 12 read tools via real MCP protocol roundtrips.
 * Uses InMemoryTransport with mocked RedditClient.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  createIntegrationServer,
  mockResponse,
  type MockRedditClient,
  type IntegrationServer,
} from "../helpers/integration-server.js";

describe("Read Tools — Integration", () => {
  let env: IntegrationServer;
  let client: Client;
  let mock: MockRedditClient;

  beforeEach(async () => {
    env = await createIntegrationServer({ tier: "user" });
    client = env.client;
    mock = env.mockRedditClient;
  });

  afterEach(async () => {
    await env.cleanup();
  });

  // ─── Helpers ────────────────────────────────────────────────────────

  function makeListing(children: unknown[], after: string | null = null) {
    return {
      kind: "Listing",
      data: { children, after, before: null, dist: children.length },
    };
  }

  function makePostThing(overrides: Record<string, unknown> = {}) {
    return {
      kind: "t3",
      data: {
        id: "abc",
        name: "t3_abc",
        title: "Test",
        author: "u1",
        subreddit: "test",
        score: 10,
        num_comments: 5,
        created_utc: 1700000000,
        permalink: "/r/test/abc",
        url: "https://reddit.com/abc",
        selftext: "",
        selftext_html: null,
        is_self: true,
        over_18: false,
        spoiler: false,
        stickied: false,
        locked: false,
        archived: false,
        edited: false,
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
        domain: "self.test",
        upvote_ratio: 0.95,
        subreddit_name_prefixed: "r/test",
        ...overrides,
      },
    };
  }

  // ─── 1. search ──────────────────────────────────────────────────────

  describe("search", () => {
    it("returns posts matching query", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse(makeListing([makePostThing()])),
      );

      const result = await client.callTool({ name: "search", arguments: { q: "test" } });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.posts).toHaveLength(1);
      expect(parsed.posts[0].title).toBe("Test");
    });

    it("returns validation error for missing required arg q", async () => {
      const result = await client.callTool({ name: "search", arguments: {} });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 2. get_post ───────────────────────────────────────────────────

  describe("get_post", () => {
    it("returns post details with subreddit", async () => {
      const twoElementArray = [
        makeListing([makePostThing()]),
        makeListing([]),
      ];
      mock.get.mockResolvedValueOnce(mockResponse(twoElementArray));

      const result = await client.callTool({
        name: "get_post",
        arguments: { post_id: "abc123", subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.title).toBe("Test");
    });

    it("returns error when post not found", async () => {
      mock.get.mockResolvedValueOnce(mockResponse(makeListing([])));

      const result = await client.callTool({
        name: "get_post",
        arguments: { post_id: "nonexistent" },
      });

      expect(result.isError).toBe(true);
    });
  });

  // ─── 3. get_comments ──────────────────────────────────────────────

  describe("get_comments", () => {
    it("returns flattened comment tree", async () => {
      const commentThing = {
        kind: "t1",
        data: {
          name: "t1_c1",
          author: "commenter",
          body: "Great post!",
          score: 5,
          created_utc: 1700000100,
          edited: false,
          depth: 0,
          is_submitter: false,
          distinguished: null,
          stickied: false,
          replies: "",
        },
      };
      const twoElementArray = [
        makeListing([makePostThing()]),
        makeListing([commentThing]),
      ];
      mock.get.mockResolvedValueOnce(mockResponse(twoElementArray));

      const result = await client.callTool({
        name: "get_comments",
        arguments: { post_id: "abc123", subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.comments).toHaveLength(1);
      expect(parsed.comments[0].body).toBe("Great post!");
    });

    it("returns validation error for missing required subreddit arg", async () => {
      const result = await client.callTool({
        name: "get_comments",
        arguments: { post_id: "abc" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 4. get_subreddit ─────────────────────────────────────────────

  describe("get_subreddit", () => {
    it("returns subreddit info", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          kind: "t5",
          data: {
            display_name: "programming",
            title: "Programming",
            public_description: "CS stuff",
            description: "Full description",
            subscribers: 5000000,
            active_user_count: 12000,
            created_utc: 1100000000,
            over18: false,
            subreddit_type: "public",
            url: "/r/programming/",
            lang: "en",
            allow_images: true,
            allow_videos: true,
            allow_polls: true,
            user_is_subscriber: false,
            user_is_moderator: false,
          },
        }),
      );

      const result = await client.callTool({
        name: "get_subreddit",
        arguments: { subreddit: "programming" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.name).toBe("programming");
      expect(parsed.subscribers).toBe(5000000);
    });

    it("returns validation error for missing subreddit arg", async () => {
      const result = await client.callTool({ name: "get_subreddit", arguments: {} });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 5. get_subreddit_rules ───────────────────────────────────────

  describe("get_subreddit_rules", () => {
    it("returns subreddit rules", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          rules: [
            {
              short_name: "Rule 1",
              description: "Be nice",
              kind: "all",
              violation_reason: "Rude",
              created_utc: 1600000000,
              priority: 0,
            },
          ],
        }),
      );

      const result = await client.callTool({
        name: "get_subreddit_rules",
        arguments: { subreddit: "programming" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.rules).toHaveLength(1);
      expect(parsed.rules[0].name).toBe("Rule 1");
    });
  });

  // ─── 6. get_subreddit_posts ───────────────────────────────────────

  describe("get_subreddit_posts", () => {
    it("returns listing of posts", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse(makeListing([makePostThing()])),
      );

      const result = await client.callTool({
        name: "get_subreddit_posts",
        arguments: { subreddit: "programming" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.posts).toHaveLength(1);
    });
  });

  // ─── 7. get_user ──────────────────────────────────────────────────

  describe("get_user", () => {
    it("returns user profile", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          kind: "t2",
          data: {
            name: "spez",
            id: "1w72",
            link_karma: 100000,
            comment_karma: 200000,
            total_karma: 300000,
            created_utc: 1100000000,
            is_gold: true,
            is_mod: true,
            has_verified_email: true,
            icon_img: "https://reddit.com/icon.png",
            snoovatar_img: null,
          },
        }),
      );

      const result = await client.callTool({
        name: "get_user",
        arguments: { username: "spez" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.username).toBe("spez");
      expect(parsed.total_karma).toBe(300000);
    });

    it("returns validation error for missing username arg", async () => {
      const result = await client.callTool({ name: "get_user", arguments: {} });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 8. get_user_posts ────────────────────────────────────────────

  describe("get_user_posts", () => {
    it("returns user submitted posts", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse(makeListing([makePostThing({ author: "spez" })])),
      );

      const result = await client.callTool({
        name: "get_user_posts",
        arguments: { username: "spez" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.posts).toHaveLength(1);
    });
  });

  // ─── 9. get_user_comments ─────────────────────────────────────────

  describe("get_user_comments", () => {
    it("returns user comments", async () => {
      const commentThing = {
        kind: "t1",
        data: {
          name: "t1_c1",
          author: "spez",
          body: "Hello!",
          subreddit: "announcements",
          score: 50,
          created_utc: 1700000000,
          edited: false,
          is_submitter: false,
          permalink: "/r/announcements/comments/x/y/c1",
          link_title: "Reddit Update",
        },
      };
      mock.get.mockResolvedValueOnce(
        mockResponse(makeListing([commentThing])),
      );

      const result = await client.callTool({
        name: "get_user_comments",
        arguments: { username: "spez" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.comments).toHaveLength(1);
      expect(parsed.comments[0].body).toBe("Hello!");
    });
  });

  // ─── 10. get_trending ─────────────────────────────────────────────

  describe("get_trending", () => {
    it("returns popular subreddits", async () => {
      const subThing = {
        kind: "t5",
        data: {
          display_name: "AskReddit",
          title: "Ask Reddit",
          public_description: "Ask away",
          subscribers: 40000000,
          active_user_count: 50000,
          over18: false,
          url: "/r/AskReddit/",
          subreddit_type: "public",
          created_utc: 1100000000,
        },
      };
      mock.get.mockResolvedValueOnce(
        mockResponse(makeListing([subThing])),
      );

      const result = await client.callTool({
        name: "get_trending",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.subreddits).toHaveLength(1);
      expect(parsed.subreddits[0].name).toBe("AskReddit");
    });
  });

  // ─── 11. get_wiki_page ────────────────────────────────────────────

  describe("get_wiki_page", () => {
    it("returns wiki page content", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          kind: "wikipage",
          data: {
            content_md: "# Wiki",
            content_html: "<h1>Wiki</h1>",
            revision_by: { data: { name: "author" } },
            revision_date: 1700000000,
            may_revise: false,
          },
        }),
      );

      const result = await client.callTool({
        name: "get_wiki_page",
        arguments: { subreddit: "test", page: "index" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.content).toBe("# Wiki");
      expect(parsed.revised_by).toBe("author");
    });

    it("returns validation error for missing required page arg", async () => {
      const result = await client.callTool({
        name: "get_wiki_page",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 12. get_me ───────────────────────────────────────────────────

  describe("get_me", () => {
    it("returns authenticated user profile", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          name: "testuser",
          id: "abc123",
          link_karma: 1000,
          comment_karma: 2000,
          total_karma: 3000,
          created_utc: 1600000000,
          inbox_count: 3,
          has_mail: true,
          has_mod_mail: false,
          is_gold: false,
          is_mod: false,
          has_verified_email: true,
          icon_img: "https://reddit.com/icon.png",
          snoovatar_img: null,
          over_18: false,
          is_employee: false,
        }),
      );

      const result = await client.callTool({
        name: "get_me",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.username).toBe("testuser");
      expect(parsed.inbox_count).toBe(3);
    });

    it("rejects when auth tier is anon", async () => {
      await env.cleanup();
      env = await createIntegrationServer({ tier: "anon" });
      client = env.client;

      const result = await client.callTool({
        name: "get_me",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("user-level authentication");
    });
  });
});
