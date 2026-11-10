/**
 * Streamable HTTP transport for hosted/remote deployments.
 *
 * Uses the MCP SDK's Express integration with automatic DNS rebinding protection.
 * Start with `--transport http` flag (STDIO remains default).
 *
 * Container deployments must bind to `0.0.0.0` so the port mapping is reachable
 * from the host. When binding non-localhost, an explicit `allowedHosts` list is
 * passed to keep DNS rebinding protection active.
 *
 * @module
 */

import os from "node:os";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Express } from "express";
import { loadConfig } from "../reddit/config.js";

/** Options for the HTTP transport. */
export interface HttpTransportOptions {
  /** Port to listen on. Defaults to 3000. */
  port: number;
  /** Host to bind to. Defaults to "127.0.0.1". */
  host: string;
  /**
   * Extra allowed Host headers when binding non-localhost. Always merged with
   * `["localhost", "127.0.0.1", os.hostname()]`. Operators set this via
   * `MCP_ALLOWED_HOSTS` (comma-separated) for compose service names or tunnel
   * hostnames.
   */
  allowedHosts?: string[];
}

const DEFAULT_OPTIONS: HttpTransportOptions = {
  port: 3000,
  host: "127.0.0.1",
};

/** Hosts that trigger the SDK's automatic DNS rebinding protection. */
const LOCALHOST_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/**
 * Whether the given bind host is a localhost variant. Localhost binds get
 * automatic DNS rebinding protection from the SDK; non-localhost binds need
 * explicit `allowedHosts` to keep protection on.
 */
function isLocalhostBind(host: string): boolean {
  return LOCALHOST_HOSTS.has(host);
}

/**
 * Build the `allowedHosts` list passed to `createMcpExpressApp`.
 *
 * For localhost binds, returns `undefined` so the SDK uses its built-in defaults.
 * For non-localhost binds, returns a deduplicated list combining safe defaults,
 * `MCP_ALLOWED_HOSTS` from the environment, and any caller-provided extras.
 */
function buildAllowedHosts(host: string, extras: string[] | undefined): string[] | undefined {
  if (isLocalhostBind(host)) return undefined;

  const envList = (process.env.MCP_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const merged = new Set<string>([
    "localhost",
    "127.0.0.1",
    os.hostname(),
    ...envList,
    ...(extras ?? []),
  ]);

  return Array.from(merged);
}

/**
 * Start the MCP server with Streamable HTTP transport.
 *
 * Mounts:
 *   - `GET  /healthz` — JSON liveness probe (always-on, no MCP framing).
 *   - `POST /mcp`     — Streamable HTTP MCP endpoint (stateless: fresh server per request).
 *
 * Binding to `0.0.0.0` (container scenario) automatically enables `allowedHosts`-based
 * DNS rebinding protection so the SDK still validates the Host header.
 *
 * @param createServerFn - Factory function that creates a configured McpServer instance.
 * @param options - HTTP transport options (port, host, allowedHosts).
 * @returns The Express app instance (for testing).
 */
export async function startHttpTransport(
  createServerFn: () => McpServer,
  options: Partial<HttpTransportOptions> = {},
): Promise<Express> {
  const { port, host } = { ...DEFAULT_OPTIONS, ...options };
  const allowedHosts = buildAllowedHosts(host, options.allowedHosts);

  const app = createMcpExpressApp(allowedHosts ? { host, allowedHosts } : { host });

  // Liveness probe — must be registered before /mcp so it works regardless of
  // MCP transport state. Tier is read fresh in case env-based config changes.
  app.get("/healthz", (_req, res) => {
    let tier: string;
    try {
      tier = loadConfig().tier;
    } catch {
      tier = "unknown";
    }
    res.status(200).json({ ok: true, tier });
  });

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
