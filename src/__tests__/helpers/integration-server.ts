/**
 * Integration test helper that wires a real McpServer + InMemoryTransport
 * with mocked RedditClient and RedditAuthManager.
 *
 * Usage:
 *   const { client, cleanup, mockRedditClient, mockAuthManager } = await createIntegrationServer();
 *   mockRedditClient.get.mockResolvedValueOnce({ data: ..., headers: new Headers(), status: 200, rateLimitWarning: null });
 *   const result = await client.callTool({ name: "search", arguments: { q: "test" } });
 *   await cleanup();
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { RedditClient, RedditResponse } from "../../reddit/client.js";
import type { RedditAuthManager } from "../../reddit/auth.js";
import type { RedditConfig } from "../../reddit/config.js";
import type { AuthTier } from "../../reddit/config.js";
import { registerReadTools } from "../../tools/read/index.js";
import { registerWriteTools } from "../../tools/write/index.js";
import { registerModTools } from "../../tools/mod/index.js";
import { vi } from "vitest";

export interface MockRedditClient {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  setAuthHeader: ReturnType<typeof vi.fn>;
}

export interface MockAuthManager {
  tier: AuthTier;
  getAccessToken: ReturnType<typeof vi.fn>;
  hasValidToken: boolean;
}

export interface IntegrationServerOptions {
  tier?: AuthTier;
}

export interface IntegrationServer {
  client: Client;
  cleanup: () => Promise<void>;
  mockRedditClient: MockRedditClient;
  mockAuthManager: MockAuthManager;
}

/**
 * Create a full MCP server with all 25 tools registered, connected via
 * InMemoryTransport to a Client. The RedditClient and AuthManager are
 * vi.fn() mocks that tests can configure per-call.
 */
export async function createIntegrationServer(
  options: IntegrationServerOptions = {},
): Promise<IntegrationServer> {
  const tier = options.tier ?? "user";

  const mockRedditClient: MockRedditClient = {
    get: vi.fn(),
    post: vi.fn(),
    setAuthHeader: vi.fn(),
  };

  const mockAuthManager: MockAuthManager = {
    tier,
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    hasValidToken: true,
  };

  const mockConfig: RedditConfig = {
    tier,
    clientId: "test-id",
    clientSecret: "test-secret",
    username: "testuser",
    password: "testpass",
    userAgent: "test:reddit-mcp:1.0.0 (by /u/testuser)",
  };

  const server = new McpServer({
    name: "reddit-mcp-integration-test",
    version: "1.0.0",
  });

  // Register all 25 tools
  registerReadTools(server, mockRedditClient as unknown as RedditClient, mockConfig);
  registerWriteTools(server, mockRedditClient as unknown as RedditClient, mockAuthManager as unknown as RedditAuthManager);
  registerModTools(server, mockRedditClient as unknown as RedditClient, mockAuthManager as unknown as RedditAuthManager);

  // Wire transports
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: "integration-test-client", version: "1.0.0" });
  await client.connect(clientTransport);

  const cleanup = async () => {
    await client.close();
    await server.close();
  };

  return { client, cleanup, mockRedditClient, mockAuthManager };
}

/** Helper to build a standard RedditResponse shape for mock .get/.post calls. */
export function mockResponse<T>(data: T, status = 200): RedditResponse<T> {
  return {
    data,
    headers: new Headers(),
    status,
    rateLimitWarning: null,
  };
}
