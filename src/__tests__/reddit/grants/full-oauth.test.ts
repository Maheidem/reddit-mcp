import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FullOAuthGrant, PHASE1_SCOPES } from "../../../reddit/grants/full-oauth.js";

const CLIENT_ID = "test-client-id";
const CLIENT_SECRET = "test-client-secret";
const USERNAME = "testuser";
const PASSWORD = "testpassword";
const USER_AGENT = "nodejs:test-app:1.0.0 (by /u/testuser)";

/** Helper to create a mock fetch Response. */
function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("FullOAuthGrant", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have tier = user", () => {
    const grant = new FullOAuthGrant(
      CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
    );
    expect(grant.tier).toBe("user");
  });

  describe("PHASE1_SCOPES", () => {
    it("should contain exactly 12 Phase 1 scopes", () => {
      expect(PHASE1_SCOPES).toHaveLength(12);
    });

    it("should include all required Phase 1 scopes", () => {
      const expected = [
        "read", "identity", "submit", "edit", "vote",
        "privatemessages", "history", "wikiread",
        "modposts", "modcontributors", "modlog", "modnote",
      ];
      for (const scope of expected) {
        expect(PHASE1_SCOPES).toContain(scope);
      }
    });
  });

  describe("successful authentication", () => {
    it("should POST password grant to Reddit token endpoint", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "user-token-full",
          token_type: "bearer",
          expires_in: 3600,
          scope: PHASE1_SCOPES.join(" "),
        }),
      );

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );
      const result = await grant.authenticate();

      expect(result.access_token).toBe("user-token-full");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://www.reddit.com/api/v1/access_token");
      expect(options.method).toBe("POST");
    });

    it("should use HTTP Basic Auth with client_id:client_secret", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const expectedAuth = `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`;
      expect(options.headers["Authorization"]).toBe(expectedAuth);
    });

    it("should send username and password in POST body (not URL)", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );
      await grant.authenticate();

      const [url, options] = fetchMock.mock.calls[0];

      // Verify credentials are in the body, not URL
      const body = new URLSearchParams(options.body);
      expect(body.get("username")).toBe(USERNAME);
      expect(body.get("password")).toBe(PASSWORD);

      // Verify credentials are NOT in the URL
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.has("username")).toBe(false);
      expect(parsedUrl.searchParams.has("password")).toBe(false);
    });

    it("should send grant_type=password in body", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(options.body);
      expect(body.get("grant_type")).toBe("password");
    });

    it("should send all 12 Phase 1 scopes as space-separated string", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(options.body);
      const scopeString = body.get("scope")!;

      // Should be space-separated
      const scopes = scopeString.split(" ");
      expect(scopes).toHaveLength(12);
      for (const scope of PHASE1_SCOPES) {
        expect(scopes).toContain(scope);
      }
    });
  });

  describe("configurable scopes", () => {
    it("should accept custom scopes for Phase 2/3 expansion", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read identity flair",
        }),
      );

      const customScopes = ["read", "identity", "flair"] as const;
      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT, customScopes,
      );
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(options.body);
      expect(body.get("scope")).toBe("read identity flair");
    });
  });

  describe("error handling", () => {
    it("should throw on non-OK HTTP status", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ error: "invalid_grant" }, 401));

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );

      await expect(grant.authenticate()).rejects.toThrow("Full OAuth failed: HTTP 401");
    });
  });

  describe("credential safety", () => {
    it("should not expose any credentials in error messages", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, 403));

      const grant = new FullOAuthGrant(
        CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD, USER_AGENT,
      );

      try {
        await grant.authenticate();
      } catch (error: unknown) {
        const message = (error as Error).message;
        expect(message).not.toContain(CLIENT_ID);
        expect(message).not.toContain(CLIENT_SECRET);
        expect(message).not.toContain(USERNAME);
        expect(message).not.toContain(PASSWORD);
      }
    });
  });
});
