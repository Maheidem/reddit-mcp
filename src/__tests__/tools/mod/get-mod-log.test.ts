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
        scope: "modlog",
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

describe("get_mod_log tool", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        mockFetchResponse({
          data: {
            children: [
              {
                data: {
                  id: "log1",
                  created_utc: 1679000000,
                  mod: "moduser",
                  action: "banuser",
                  target_fullname: "t2_abc",
                  target_author: "baduser",
                  target_title: null,
                  target_body: null,
                  details: "7 days",
                  description: "spam",
                  subreddit: "test",
                },
              },
            ],
            after: "log_cursor",
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should GET /r/{sub}/about/log with correct params", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.get("/r/testmod/about/log", {
      type: "banuser",
      mod: "moduser",
      limit: "50",
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/r/testmod/about/log");
    expect(url.searchParams.get("type")).toBe("banuser");
    expect(url.searchParams.get("mod")).toBe("moduser");
    expect(url.searchParams.get("limit")).toBe("50");
    expect(url.searchParams.get("raw_json")).toBe("1");
  });

  it("should include after parameter for pagination", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.get("/r/test/about/log", { after: "cursor123" });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("after")).toBe("cursor123");
  });

  it("should return listing data with mod log entries", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    const response = await client.get<{
      data: { children: Array<{ data: { action: string; mod: string } }>; after: string | null };
    }>("/r/test/about/log");

    expect(response.data.data.children).toHaveLength(1);
    expect(response.data.data.children[0].data.action).toBe("banuser");
    expect(response.data.data.children[0].data.mod).toBe("moduser");
    expect(response.data.data.after).toBe("log_cursor");
  });
});

describe("auth guard for get_mod_log", () => {
  it("should require user tier (modlog scope)", async () => {
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");

    expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("user", "user")).not.toThrow();
  });
});
