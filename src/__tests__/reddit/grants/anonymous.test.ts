import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnonymousGrant } from "../../../reddit/grants/anonymous.js";

const userAgent = "nodejs:test-app:1.0.0 (by /u/testuser)";

/** Helper to create a mock fetch Response. */
function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("AnonymousGrant", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have tier = anon", () => {
    const grant = new AnonymousGrant(userAgent);
    expect(grant.tier).toBe("anon");
  });

  describe("successful installed client grant", () => {
    it("should POST to Reddit token endpoint with installed_client grant", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "anon-token-123",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AnonymousGrant(userAgent);
      const result = await grant.authenticate();

      expect(result.access_token).toBe("anon-token-123");
      expect(result.scope).toBe("read");

      // Verify the request was made correctly
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://www.reddit.com/api/v1/access_token");
      expect(options.method).toBe("POST");
      expect(options.headers["User-Agent"]).toBe(userAgent);
      expect(options.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");

      // Verify body has correct grant type and device_id
      const body = new URLSearchParams(options.body);
      expect(body.get("grant_type")).toBe(
        "https://oauth.reddit.com/grants/installed_client",
      );
      expect(body.get("device_id")).toBe("DO_NOT_TRACK_THIS_DEVICE");
    });

    it("should set useFallback to false on success", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          access_token: "anon-token",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        }),
      );

      const grant = new AnonymousGrant(userAgent);
      await grant.authenticate();

      expect(grant.useFallback).toBe(false);
    });
  });

  describe("fallback to .json suffix", () => {
    it("should fall back when OAuth returns non-OK status", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ error: "unauthorized" }, 401));

      const grant = new AnonymousGrant(userAgent);
      const result = await grant.authenticate();

      expect(grant.useFallback).toBe(true);
      expect(result.access_token).toBe("");
      expect(result.scope).toBe("read");
    });

    it("should fall back when fetch throws network error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const grant = new AnonymousGrant(userAgent);
      const result = await grant.authenticate();

      expect(grant.useFallback).toBe(true);
      expect(result.access_token).toBe("");
    });

    it("should return valid TokenResponse shape on fallback", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Timeout"));

      const grant = new AnonymousGrant(userAgent);
      const result = await grant.authenticate();

      expect(result).toEqual({
        access_token: "",
        token_type: "bearer",
        expires_in: 3600,
        scope: "read",
      });
    });
  });

  describe("read-only tier identification", () => {
    it("should always identify as anon tier", () => {
      const grant = new AnonymousGrant(userAgent);
      expect(grant.tier).toBe("anon");
    });
  });
});
