import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditClient } from "../../../reddit/client.js";
import { RedditAuthManager } from "../../../reddit/auth.js";
import type { TokenGrant, TokenResponse } from "../../../reddit/auth.js";

function mockGrant(tier: "anon" | "app" | "user" = "user"): TokenGrant {
  return {
    tier,
    authenticate: () =>
      Promise.resolve({
        access_token: "token",
        token_type: "bearer",
        expires_in: 3600,
        scope: "read modposts",
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

describe("approve tool", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(mockFetchResponse({})),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should POST to /api/approve with fullname id", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/api/approve", { id: "t3_abc123" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/approve");
    const body = new URLSearchParams(options.body);
    expect(body.get("id")).toBe("t3_abc123");
    expect(body.get("api_type")).toBe("json");
  });

  it("should accept both t3 (post) and t1 (comment) fullnames", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/api/approve", { id: "t1_xyz789" });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("id")).toBe("t1_xyz789");
  });

  it("should handle empty {} success response without error", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    // Empty {} is a success in Reddit's API
    const result = await client.post("/api/approve", { id: "t3_abc" });
    expect(result.status).toBe(200);
  });
});

describe("remove tool", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(mockFetchResponse({})),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should POST to /api/remove with fullname id", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/api/remove", { id: "t3_abc123" });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("id")).toBe("t3_abc123");
    expect(body.get("api_type")).toBe("json");
  });

  it("should include spam=true when flagging as spam", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/api/remove", { id: "t3_abc123", spam: "true" });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("spam")).toBe("true");
  });

  it("should not include spam param when not flagging as spam", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/api/remove", { id: "t3_abc123" });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.has("spam")).toBe(false);
  });
});

describe("auth guard for approve/remove", () => {
  it("should require user tier for mod operations", async () => {
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");

    expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("app", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("user", "user")).not.toThrow();
  });

  it("should provide clear error message with env var guidance", async () => {
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");

    try {
      requireAuth("app", "user");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthGuardError);
      const msg = (error as Error).message;
      expect(msg).toContain("REDDIT_USERNAME");
      expect(msg).toContain("REDDIT_PASSWORD");
    }
  });
});
