#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startHttpTransport } from "./transport/index.js";
import { getFlag, resolveHttpOptions } from "./cli.js";

/**
 * Reddit MCP Server — entry point.
 *
 * Supports two transports:
 *   - STDIO (default): `npx @marcos-heidemann/reddit-mcp`
 *   - HTTP:            `npx @marcos-heidemann/reddit-mcp --transport http [--host 0.0.0.0] [--port 3000]`
 *
 * HTTP bind precedence (host and port): CLI flag > env var > default.
 *   --host / MCP_HTTP_HOST  (default: 127.0.0.1)
 *   --port / MCP_HTTP_PORT  (default: 3000)
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const transport = getFlag(args, "--transport");

  if (transport && transport !== "stdio" && transport !== "http") {
    console.error(`reddit-mcp-server: unknown transport "${transport}". Use "stdio" (default) or "http".`);
    process.exit(1);
  }

  if (transport === "http") {
    const { host, port, error } = resolveHttpOptions(args);
    if (error) {
      console.error(error);
      process.exit(1);
    }
    await startHttpTransport(createServer, { port, host });
  } else {
    // Default: STDIO transport
    const server = createServer();
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("reddit-mcp-server: connected via stdio");
  }
}

main().catch((error: unknown) => {
  console.error("reddit-mcp-server: fatal error", error);
  process.exit(1);
});
