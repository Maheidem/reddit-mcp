/**
 * Test mode support for E2E testing without real Reddit credentials.
 *
 * When `REDDIT_MCP_TEST_MODE=true`, provides mock responses for all tool calls.
 * The mock client pattern-matches on URL paths to return realistic Reddit API
 * response shapes, allowing subprocess E2E tests without network access.
 *
 * @module
 */

import type { RedditClient, RedditResponse } from "./reddit/client.js";
import type { RedditAuthManager } from "./reddit/auth.js";
import type { AuthTier } from "./reddit/config.js";

/** Check if test mode is active via environment variable. */
export function isTestMode(): boolean {
  return process.env.REDDIT_MCP_TEST_MODE === "true";
}

// ─── Mock Data ──────────────────────────────────────────────────────────

const MOCK_POST = {
  id: "mock1",
  name: "t3_mock1",
  title: "Mock Post",
  author: "testuser",
  subreddit: "test",
  subreddit_name_prefixed: "r/test",
  selftext: "Mock content",
  selftext_html: null,
  url: "https://reddit.com/r/test/mock1",
  permalink: "/r/test/comments/mock1/mock_post/",
  domain: "self.test",
  score: 42,
  upvote_ratio: 0.95,
  num_comments: 5,
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
};

const MOCK_LISTING = {
  kind: "Listing" as const,
  data: {
    children: [{ kind: "t3" as const, data: MOCK_POST }],
    after: null,
    before: null,
    dist: 1,
  },
};

const MOCK_POST_DETAIL = [
  {
    kind: "Listing" as const,
    data: {
      children: [{ kind: "t3" as const, data: MOCK_POST }],
      after: null,
      before: null,
      dist: 1,
    },
  },
  {
    kind: "Listing" as const,
    data: { children: [], after: null, before: null, dist: 0 },
  },
];

const MOCK_SUBREDDIT_ABOUT = {
  kind: "t5" as const,
  data: {
    id: "test1",
    name: "t5_test1",
    display_name: "test",
    display_name_prefixed: "r/test",
    title: "Test Sub",
    subscribers: 1000,
    active_user_count: 50,
    public_description: "A test sub",
    description: "Full description",
    description_html: null,
    created_utc: 1600000000,
    over18: false,
    subreddit_type: "public" as const,
    url: "/r/test/",
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

const MOCK_SUBREDDIT_RULES = {
  rules: [
    {
      kind: "all",
      short_name: "Be civil",
      description: "No personal attacks",
      violation_reason: "Incivility",
      priority: 0,
    },
  ],
  site_rules: ["Content policy"],
};

const MOCK_USER_ABOUT = {
  kind: "t2" as const,
  data: {
    id: "user1",
    name: "testuser",
    created_utc: 1500000000,
    link_karma: 1000,
    comment_karma: 5000,
    total_karma: 6000,
    is_gold: false,
    is_mod: false,
    has_verified_email: true,
    icon_img: "",
    snoovatar_img: "",
  },
};

const MOCK_ME = {
  id: "me1",
  name: "mock_me_user",
  created_utc: 1500000000,
  link_karma: 500,
  comment_karma: 2000,
  total_karma: 2500,
  is_gold: false,
  is_mod: true,
  has_verified_email: true,
  icon_img: "",
};

const MOCK_SUBMIT_SUCCESS = {
  json: {
    errors: [],
    data: {
      name: "t3_new",
      url: "https://reddit.com/r/test/new",
      id: "new",
    },
  },
};

const MOCK_COMMENT_SUCCESS = {
  json: {
    errors: [],
    data: {
      things: [{ data: { name: "t1_new", id: "new" } }],
    },
  },
};

const MOCK_EDIT_SUCCESS = {
  json: {
    errors: [],
    data: {
      things: [{ data: { name: "t3_mock1", id: "mock1", body: "edited" } }],
    },
  },
};

const MOCK_WIKI_PAGE = {
  kind: "wikipage" as const,
  data: {
    content_md: "# Wiki Content\n\nMock wiki page content.",
    content_html: "<h1>Wiki Content</h1><p>Mock wiki page content.</p>",
    revision_by: { data: { name: "testuser" } },
    revision_date: 1700000000,
    may_revise: true,
  },
};

const MOCK_MOD_LOG = {
  kind: "Listing" as const,
  data: {
    children: [
      {
        kind: "modaction" as const,
        data: {
          id: "ModAction_1",
          mod: "moduser",
          action: "approvelink",
          target_fullname: "t3_mock1",
          target_author: "testuser",
          subreddit: "test",
          created_utc: 1700000000,
          details: null,
          description: null,
        },
      },
    ],
    after: null,
    before: null,
    dist: 1,
  },
};

const MOCK_MOD_NOTES = {
  mod_notes: [
    {
      id: "note1",
      user: "testuser",
      mod: "moduser",
      note: "Good contributor",
      type: "NOTE",
      created_at: 1700000000,
      subreddit: "test",
    },
  ],
  start_cursor: null,
  end_cursor: null,
  has_next_page: false,
};

// ─── URL Pattern Matching ───────────────────────────────────────────────

/**
 * Match a GET URL path to a mock response.
 * Uses prefix matching against known Reddit API URL patterns.
 */
function matchGetResponse(path: string): unknown {
  // Post detail: /r/{sub}/comments/{id}
  if (/^\/r\/[^/]+\/comments\//.test(path)) {
    return MOCK_POST_DETAIL;
  }

  // Subreddit rules: /r/{sub}/about/rules
  if (/^\/r\/[^/]+\/about\/rules/.test(path)) {
    return MOCK_SUBREDDIT_RULES;
  }

  // Subreddit about: /r/{sub}/about
  if (/^\/r\/[^/]+\/about$/.test(path)) {
    return MOCK_SUBREDDIT_ABOUT;
  }

  // Subreddit wiki: /r/{sub}/wiki/
  if (/^\/r\/[^/]+\/wiki\//.test(path)) {
    return MOCK_WIKI_PAGE;
  }

  // Subreddit posts: /r/{sub}/{sort}
  if (/^\/r\/[^/]+\/(hot|new|top|rising|controversial)/.test(path)) {
    return MOCK_LISTING;
  }

  // User about: /user/{name}/about
  if (/^\/user\/[^/]+\/about/.test(path)) {
    return MOCK_USER_ABOUT;
  }

  // User submitted/comments: /user/{name}/{where}
  if (/^\/user\/[^/]+\/(submitted|comments|overview)/.test(path)) {
    return MOCK_LISTING;
  }

  // Popular subreddits
  if (path.startsWith("/subreddits/popular") || path.startsWith("/subreddits/default")) {
    return MOCK_LISTING;
  }

  // Search
  if (path.endsWith("/search") || path === "/search") {
    return MOCK_LISTING;
  }

  // Authenticated user profile
  if (path === "/api/v1/me") {
    return MOCK_ME;
  }

  // Mod log
  if (/\/about\/log/.test(path)) {
    return MOCK_MOD_LOG;
  }

  // Mod notes
  if (path.startsWith("/api/mod/notes")) {
    return MOCK_MOD_NOTES;
  }

  // Modqueue
  if (/\/about\/modqueue/.test(path)) {
    return MOCK_LISTING;
  }

  // Fallback: return empty listing
  return MOCK_LISTING;
}

/**
 * Match a POST URL path to a mock response.
 */
function matchPostResponse(path: string): unknown {
  if (path === "/api/submit") {
    return MOCK_SUBMIT_SUCCESS;
  }
  if (path === "/api/comment") {
    return MOCK_COMMENT_SUCCESS;
  }
  if (path === "/api/editusertext") {
    return MOCK_EDIT_SUCCESS;
  }

  // All other POST endpoints return empty success
  // (vote, del, approve, remove, compose, friend, etc.)
  return {};
}

// ─── Mock Client & Auth Manager ─────────────────────────────────────────

function mockResponse<T>(data: T): RedditResponse<T> {
  return {
    data,
    headers: new Headers(),
    status: 200,
    rateLimitWarning: null,
  };
}

/**
 * Create a mock RedditClient that returns canned responses
 * based on URL pattern matching. No network calls are made.
 */
export function createMockClient(): RedditClient {
  const client = {
    get: async <T = unknown>(path: string, _params?: Record<string, string>): Promise<RedditResponse<T>> => {
      const data = matchGetResponse(path) as T;
      return mockResponse(data);
    },

    post: async <T = unknown>(path: string, _body?: Record<string, string>): Promise<RedditResponse<T>> => {
      const data = matchPostResponse(path) as T;
      return mockResponse(data);
    },

    setAuthHeader: (_header: string | null): void => {
      // No-op in test mode
    },
  };

  return client as unknown as RedditClient;
}

/**
 * Create a mock RedditAuthManager that always reports "user" tier
 * with a fake token. No real OAuth flows are executed.
 */
export function createMockAuthManager(): RedditAuthManager {
  const manager = {
    tier: "user" as AuthTier,
    hasValidToken: true,
    getAccessToken: async (): Promise<string> => "mock-test-token",
  };

  return manager as unknown as RedditAuthManager;
}
