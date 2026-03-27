import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppOnlyGrant } from "../../../reddit/grants/app-only.js";

const CLIENT_ID = "test-client-id";
const CLIENT_SECRET = "test-client-secret";
const USER_AGENT = "nodejs:test-app:1.0.0 (by /u/testuser)";

/** Helper to create a mock fetch Response. */
function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("AppOnlyGrant", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have tier = app", () => {
    const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
    expect(grant.tier).toBe("app");
  });

  describe("successful authentication", () => {
    it("should POST client_credentials grant to Reddit token endpoint", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "app-token-xyz",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
      const result = await grant.authenticate();

      expect(result.access_token).toBe("app-token-xyz");

      // Verify request
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://www.reddit.com/api/v1/access_token");
      expect(options.method).toBe("POST");
    });

    it("should use HTTP Basic Auth with base64-encoded client_id:client_secret", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const expectedAuth = `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`;
      expect(options.headers["Authorization"]).toBe(expectedAuth);
    });

    it("should send grant_type=client_credentials in body", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      const body = new URLSearchParams(options.body);
      expect(body.get("grant_type")).toBe("client_credentials");
    });

    it("should send correct User-Agent header", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
      await grant.authenticate();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers["User-Agent"]).toBe(USER_AGENT);
    });

    it("should parse token response correctly", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "access-token-value",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);
      const result = await grant.authenticate();

      expect(result).toEqual({
        access_token: "access-token-value",
        token_type: "bearer",
        expires_in: 3600,
        scope: "read",
      });
    });
  });

  describe("error handling", () => {
    it("should throw on non-OK HTTP status", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ error: "unauthorized" }, 401));

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);

      await expect(grant.authenticate()).rejects.toThrow("App-only OAuth failed: HTTP 401");
    });

    it("should propagate network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("DNS resolution failed"));

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);

      await expect(grant.authenticate()).rejects.toThrow("DNS resolution failed");
    });
  });

  describe("credential safety", () => {
    it("should not expose credentials in error messages", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, 403));

      const grant = new AppOnlyGrant(CLIENT_ID, CLIENT_SECRET, USER_AGENT);

      try {
        await grant.authenticate();
      } catch (error: unknown) {
        const message = (error as Error).message;
        expect(message).not.toContain(CLIENT_ID);
        expect(message).not.toContain(CLIENT_SECRET);
      }
    });
  });
});
