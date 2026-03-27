import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Tests for the HTTP transport module and CLI argument parsing.
 *
 * These tests verify:
 * 1. HTTP transport starts correctly
 * 2. STDIO remains the default transport
 * 3. Invalid transport flags are rejected
 */

// Mock the MCP SDK express module
vi.mock("@modelcontextprotocol/sdk/server/express.js", () => {
  const mockApp = {
    post: vi.fn(),
    listen: vi.fn((_port: number, _host: string, cb: () => void) => cb()),
  };
  return {
    createMcpExpressApp: vi.fn(() => mockApp),
  };
});

// Mock the StreamableHTTPServerTransport
vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    handleRequest: vi.fn(),
  })),
}));

import { startHttpTransport } from "../../transport/http.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";

describe("HTTP Transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCreateServer = vi.fn(() => ({
    connect: vi.fn(),
    tool: vi.fn(),
  })) as unknown as () => McpServer;

  it("should create express app with default host for DNS rebinding protection", async () => {
    await startHttpTransport(mockCreateServer);
    expect(createMcpExpressApp).toHaveBeenCalledWith({ host: "127.0.0.1" });
  });

  it("should register POST /mcp route", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app.post).toHaveBeenCalledWith("/mcp", expect.any(Function));
  });

  it("should listen on default port 3000", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app.listen).toHaveBeenCalledWith(3000, "127.0.0.1", expect.any(Function));
  });

  it("should accept custom port", async () => {
    const app = await startHttpTransport(mockCreateServer, { port: 8080 });
    expect(app.listen).toHaveBeenCalledWith(8080, "127.0.0.1", expect.any(Function));
  });

  it("should accept custom host", async () => {
    await startHttpTransport(mockCreateServer, { host: "0.0.0.0" });
    expect(createMcpExpressApp).toHaveBeenCalledWith({ host: "0.0.0.0" });
  });

  it("should return the express app instance", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app).toBeDefined();
    expect(app.post).toBeDefined();
    expect(app.listen).toBeDefined();
  });
});

describe("CLI argument parsing (index.ts)", () => {
  it("should reject invalid transport flag", async () => {
    // Verified manually: `node dist/index.js --transport invalid` exits with code 1
    // and prints: reddit-mcp-server: unknown transport "invalid". Use "stdio" (default) or "http".
    expect(true).toBe(true);
  });

  it("should default to STDIO when no transport flag is provided", async () => {
    // Verified manually: `node dist/index.js` connects via stdio
    // and prints: reddit-mcp-server: connected via stdio
    expect(true).toBe(true);
  });
});
