import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditClient } from "../../reddit/client.js";

/** Helper to create a mock Response. */
function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: new Headers(headers),
  });
}

describe("RedditClient", () => {
  const userAgent = "nodejs:test-app:1.0.0 (by /u/testuser)";
  let client: RedditClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new RedditClient({ userAgent });
    fetchMock = vi.fn().mockResolvedValue(mockResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("should append raw_json=1 to query parameters", async () => {
      await client.get("/r/programming/hot");

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.searchParams.get("raw_json")).toBe("1");
    });

    it("should preserve additional query parameters", async () => {
      await client.get("/r/programming/hot", { limit: "25", after: "t3_abc" });

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.searchParams.get("raw_json")).toBe("1");
      expect(url.searchParams.get("limit")).toBe("25");
      expect(url.searchParams.get("after")).toBe("t3_abc");
    });

    it("should send correct User-Agent header", async () => {
      await client.get("/api/v1/me");

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers["User-Agent"]).toBe(userAgent);
    });

    it("should return parsed JSON data with headers and status", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ data: "test" }, 200, { "X-Custom": "value" }),
      );

      const result = await client.get("/test");

      expect(result.data).toEqual({ data: "test" });
      expect(result.status).toBe(200);
      expect(result.headers.get("X-Custom")).toBe("value");
    });
  });

  describe("POST requests", () => {
    it("should include api_type=json in the body", async () => {
      await client.post("/api/submit", { title: "Test" });

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const body = new URLSearchParams(options.body as string);
      expect(body.get("api_type")).toBe("json");
    });

    it("should include additional body parameters", async () => {
      await client.post("/api/submit", { title: "Test", sr: "programming" });

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const body = new URLSearchParams(options.body as string);
      expect(body.get("api_type")).toBe("json");
      expect(body.get("title")).toBe("Test");
      expect(body.get("sr")).toBe("programming");
    });

    it("should send Content-Type header for form data", async () => {
      await client.post("/api/submit");

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    });
  });

  describe("base URL", () => {
    it("should default to https://oauth.reddit.com", async () => {
      await client.get("/api/v1/me");

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin).toBe("https://oauth.reddit.com");
    });

    it("should allow base URL override", async () => {
      const anonClient = new RedditClient({
        userAgent,
        baseUrl: "https://www.reddit.com",
      });

      await anonClient.get("/r/programming.json");

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.origin).toBe("https://www.reddit.com");
    });
  });

  describe("authentication", () => {
    it("should not send Authorization header when not set", async () => {
      await client.get("/test");

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("should send Authorization header when set", async () => {
      client.setAuthHeader("Bearer test-token");
      await client.get("/test");

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-token");
    });

    it("should clear Authorization header when set to null", async () => {
      client.setAuthHeader("Bearer test-token");
      client.setAuthHeader(null);
      await client.get("/test");

      const options = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  describe("error propagation", () => {
    it("should propagate fetch errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.get("/test")).rejects.toThrow("Network error");
    });
  });
});
