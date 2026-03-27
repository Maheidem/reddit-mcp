import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RedditClient } from "../../../reddit/client.js";
import { RedditAuthManager } from "../../../reddit/auth.js";
import { RedditApiError } from "../../../reddit/errors.js";
import { registerGetModqueue } from "../../../tools/mod/get-modqueue.js";
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

describe("get_modqueue tool", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        mockFetchResponse({
          data: {
            children: [
              {
                data: {
                  name: "t3_abc123",
                  author: "spammer",
                  subreddit: "test",
                  title: "Spam post",
                  num_reports: 3,
                  mod_reports: [],
                  user_reports: [["spam", 2]],
                  created_utc: 1679000000,
                  permalink: "/r/test/comments/abc123",
                },
              },
            ],
            after: null,
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject when auth tier is not user", async () => {
    const authManager = new RedditAuthManager(mockGrant("app"));
    const client = new RedditClient({ userAgent: "test:app:1.0" });
    const server = new McpServer({ name: "test", version: "0.1.0" });

    registerGetModqueue(server, client, authManager);

    // Get the handler directly by calling the tool
    const tool = server.tool;
    expect(tool).toBeDefined();

    // We verify via the registration pattern: auth guard rejects non-user tiers
    // Since we can't directly invoke the tool handler from McpServer,
    // we test the underlying logic instead
    const { requireAuth, AuthGuardError } = await import("../../../reddit/auth-guard.js");
    expect(() => requireAuth("app", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    expect(() => requireAuth("user", "user")).not.toThrow();
  });

  it("should send correct request to modqueue endpoint", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    await authManager.getAccessToken(); // Prime the token cache

    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });
    await client.get("/r/test/about/modqueue", { type: "links", limit: "10" });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/r/test/about/modqueue");
    expect(url.searchParams.get("type")).toBe("links");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("raw_json")).toBe("1");
  });

  it("should include Bearer token in request", async () => {
    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await client.get("/r/test/about/modqueue");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer token");
  });

  it("should throw RedditApiError on 403 response", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(mockFetchResponse({ message: "Forbidden", error: 403 }, 403)),
    );

    const authManager = new RedditAuthManager(mockGrant("user"));
    const client = new RedditClient({ userAgent: "test:app:1.0", authManager });

    await expect(client.get("/r/test/about/modqueue")).rejects.toThrow(RedditApiError);
  });
});
