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
        scope: "modcontributors",
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

describe("ban_user tool", () => {
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

  it("should POST to /r/{sub}/api/friend with type=banned", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/testsubreddit/api/friend", {
      name: "spammer",
      type: "banned",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/r/testsubreddit/api/friend");
    const body = new URLSearchParams(options.body);
    expect(body.get("name")).toBe("spammer");
    expect(body.get("type")).toBe("banned");
  });

  it("should include duration for temporary bans", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/test/api/friend", {
      name: "user",
      type: "banned",
      duration: "7",
    });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("duration")).toBe("7");
  });

  it("should not include duration for permanent bans (duration=0 or omitted)", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/test/api/friend", {
      name: "user",
      type: "banned",
    });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.has("duration")).toBe(false);
  });

  it("should include ban_message for user notification", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/test/api/friend", {
      name: "user",
      type: "banned",
      ban_message: "You violated rule #3",
    });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("ban_message")).toBe("You violated rule #3");
  });

  it("should include note for mod-only reason", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/test/api/friend", {
      name: "user",
      type: "banned",
      note: "Repeated spam violations",
    });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("note")).toBe("Repeated spam violations");
  });

  it("should include api_type=json in POST body", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.post("/r/test/api/friend", { name: "user", type: "banned" });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("api_type")).toBe("json");
  });
});

describe("auth guard for ban_user", () => {
  it("should require user tier (modcontributors scope)", async () => {
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");

    expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("app", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("user", "user")).not.toThrow();
  });
});
