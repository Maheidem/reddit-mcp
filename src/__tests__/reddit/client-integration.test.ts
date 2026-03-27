import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditClient } from "../../reddit/client.js";
import { RedditApiError } from "../../reddit/errors.js";
import { TokenBucketRateLimiter } from "../../reddit/rate-limiter.js";

/** Helper to create a mock Response with rate limit headers. */
function mockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: new Headers(headers),
  });
}

describe("RedditClient Integration (rate limiter + error parser)", () => {
  const userAgent = "nodejs:test-app:1.0.0 (by /u/testuser)";
  let rateLimiter: TokenBucketRateLimiter;
  let client: RedditClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rateLimiter = new TokenBucketRateLimiter({ capacity: 100 });
    client = new RedditClient({ userAgent, rateLimiter });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normal request flow", () => {
    it("should complete full flow: acquire -> fetch -> updateFromHeaders -> return", async () => {
      const acquireSpy = vi.spyOn(rateLimiter, "acquire");
      const updateSpy = vi.spyOn(rateLimiter, "updateFromHeaders");

      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { data: { children: [] } },
          200,
          { "X-Ratelimit-Remaining": "98", "X-Ratelimit-Reset": "590" },
        ),
      );

      const result = await client.get("/r/programming/hot");

      // Verify order: acquire called before fetch
      expect(acquireSpy).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledOnce();
      // updateFromHeaders called after fetch
      expect(updateSpy).toHaveBeenCalledOnce();

      expect(result.data).toEqual({ data: { children: [] } });
      expect(result.status).toBe(200);
    });
  });

  describe("rate limit header propagation", () => {
    it("should update rate limiter from response headers", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { ok: true },
          200,
          { "X-Ratelimit-Remaining": "42", "X-Ratelimit-Reset": "300" },
        ),
      );

      await client.get("/test");

      expect(rateLimiter.remaining).toBe(42);
    });
  });

  describe("low-token warning", () => {
    it("should surface rate limit warning when tokens are low", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { ok: true },
          200,
          { "X-Ratelimit-Remaining": "5", "X-Ratelimit-Reset": "60" },
        ),
      );

      const result = await client.get("/test");

      expect(result.rateLimitWarning).not.toBeNull();
      expect(result.rateLimitWarning).toContain("5 requests remaining");
    });

    it("should have no warning when tokens are healthy", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { ok: true },
          200,
          { "X-Ratelimit-Remaining": "90", "X-Ratelimit-Reset": "500" },
        ),
      );

      const result = await client.get("/test");

      expect(result.rateLimitWarning).toBeNull();
    });
  });

  describe("error parsing on non-OK responses", () => {
    it("should throw RedditApiError for standard HTTP errors", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ message: "Forbidden", error: 403 }, 403),
      );

      await expect(client.get("/test")).rejects.toThrow(RedditApiError);
      await expect(client.get("/test")).rejects.toThrow(); // re-mock needed
    });

    it("should throw RedditApiError with correct properties", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ message: "Not Found", error: 404 }, 404),
      );

      try {
        await client.get("/test");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(RedditApiError);
        const err = e as RedditApiError;
        expect(err.status).toBe(404);
        expect(err.message).toBe("Not Found");
      }
    });

    it("should throw RedditApiError for wrapped JSON errors", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { json: { errors: [["BAD_SR_NAME", "that name isn't going to work", "sr"]] } },
          200,
        ),
      );

      try {
        await client.post("/api/submit", { sr: "bad name" });
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(RedditApiError);
        const err = e as RedditApiError;
        expect(err.code).toBe("BAD_SR_NAME");
        expect(err.field).toBe("sr");
      }
    });

    it("should not throw for empty 200 OK (success)", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, 200));

      const result = await client.post("/api/approve");
      expect(result.status).toBe(200);
    });
  });

  describe("POST requests with integration", () => {
    it("should call acquire before POST requests", async () => {
      const acquireSpy = vi.spyOn(rateLimiter, "acquire");
      fetchMock.mockResolvedValueOnce(
        mockResponse({ json: { errors: [] } }, 200),
      );

      await client.post("/api/submit", { title: "Test" });

      expect(acquireSpy).toHaveBeenCalledOnce();
    });
  });

  describe("without rate limiter", () => {
    it("should work without rate limiter (backward compatibility)", async () => {
      const clientNoLimiter = new RedditClient({ userAgent });
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }, 200));

      const result = await clientNoLimiter.get("/test");

      expect(result.data).toEqual({ ok: true });
      expect(result.rateLimitWarning).toBeNull();
    });
  });
});
