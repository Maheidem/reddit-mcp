import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadConfig } from "./reddit/config.js";
import { RedditAuthManager } from "./reddit/auth.js";
import { RedditClient } from "./reddit/client.js";
import { TokenBucketRateLimiter } from "./reddit/rate-limiter.js";
import { AnonymousGrant } from "./reddit/grants/anonymous.js";
import { AppOnlyGrant } from "./reddit/grants/app-only.js";
import { FullOAuthGrant } from "./reddit/grants/full-oauth.js";
import { registerReadTools } from "./tools/read/index.js";
import { registerModTools } from "./tools/mod/index.js";
import { registerWriteTools } from "./tools/write/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";
import { isTestMode, createMockClient, createMockAuthManager } from "./test-mode.js";

/**
 * Create the appropriate TokenGrant for the detected auth tier.
 */
function createGrant(config: ReturnType<typeof loadConfig>) {
  switch (config.tier) {
    case "user":
      return new FullOAuthGrant(
        config.clientId!,
        config.clientSecret!,
        config.username!,
        config.password!,
        config.userAgent,
      );
    case "app":
      return new AppOnlyGrant(config.clientId!, config.clientSecret!, config.userAgent);
    case "anon":
    default:
      return new AnonymousGrant(config.userAgent);
  }
}

/**
 * Creates and configures the Reddit MCP Server instance.
 * Loads config, creates auth manager and HTTP client,
 * then registers all tools, resources, and prompts.
 */
export function createServer(): McpServer {
  // Test mode: use mock client/auth to avoid real Reddit API calls
  if (isTestMode()) {
    console.error("reddit-mcp-server: TEST MODE — using mock responses");
    return createTestModeServer();
  }

  // Load config and set up auth
  const config = loadConfig();
  const grant = createGrant(config);
  const authManager = new RedditAuthManager(grant);

  // Create HTTP client with rate limiter and auth
  const rateLimiter = new TokenBucketRateLimiter();
  const client = new RedditClient({
    userAgent: config.userAgent,
    rateLimiter,
    authManager,
  });

  console.error(`reddit-mcp-server: auth tier=${config.tier}`);

  const server = new McpServer({
    name: "reddit-mcp-server",
    version: "0.1.0",
  });

  // Ping tool (connectivity check)
  server.tool(
    "reddit_ping",
    "Check if the Reddit MCP server is running. Use this to verify connectivity.",
    { message: z.string().optional().describe("Optional message to echo back") },
    async ({ message }) => ({
      content: [
        {
          type: "text",
          text: message ? `pong: ${message}` : "pong — reddit-mcp-server is running",
        },
      ],
    }),
  );

  // Phase 1 Read Tools (E04)
  registerReadTools(server, client, config);

  // Phase 1 Write Tools (E05)
  registerWriteTools(server, client, authManager);

  // Phase 1 Moderation Tools (E06)
  registerModTools(server, client, authManager);

  // MCP Resources (E07)
  registerResources(server, client, config);

  // MCP Prompts (E07)
  registerPrompts(server);

  return server;
}

/**
 * Create a server with mock client/auth for E2E subprocess testing.
 * Registers the same tools, resources, and prompts as the real server
 * but uses mock responses instead of real Reddit API calls.
 */
function createTestModeServer(): McpServer {
  const client = createMockClient();
  const authManager = createMockAuthManager();

  const config = {
    tier: "user" as const,
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    username: "test-user",
    password: "test-pass",
    userAgent: "nodejs:reddit-mcp-server:0.1.0-test (by /u/test)",
  };

  const server = new McpServer({
    name: "reddit-mcp-server",
    version: "0.1.0",
  });

  // Ping tool (same as production)
  server.tool(
    "reddit_ping",
    "Check if the Reddit MCP server is running. Use this to verify connectivity.",
    { message: z.string().optional().describe("Optional message to echo back") },
    async ({ message }) => ({
      content: [
        {
          type: "text",
          text: message ? `pong: ${message}` : "pong — reddit-mcp-server is running",
        },
      ],
    }),
  );

  registerReadTools(server, client, config);
  registerWriteTools(server, client, authManager);
  registerModTools(server, client, authManager);
  registerResources(server, client, config);
  registerPrompts(server);

  return server;
}
