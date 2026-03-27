#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startHttpTransport } from "./transport/index.js";

/** Parse a CLI flag value: `--flag value` or `--flag=value`. */
function getFlag(args: string[], flag: string): string | undefined {
  const eqIdx = args.findIndex((a) => a.startsWith(`${flag}=`));
  if (eqIdx !== -1) return args[eqIdx].split("=")[1];
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

/**
 * Reddit MCP Server — entry point.
 *
 * Supports two transports:
 *   - STDIO (default): `npx @marcos-heidemann/reddit-mcp`
 *   - HTTP:            `npx @marcos-heidemann/reddit-mcp --transport http [--port 3000]`
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const transport = getFlag(args, "--transport");

  if (transport && transport !== "stdio" && transport !== "http") {
    console.error(`reddit-mcp-server: unknown transport "${transport}". Use "stdio" (default) or "http".`);
    process.exit(1);
  }

  if (transport === "http") {
    const portStr = getFlag(args, "--port");
    const port = portStr ? parseInt(portStr, 10) : undefined;
    if (portStr && (isNaN(port!) || port! < 1 || port! > 65535)) {
      console.error(`reddit-mcp-server: invalid port "${portStr}". Must be 1-65535.`);
      process.exit(1);
    }
    await startHttpTransport(createServer, { port });
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
