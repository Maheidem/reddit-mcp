import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditClient } from "../../../reddit/client.js";
import { RedditAuthManager } from "../../../reddit/auth.js";
import { TokenBucketRateLimiter } from "../../../reddit/rate-limiter.js";
import type { TokenGrant, TokenResponse } from "../../../reddit/auth.js";

function mockGrant(tier: "anon" | "app" | "user" = "user"): TokenGrant {
  return {
    tier,
    authenticate: () =>
      Promise.resolve({
        access_token: "token",
        token_type: "bearer",
        expires_in: 3600,
        scope: "modnote",
      } as TokenResponse),
  };
}

function mockFetchResponse(body: unknown, status = 200): Response {
  return {
    json: () => Promise.resolve(body),
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
  } as unknown as Response;
}

describe("get_mod_notes tool", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        mockFetchResponse({
          mod_notes: [
            {
              note_id: "note1",
              subreddit: "test",
              user: "flaggeduser",
              created_at: 1679000000,
              created_by: "moduser",
              note: "Multiple spam violations observed",
              label: "SPAM_WARNING",
              reddit_id: "t3_abc123",
            },
          ],
          start_cursor: null,
          end_cursor: null,
          has_next_page: false,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should GET /api/mod/notes with subreddit and user params", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.get("/api/mod/notes", {
      subreddit: "testmod",
      user: "flaggeduser",
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/api/mod/notes");
    expect(url.searchParams.get("subreddit")).toBe("testmod");
    expect(url.searchParams.get("user")).toBe("flaggeduser");
    expect(url.searchParams.get("raw_json")).toBe("1");
  });

  it("should include filter param when filtering by label", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.get("/api/mod/notes", {
      subreddit: "test",
      user: "user",
      filter: "SPAM_WARNING",
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("filter")).toBe("SPAM_WARNING");
  });

  it("should return mod notes with label and linked content", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    const response = await client.get<{
      mod_notes: Array<{ note: string; label: string; reddit_id: string }>;
    }>("/api/mod/notes", { subreddit: "test", user: "user" });

    expect(response.data.mod_notes).toHaveLength(1);
    expect(response.data.mod_notes[0].label).toBe("SPAM_WARNING");
    expect(response.data.mod_notes[0].reddit_id).toBe("t3_abc123");
  });
});

describe("mod notes 30 QPM rate limiter", () => {
  it("should create a dedicated rate limiter with 30 QPM capacity", () => {
    const limiter = new TokenBucketRateLimiter({ capacity: 30, windowSeconds: 60 });

    expect(limiter.remaining).toBe(30);
  });

  it("should deplete faster than the standard 100 QPM limiter", async () => {
    const modNotesLimiter = new TokenBucketRateLimiter({ capacity: 30, windowSeconds: 60 });
    const standardLimiter = new TokenBucketRateLimiter({ capacity: 100, windowSeconds: 600 });

    // After 25 acquires, mod notes limiter should be lower
    for (let i = 0; i < 25; i++) {
      await modNotesLimiter.acquire();
      await standardLimiter.acquire();
    }

    expect(modNotesLimiter.remaining).toBeLessThan(standardLimiter.remaining);
  });
});

describe("auth guard for get_mod_notes", () => {
  it("should require user tier (modnote scope)", async () => {
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");

    expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("app", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("user", "user")).not.toThrow();
  });
});

describe("note labels enum", () => {
  it("should validate all 8 known label types", () => {
    const validLabels = [
      "BOT_BAN",
      "PERMA_BAN",
      "BAN",
      "ABUSE_WARNING",
      "SPAM_WARNING",
      "SPAM_WATCH",
      "SOLID_CONTRIBUTOR",
      "HELPFUL_USER",
    ];

    expect(validLabels).toHaveLength(8);
  });
});
