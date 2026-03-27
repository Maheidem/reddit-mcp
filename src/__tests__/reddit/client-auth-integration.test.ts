import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditClient } from "../../reddit/client.js";
import { RedditAuthManager } from "../../reddit/auth.js";
import type { TokenGrant, TokenResponse } from "../../reddit/auth.js";
import type { AuthTier } from "../../reddit/config.js";

const USER_AGENT = "nodejs:test-app:1.0.0 (by /u/testuser)";

/** Helper to create a mock fetch Response (plain object to avoid body-already-read issues with fake timers). */
function mockResponse(body: unknown, status = 200): Response {
  return {
    json: () => Promise.resolve(body),
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
  } as unknown as Response;
}

/** Helper to create a mock TokenGrant. */
function createMockGrant(
  tier: AuthTier = "app",
  token = "mock-access-token",
): TokenGrant & { authenticate: ReturnType<typeof vi.fn> } {
  return {
    tier,
    authenticate: vi.fn<() => Promise<TokenResponse>>().mockResolvedValue({
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      scope: "read",
    }),
  };
}

describe("RedditClient + RedditAuthManager Integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Return a fresh Response per call to avoid "Body already read" errors
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(mockResponse({ ok: true })),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Bearer token injection", () => {
    it("should inject Bearer token into GET requests", async () => {
      const grant = createMockGrant("app", "my-app-token");
      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      await client.get("/r/programming/hot");

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer my-app-token");
    });

    it("should inject Bearer token into POST requests", async () => {
      const grant = createMockGrant("user", "my-user-token");
      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      await client.post("/api/submit", { title: "Test" });

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer my-user-token");
    });
  });

  describe("transparent token refresh", () => {
    it("should transparently refresh an expired token before request", async () => {
      vi.useFakeTimers();

      const grant = createMockGrant("app");
      grant.authenticate
        .mockResolvedValueOnce({
          access_token: "token-1",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        })
        .mockResolvedValueOnce({
          access_token: "token-2",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        });

      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      // First request — gets token-1
      await client.get("/test1");
      const headers1 = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers1["Authorization"]).toBe("Bearer token-1");

      // Advance past 50-minute refresh window
      vi.advanceTimersByTime(51 * 60 * 1000);

      // Second request — should transparently refresh to token-2
      await client.get("/test2");
      const headers2 = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
      expect(headers2["Authorization"]).toBe("Bearer token-2");

      // Verify authenticate was called twice (initial + refresh)
      expect(grant.authenticate).toHaveBeenCalledTimes(2);
    });

    it("should reuse cached token within 50-minute window", async () => {
      vi.useFakeTimers();

      const grant = createMockGrant("app", "cached-token");
      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      // Multiple requests within the window
      await client.get("/test1");
      vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
      await client.get("/test2");
      vi.advanceTimersByTime(10 * 60 * 1000); // 40 minutes total
      await client.get("/test3");

      // All 3 requests should use the same token
      expect(grant.authenticate).toHaveBeenCalledOnce();
      for (let i = 0; i < 3; i++) {
        const headers = (fetchMock.mock.calls[i][1] as RequestInit).headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer cached-token");
      }
    });
  });

  describe("auth manager priority over manual auth header", () => {
    it("should prefer auth manager over setAuthHeader", async () => {
      const grant = createMockGrant("app", "manager-token");
      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      client.setAuthHeader("Bearer manual-token");
      await client.get("/test");

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer manager-token");
    });
  });

  describe("client without auth manager", () => {
    it("should work without auth manager (backward compatible)", async () => {
      const client = new RedditClient({ userAgent: USER_AGENT });

      await client.get("/test");

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("should use manual setAuthHeader when no auth manager", async () => {
      const client = new RedditClient({ userAgent: USER_AGENT });

      client.setAuthHeader("Bearer manual-token");
      await client.get("/test");

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer manual-token");
    });
  });

  describe("base URL per auth tier", () => {
    it("should use oauth.reddit.com by default (authenticated tiers)", async () => {
      const grant = createMockGrant("app", "token");
      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      await client.get("/r/test/hot");

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin).toBe("https://oauth.reddit.com");
    });

    it("should use www.reddit.com for anonymous fallback", async () => {
      const client = new RedditClient({
        userAgent: USER_AGENT,
        baseUrl: "https://www.reddit.com",
      });

      await client.get("/r/test/hot.json");

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin).toBe("https://www.reddit.com");
    });
  });

  describe("token security", () => {
    it("should not expose token values in error messages on auth failure", async () => {
      const grant = createMockGrant("app");
      grant.authenticate.mockRejectedValue(new Error("Network error"));

      const authManager = new RedditAuthManager(grant);
      const client = new RedditClient({ userAgent: USER_AGENT, authManager });

      try {
        await client.get("/test");
      } catch (error: unknown) {
        const message = (error as Error).message;
        expect(message).not.toContain("mock-access-token");
      }
    });
  });
});
