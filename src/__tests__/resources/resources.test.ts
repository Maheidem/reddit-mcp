import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../reddit/client.js";
import type { RedditConfig } from "../../reddit/config.js";
import { registerSubredditResources } from "../../resources/subreddit.js";
import { registerUserResource } from "../../resources/user.js";
import { registerPostResource } from "../../resources/post.js";
import { registerWikiResource } from "../../resources/wiki.js";
import { registerMeResource } from "../../resources/me.js";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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

/**
 * Captures resource handlers from server.resource() calls.
 *
 * server.resource() has two overloaded call shapes we need to support:
 * - Template: (name, ResourceTemplate, { description }, handler)
 * - Static:   (name, uri_string, { description }, handler)
 *
 * The handler is always the last argument.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResourceHandler = (...args: any[]) => Promise<any>;

function captureResourceHandlers(
  registerFn: (server: McpServer, client: RedditClient, config: RedditConfig) => void,
  client: RedditClient,
  config: RedditConfig = mockConfig,
): { names: string[]; handlers: Map<string, ResourceHandler> } {
  const names: string[] = [];
  const handlers = new Map<string, ResourceHandler>();

  const mockServer = {
    resource: vi.fn((...args: unknown[]) => {
      const name = args[0] as string;
      // Handler is always the last argument
      const handler = args[args.length - 1] as ResourceHandler;
      names.push(name);
      handlers.set(name, handler);
    }),
  } as unknown as McpServer;

  registerFn(mockServer, client, config);
  return { names, handlers };
}

// ---------------------------------------------------------------------------
// Subreddit resources
// ---------------------------------------------------------------------------

describe("subreddit resources", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registers two resources: subreddit_info and subreddit_rules", () => {
    const client = createMockClient(null);
    const { names } = captureResourceHandlers(registerSubredditResources, client);

    expect(names).toHaveLength(2);
    expect(names).toContain("subreddit_info");
    expect(names).toContain("subreddit_rules");
  });

  describe("subreddit_info", () => {
    const subAboutResponse = {
      kind: "t5",
      data: {
        display_name: "programming",
        title: "programming",
        public_description: "Computer programming",
        description: "Full description here",
        subscribers: 5000000,
        active_user_count: 10000,
        created_utc: 1200000000,
        over18: false,
        subreddit_type: "public",
        url: "/r/programming/",
      },
    };

    it("returns correctly shaped data", async () => {
      const client = createMockClient(subAboutResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_info")!;

      const uri = new URL("reddit://subreddit/programming/info");
      const result = await handler(uri, { name: "programming" });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe("application/json");

      const data = JSON.parse(result.contents[0].text);
      expect(data.name).toBe("programming");
      expect(data.title).toBe("programming");
      expect(data.description).toBe("Computer programming");
      expect(data.full_description).toBe("Full description here");
      expect(data.subscribers).toBe(5000000);
      expect(data.active_users).toBe(10000);
      expect(data.created_utc).toBe(1200000000);
      expect(data.is_nsfw).toBe(false);
      expect(data.type).toBe("public");
      expect(data.url).toBe("/r/programming/");
    });

    it("calls client.get with the correct endpoint", async () => {
      const client = createMockClient(subAboutResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_info")!;

      await handler(new URL("reddit://subreddit/test/info"), { name: "test" });

      expect(client.get).toHaveBeenCalledWith("/r/test/about");
    });

    it("sets the uri in the response", async () => {
      const client = createMockClient(subAboutResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_info")!;

      const uri = new URL("reddit://subreddit/programming/info");
      const result = await handler(uri, { name: "programming" });

      expect(result.contents[0].uri).toBe("reddit://subreddit/programming/info");
    });

    it("maps over18 to is_nsfw correctly for NSFW subreddit", async () => {
      const nsfwResponse = {
        kind: "t5",
        data: { ...subAboutResponse.data, over18: true },
      };
      const client = createMockClient(nsfwResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_info")!;

      const result = await handler(new URL("reddit://subreddit/nsfw/info"), { name: "nsfw" });
      const data = JSON.parse(result.contents[0].text);
      expect(data.is_nsfw).toBe(true);
    });
  });

  describe("subreddit_rules", () => {
    const rulesResponse = {
      rules: [
        {
          kind: "all",
          short_name: "Be nice",
          description: "Be respectful to others",
          violation_reason: "Not being nice",
        },
        {
          kind: "link",
          short_name: "No spam",
          description: "Don't post spam",
          violation_reason: "Spam",
        },
      ],
    };

    it("returns correctly shaped rules data", async () => {
      const client = createMockClient(rulesResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_rules")!;

      const uri = new URL("reddit://subreddit/test/rules");
      const result = await handler(uri, { name: "test" });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe("application/json");

      const data = JSON.parse(result.contents[0].text);
      expect(data.subreddit).toBe("test");
      expect(data.rules).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.rules[0]).toEqual({
        kind: "all",
        name: "Be nice",
        description: "Be respectful to others",
        violation_reason: "Not being nice",
      });
      expect(data.rules[1]).toEqual({
        kind: "link",
        name: "No spam",
        description: "Don't post spam",
        violation_reason: "Spam",
      });
    });

    it("calls client.get with the correct endpoint", async () => {
      const client = createMockClient(rulesResponse);
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_rules")!;

      await handler(new URL("reddit://subreddit/test/rules"), { name: "test" });

      expect(client.get).toHaveBeenCalledWith("/r/test/about/rules");
    });

    it("handles empty rules list", async () => {
      const client = createMockClient({ rules: [] });
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_rules")!;

      const result = await handler(new URL("reddit://subreddit/test/rules"), { name: "test" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.rules).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("handles missing rules property gracefully", async () => {
      const client = createMockClient({});
      const { handlers } = captureResourceHandlers(registerSubredditResources, client);
      const handler = handlers.get("subreddit_rules")!;

      const result = await handler(new URL("reddit://subreddit/test/rules"), { name: "test" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.rules).toHaveLength(0);
      expect(data.count).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// User profile resource
// ---------------------------------------------------------------------------

describe("user_profile resource", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const userAboutResponse = {
    kind: "t2",
    data: {
      name: "testuser",
      id: "abc123",
      link_karma: 50000,
      comment_karma: 120000,
      total_karma: 170000,
      created_utc: 1300000000,
      is_gold: true,
      is_mod: false,
      has_verified_email: true,
      icon_img: "https://styles.redditmedia.com/icon.png",
    },
  };

  it("registers with the name user_profile", () => {
    const client = createMockClient(null);
    const { names } = captureResourceHandlers(registerUserResource, client);

    expect(names).toHaveLength(1);
    expect(names[0]).toBe("user_profile");
  });

  it("returns correctly shaped user data", async () => {
    const client = createMockClient(userAboutResponse);
    const { handlers } = captureResourceHandlers(registerUserResource, client);
    const handler = handlers.get("user_profile")!;

    const uri = new URL("reddit://user/testuser/about");
    const result = await handler(uri, { username: "testuser" });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    const data = JSON.parse(result.contents[0].text);
    expect(data.username).toBe("testuser");
    expect(data.id).toBe("abc123");
    expect(data.link_karma).toBe(50000);
    expect(data.comment_karma).toBe(120000);
    expect(data.total_karma).toBe(170000);
    expect(data.created_utc).toBe(1300000000);
    expect(data.is_gold).toBe(true);
    expect(data.is_mod).toBe(false);
    expect(data.has_verified_email).toBe(true);
    expect(data.icon_img).toBe("https://styles.redditmedia.com/icon.png");
  });

  it("calls client.get with the correct endpoint", async () => {
    const client = createMockClient(userAboutResponse);
    const { handlers } = captureResourceHandlers(registerUserResource, client);
    const handler = handlers.get("user_profile")!;

    await handler(new URL("reddit://user/testuser/about"), { username: "testuser" });

    expect(client.get).toHaveBeenCalledWith("/user/testuser/about");
  });

  it("sets the uri in the response", async () => {
    const client = createMockClient(userAboutResponse);
    const { handlers } = captureResourceHandlers(registerUserResource, client);
    const handler = handlers.get("user_profile")!;

    const uri = new URL("reddit://user/testuser/about");
    const result = await handler(uri, { username: "testuser" });

    expect(result.contents[0].uri).toBe("reddit://user/testuser/about");
  });
});

// ---------------------------------------------------------------------------
// Post details resource
// ---------------------------------------------------------------------------

describe("post_details resource", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const postData = {
    name: "t3_abc123",
    title: "Test Post",
    author: "testuser",
    subreddit: "test",
    selftext: "This is a test post body",
    url: "https://reddit.com/r/test/comments/abc123/test_post/",
    permalink: "/r/test/comments/abc123/test_post/",
    domain: "self.test",
    score: 42,
    upvote_ratio: 0.95,
    num_comments: 10,
    created_utc: 1400000000,
    edited: false,
    over_18: false,
    spoiler: false,
    locked: false,
    is_self: true,
    is_video: false,
    link_flair_text: "Discussion",
    // Fields needed by detectPostType / isDeleted / isRemoved
    is_gallery: undefined,
    poll_data: undefined,
    crosspost_parent: undefined,
    post_hint: undefined,
    preview: undefined,
    media: null,
    body: undefined,
  };

  const listingResponse = {
    kind: "Listing",
    data: {
      children: [{ kind: "t3", data: postData }],
      after: null,
      before: null,
    },
  };

  it("registers with the name post_details", () => {
    const client = createMockClient(null);
    const { names } = captureResourceHandlers(registerPostResource, client);

    expect(names).toHaveLength(1);
    expect(names[0]).toBe("post_details");
  });

  it("returns correctly shaped post data", async () => {
    const client = createMockClient(listingResponse);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    const uri = new URL("reddit://post/abc123");
    const result = await handler(uri, { id: "abc123" });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    const data = JSON.parse(result.contents[0].text);
    expect(data.id).toBe("t3_abc123");
    expect(data.title).toBe("Test Post");
    expect(data.author).toBe("testuser");
    expect(data.subreddit).toBe("test");
    expect(data.selftext).toBe("This is a test post body");
    expect(data.permalink).toBe("https://reddit.com/r/test/comments/abc123/test_post/");
    expect(data.score).toBe(42);
    expect(data.upvote_ratio).toBe(0.95);
    expect(data.num_comments).toBe(10);
    expect(data.is_nsfw).toBe(false);
    expect(data.is_spoiler).toBe(false);
    expect(data.is_locked).toBe(false);
    expect(data.link_flair).toBe("Discussion");
    expect(data.domain).toBe("self.test");
    expect(data.post_type).toBe("self");
  });

  it("prepends t3_ prefix when given a bare ID", async () => {
    const client = createMockClient(listingResponse);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    await handler(new URL("reddit://post/abc123"), { id: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/api/info", { id: "t3_abc123" });
  });

  it("does not double-prefix when given t3_ prefixed ID", async () => {
    const client = createMockClient(listingResponse);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    await handler(new URL("reddit://post/t3_abc123"), { id: "t3_abc123" });

    expect(client.get).toHaveBeenCalledWith("/api/info", { id: "t3_abc123" });
  });

  it("returns not found error when children array is empty", async () => {
    const emptyListing = {
      kind: "Listing",
      data: { children: [], after: null, before: null },
    };
    const client = createMockClient(emptyListing);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    const uri = new URL("reddit://post/nonexistent");
    const result = await handler(uri, { id: "nonexistent" });

    const data = JSON.parse(result.contents[0].text);
    expect(data.error).toBe("Post not found: nonexistent");
  });

  it("includes is_deleted and is_removed flags", async () => {
    const deletedPost = {
      ...postData,
      author: "[deleted]",
      selftext: "[deleted]",
    };
    const deletedListing = {
      kind: "Listing",
      data: {
        children: [{ kind: "t3", data: deletedPost }],
        after: null,
        before: null,
      },
    };
    const client = createMockClient(deletedListing);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    const result = await handler(new URL("reddit://post/del123"), { id: "del123" });
    const data = JSON.parse(result.contents[0].text);

    expect(data.is_deleted).toBe(true);
    expect(data.is_removed).toBe(false);
  });

  it("detects removed posts", async () => {
    const removedPost = {
      ...postData,
      selftext: "[removed]",
    };
    const removedListing = {
      kind: "Listing",
      data: {
        children: [{ kind: "t3", data: removedPost }],
        after: null,
        before: null,
      },
    };
    const client = createMockClient(removedListing);
    const { handlers } = captureResourceHandlers(registerPostResource, client);
    const handler = handlers.get("post_details")!;

    const result = await handler(new URL("reddit://post/rem123"), { id: "rem123" });
    const data = JSON.parse(result.contents[0].text);

    expect(data.is_removed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Wiki page resource
// ---------------------------------------------------------------------------

describe("wiki_page resource", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const wikiResponse = {
    data: {
      content_md: "# Welcome\n\nThis is the wiki page content.",
      content_html: "<h1>Welcome</h1><p>This is the wiki page content.</p>",
      revision_by: { data: { name: "wiki_editor" } },
      revision_date: 1500000000,
      may_revise: false,
    },
    kind: "wikipage",
  };

  it("registers with the name wiki_page", () => {
    const client = createMockClient(null);
    const { names } = captureResourceHandlers(registerWikiResource, client);

    expect(names).toHaveLength(1);
    expect(names[0]).toBe("wiki_page");
  });

  it("returns correctly shaped wiki data", async () => {
    const client = createMockClient(wikiResponse);
    const { handlers } = captureResourceHandlers(registerWikiResource, client);
    const handler = handlers.get("wiki_page")!;

    const uri = new URL("reddit://subreddit/test/wiki/index");
    const result = await handler(uri, { name: "test", page: "index" });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    const data = JSON.parse(result.contents[0].text);
    expect(data.subreddit).toBe("test");
    expect(data.page).toBe("index");
    expect(data.content).toBe("# Welcome\n\nThis is the wiki page content.");
    expect(data.revised_by).toBe("wiki_editor");
    expect(data.revision_date).toBe(1500000000);
  });

  it("calls client.get with the correct endpoint", async () => {
    const client = createMockClient(wikiResponse);
    const { handlers } = captureResourceHandlers(registerWikiResource, client);
    const handler = handlers.get("wiki_page")!;

    await handler(new URL("reddit://subreddit/test/wiki/faq"), { name: "test", page: "faq" });

    expect(client.get).toHaveBeenCalledWith("/r/test/wiki/faq");
  });

  it("handles missing revision_by gracefully", async () => {
    const noAuthorResponse = {
      data: {
        content_md: "Content",
        content_html: "<p>Content</p>",
        revision_by: null,
        revision_date: 1500000000,
        may_revise: false,
      },
      kind: "wikipage",
    };
    const client = createMockClient(noAuthorResponse);
    const { handlers } = captureResourceHandlers(registerWikiResource, client);
    const handler = handlers.get("wiki_page")!;

    const result = await handler(
      new URL("reddit://subreddit/test/wiki/index"),
      { name: "test", page: "index" },
    );
    const data = JSON.parse(result.contents[0].text);

    expect(data.revised_by).toBe("unknown");
  });

  it("sets the uri in the response", async () => {
    const client = createMockClient(wikiResponse);
    const { handlers } = captureResourceHandlers(registerWikiResource, client);
    const handler = handlers.get("wiki_page")!;

    const uri = new URL("reddit://subreddit/test/wiki/index");
    const result = await handler(uri, { name: "test", page: "index" });

    expect(result.contents[0].uri).toBe("reddit://subreddit/test/wiki/index");
  });
});

// ---------------------------------------------------------------------------
// Authenticated user (me) resource
// ---------------------------------------------------------------------------

describe("me resource", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const meApiResponse = {
    name: "authenticated_user",
    id: "user123",
    link_karma: 10000,
    comment_karma: 25000,
    total_karma: 35000,
    created_utc: 1350000000,
    inbox_count: 3,
    has_mail: true,
    has_mod_mail: false,
    is_gold: false,
    is_mod: true,
    has_verified_email: true,
    icon_img: "https://styles.redditmedia.com/user_icon.png",
    snoovatar_img: "",
    over_18: false,
  };

  it("registers with the name me", () => {
    const client = createMockClient(null);
    const { names } = captureResourceHandlers(registerMeResource, client);

    expect(names).toHaveLength(1);
    expect(names[0]).toBe("me");
  });

  it("returns auth error when tier is anon", async () => {
    const client = createMockClient(null);
    const anonConfig: RedditConfig = { ...mockConfig, tier: "anon" };
    const { handlers } = captureResourceHandlers(registerMeResource, client, anonConfig);
    const handler = handlers.get("me")!;

    const uri = new URL("reddit://me");
    const result = await handler(uri);

    const data = JSON.parse(result.contents[0].text);
    expect(data.error).toBeDefined();
    expect(data.error).toContain("user-level authentication");
    expect(data.error).toContain("anon");
  });

  it("returns auth error when tier is app", async () => {
    const client = createMockClient(null);
    const appConfig: RedditConfig = {
      ...mockConfig,
      tier: "app",
      clientId: "test_id",
      clientSecret: "test_secret",
    };
    const { handlers } = captureResourceHandlers(registerMeResource, client, appConfig);
    const handler = handlers.get("me")!;

    const uri = new URL("reddit://me");
    const result = await handler(uri);

    const data = JSON.parse(result.contents[0].text);
    expect(data.error).toBeDefined();
    expect(data.error).toContain("user-level authentication");
  });

  it("returns correctly shaped user data when tier is user", async () => {
    const client = createMockClient(meApiResponse);
    const userConfig: RedditConfig = {
      ...mockConfig,
      tier: "user",
      clientId: "test_id",
      clientSecret: "test_secret",
      username: "authenticated_user",
      password: "password",
    };
    const { handlers } = captureResourceHandlers(registerMeResource, client, userConfig);
    const handler = handlers.get("me")!;

    const uri = new URL("reddit://me");
    const result = await handler(uri);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    const data = JSON.parse(result.contents[0].text);
    expect(data.username).toBe("authenticated_user");
    expect(data.id).toBe("user123");
    expect(data.link_karma).toBe(10000);
    expect(data.comment_karma).toBe(25000);
    expect(data.total_karma).toBe(35000);
    expect(data.created_utc).toBe(1350000000);
    expect(data.inbox_count).toBe(3);
    expect(data.has_mail).toBe(true);
    expect(data.has_mod_mail).toBe(false);
    expect(data.is_gold).toBe(false);
    expect(data.is_mod).toBe(true);
    expect(data.has_verified_email).toBe(true);
    expect(data.icon_img).toBe("https://styles.redditmedia.com/user_icon.png");
  });

  it("calls client.get with /api/v1/me when authenticated", async () => {
    const client = createMockClient(meApiResponse);
    const userConfig: RedditConfig = {
      ...mockConfig,
      tier: "user",
      clientId: "test_id",
      clientSecret: "test_secret",
      username: "authenticated_user",
      password: "password",
    };
    const { handlers } = captureResourceHandlers(registerMeResource, client, userConfig);
    const handler = handlers.get("me")!;

    await handler(new URL("reddit://me"));

    expect(client.get).toHaveBeenCalledWith("/api/v1/me");
  });

  it("does not call client.get when auth fails", async () => {
    const client = createMockClient(null);
    const { handlers } = captureResourceHandlers(registerMeResource, client);
    const handler = handlers.get("me")!;

    await handler(new URL("reddit://me"));

    expect(client.get).not.toHaveBeenCalled();
  });

  it("sets the uri in the response on success", async () => {
    const client = createMockClient(meApiResponse);
    const userConfig: RedditConfig = {
      ...mockConfig,
      tier: "user",
      clientId: "test_id",
      clientSecret: "test_secret",
      username: "authenticated_user",
      password: "password",
    };
    const { handlers } = captureResourceHandlers(registerMeResource, client, userConfig);
    const handler = handlers.get("me")!;

    const uri = new URL("reddit://me");
    const result = await handler(uri);

    expect(result.contents[0].uri).toBe("reddit://me");
  });

  it("sets the uri in the response on auth error", async () => {
    const client = createMockClient(null);
    const { handlers } = captureResourceHandlers(registerMeResource, client);
    const handler = handlers.get("me")!;

    const uri = new URL("reddit://me");
    const result = await handler(uri);

    expect(result.contents[0].uri).toBe("reddit://me");
  });
});
