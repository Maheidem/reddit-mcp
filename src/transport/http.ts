/**
 * Streamable HTTP transport for hosted/remote deployments.
 *
 * Uses the MCP SDK's Express integration with automatic DNS rebinding protection.
 * Start with `--transport http` flag (STDIO remains default).
 *
 * @module
 */

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Express } from "express";

/** Options for the HTTP transport. */
export interface HttpTransportOptions {
  /** Port to listen on. Defaults to 3000. */
  port: number;
  /** Host to bind to. Defaults to "127.0.0.1". */
  host: string;
}

const DEFAULT_OPTIONS: HttpTransportOptions = {
  port: 3000,
  host: "127.0.0.1",
};

/**
 * Start the MCP server with Streamable HTTP transport.
 *
 * Creates an Express app with DNS rebinding protection (automatic for localhost),
 * mounts the MCP endpoint at `/mcp`, and starts listening.
 *
 * @param createServerFn - Factory function that creates a configured McpServer instance.
 * @param options - HTTP transport options (port, host).
 * @returns The Express app instance (for testing).
 */
export async function startHttpTransport(
  createServerFn: () => McpServer,
  options: Partial<HttpTransportOptions> = {},
): Promise<Express> {
  const { port, host } = { ...DEFAULT_OPTIONS, ...options };

  const app = createMcpExpressApp({ host });

  // Stateless mode: create a fresh server + transport per request
  app.post("/mcp", async (req, res) => {
    const server = createServerFn();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless — no session tracking
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(port, host, () => {
    console.error(`reddit-mcp-server: HTTP transport listening on http://${host}:${port}/mcp`);
  });

  return app;
}
