import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerGetMeTool } from "../../../tools/read/get-me.js";

function createMockClient(response: unknown) {
  return {
    get: vi.fn().mockResolvedValue({
      data: response,
      headers: new Headers(),
      status: 200,
      rateLimitWarning: null,
    }),
    post: vi.fn(),
    setAuthHeader: vi.fn(),
  } as unknown as RedditClient;
}

function makeConfig(tier: "anon" | "app" | "user"): RedditConfig {
  return {
    tier,
    clientId: tier !== "anon" ? "test_id" : null,
    clientSecret: tier !== "anon" ? "test_secret" : null,
    username: tier === "user" ? "testuser" : null,
    password: tier === "user" ? "testpass" : null,
    userAgent: "test:app:1.0.0 (by /u/test)",
  };
}

const mockMeResponse = {
  name: "testuser",
  id: "abc123",
  link_karma: 1000,
  comment_karma: 5000,
  total_karma: 6000,
  created_utc: 1600000000,
  inbox_count: 3,
  has_mail: true,
  has_mod_mail: false,
  is_gold: false,
  is_mod: true,
  has_verified_email: true,
  icon_img: "https://example.com/icon.png",
  snoovatar_img: "https://example.com/snoo.png",
  over_18: false,
  is_employee: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedHandler: (...args: any[]) => Promise<any>;

function captureHandler(client: RedditClient, config: RedditConfig) {
  const mockServer = {
    tool: vi.fn(
      (_name: string, _desc: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
        capturedHandler = handler as typeof capturedHandler;
      },
    ),
  } as unknown as McpServer;
  registerGetMeTool(mockServer, client, config);
}

describe("get_me tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns profile at user tier", async () => {
    const client = createMockClient(mockMeResponse);
    captureHandler(client, makeConfig("user"));

    const result = await capturedHandler({});
    const data = JSON.parse(result.content[0].text);

    expect(data.username).toBe("testuser");
    expect(data.total_karma).toBe(6000);
    expect(data.inbox_count).toBe(3);
    expect(data.has_mail).toBe(true);
    expect(data.is_mod).toBe(true);
    expect(result.isError).toBeUndefined();
  });

  it("rejects at anon tier with auth error", async () => {
    const client = createMockClient(mockMeResponse);
    captureHandler(client, makeConfig("anon"));

    const result = await capturedHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
    // Should not have called the API
    expect(client.get).not.toHaveBeenCalled();
  });

  it("rejects at app tier with auth error", async () => {
    const client = createMockClient(mockMeResponse);
    captureHandler(client, makeConfig("app"));

    const result = await capturedHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("user-level authentication");
    expect(client.get).not.toHaveBeenCalled();
  });

  it("returns isError on API failure", async () => {
    const client = createMockClient(null);
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("API error"));
    captureHandler(client, makeConfig("user"));

    const result = await capturedHandler({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get profile");
  });

  it("registers with correct name", async () => {
    const client = createMockClient(mockMeResponse);
    const mockServer = {
      tool: vi.fn(),
    } as unknown as McpServer;
    registerGetMeTool(mockServer, client, makeConfig("user"));
    expect((mockServer as unknown as { tool: ReturnType<typeof vi.fn> }).tool).toHaveBeenCalledWith(
      "get_me",
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });
});
