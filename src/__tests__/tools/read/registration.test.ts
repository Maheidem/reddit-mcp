import { describe, it, expect, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedditClient } from "../../../reddit/client.js";
import type { RedditConfig } from "../../../reddit/config.js";
import { registerReadTools } from "../../../tools/read/index.js";

const mockConfig: RedditConfig = {
  tier: "anon",
  clientId: null,
  clientSecret: null,
  username: null,
  password: null,
  userAgent: "test:app:1.0.0 (by /u/test)",
};

function createMockClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    setAuthHeader: vi.fn(),
  } as unknown as RedditClient;
}

describe("registerReadTools", () => {
  it("registers all 12 read tools with correct names", () => {
    const registeredTools: string[] = [];
    const mockServer = {
      tool: vi.fn((name: string) => {
        registeredTools.push(name);
      }),
    } as unknown as McpServer;

    const client = createMockClient();
    registerReadTools(mockServer, client, mockConfig);

    const expectedTools = [
      "search",
      "get_post",
      "get_comments",
      "get_subreddit",
      "get_subreddit_rules",
      "get_subreddit_posts",
      "get_user",
      "get_user_posts",
      "get_user_comments",
      "get_trending",
      "get_wiki_page",
      "get_me",
    ];

    expect(registeredTools).toEqual(expectedTools);
    expect(registeredTools).toHaveLength(12);
  });

  it("has no duplicate tool names", () => {
    const registeredTools: string[] = [];
    const mockServer = {
      tool: vi.fn((name: string) => {
        registeredTools.push(name);
      }),
    } as unknown as McpServer;

    const client = createMockClient();
    registerReadTools(mockServer, client, mockConfig);

    const unique = new Set(registeredTools);
    expect(unique.size).toBe(registeredTools.length);
  });

  it("tool descriptions are under 200 characters", () => {
    const descriptions: string[] = [];
    const mockServer = {
      tool: vi.fn((_name: string, desc: string) => {
        descriptions.push(desc);
      }),
    } as unknown as McpServer;

    const client = createMockClient();
    registerReadTools(mockServer, client, mockConfig);

    for (const desc of descriptions) {
      expect(desc.length).toBeLessThan(200);
    }
  });
});
