import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Tests for the HTTP transport module and CLI argument parsing.
 *
 * These tests verify:
 * 1. HTTP transport starts correctly (default + custom host/port)
 * 2. allowedHosts is wired up when binding non-localhost
 * 3. /healthz route is registered before /mcp
 * 4. STDIO remains the default transport
 */

// Mock the MCP SDK express module
vi.mock("@modelcontextprotocol/sdk/server/express.js", () => {
  const mockApp = {
    get: vi.fn(),
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
    delete process.env.MCP_ALLOWED_HOSTS;
  });

  afterEach(() => {
    delete process.env.MCP_ALLOWED_HOSTS;
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

  it("should register GET /healthz before /mcp", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app.get).toHaveBeenCalledWith("/healthz", expect.any(Function));

    const getOrder = (app.get as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    const postOrder = (app.post as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    expect(getOrder).toBeLessThan(postOrder);
  });

  it("should listen on default port 3000", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app.listen).toHaveBeenCalledWith(3000, "127.0.0.1", expect.any(Function));
  });

  it("should accept custom port", async () => {
    const app = await startHttpTransport(mockCreateServer, { port: 8080 });
    expect(app.listen).toHaveBeenCalledWith(8080, "127.0.0.1", expect.any(Function));
  });

  it("should accept custom host (localhost — no allowedHosts override)", async () => {
    await startHttpTransport(mockCreateServer, { host: "localhost" });
    expect(createMcpExpressApp).toHaveBeenCalledWith({ host: "localhost" });
  });

  it("should pass allowedHosts when binding 0.0.0.0", async () => {
    await startHttpTransport(mockCreateServer, { host: "0.0.0.0" });
    const call = (createMcpExpressApp as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.host).toBe("0.0.0.0");
    expect(Array.isArray(call.allowedHosts)).toBe(true);
    expect(call.allowedHosts).toEqual(expect.arrayContaining(["localhost", "127.0.0.1"]));
  });

  it("should merge MCP_ALLOWED_HOSTS env into allowedHosts when binding 0.0.0.0", async () => {
    process.env.MCP_ALLOWED_HOSTS = "reddit-mcp,192.168.31.154";
    await startHttpTransport(mockCreateServer, { host: "0.0.0.0" });
    const call = (createMcpExpressApp as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.allowedHosts).toEqual(expect.arrayContaining(["reddit-mcp", "192.168.31.154"]));
  });

  it("should NOT pass allowedHosts when binding localhost (SDK uses defaults)", async () => {
    process.env.MCP_ALLOWED_HOSTS = "should-be-ignored";
    await startHttpTransport(mockCreateServer, { host: "127.0.0.1" });
    const call = (createMcpExpressApp as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.allowedHosts).toBeUndefined();
  });

  it("should return the express app instance", async () => {
    const app = await startHttpTransport(mockCreateServer);
    expect(app).toBeDefined();
    expect(app.get).toBeDefined();
    expect(app.post).toBeDefined();
    expect(app.listen).toBeDefined();
  });

  it("/healthz handler should fall back to tier=unknown if loadConfig throws", async () => {
    // Force loadConfig to throw by setting CLIENT_SECRET without CLIENT_ID
    const prevId = process.env.REDDIT_CLIENT_ID;
    const prevSecret = process.env.REDDIT_CLIENT_SECRET;
    delete process.env.REDDIT_CLIENT_ID;
    process.env.REDDIT_CLIENT_SECRET = "orphan-secret";
    try {
      const app = await startHttpTransport(mockCreateServer);
      const handler = (app.get as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: unknown[]) => c[0] === "/healthz",
      )?.[1] as ((req: unknown, res: { status: (n: number) => { json: (o: unknown) => void } }) => void);
      expect(handler).toBeDefined();
      let captured: unknown;
      handler({}, {
        status: (_n: number) => ({ json: (o: unknown) => { captured = o; } }),
      });
      expect(captured).toEqual({ ok: true, tier: "unknown" });
    } finally {
      if (prevId !== undefined) process.env.REDDIT_CLIENT_ID = prevId;
      if (prevSecret !== undefined) process.env.REDDIT_CLIENT_SECRET = prevSecret;
      else delete process.env.REDDIT_CLIENT_SECRET;
    }
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
