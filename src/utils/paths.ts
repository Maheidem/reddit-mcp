/**
 * Filesystem path resolution for state, config, and logs.
 *
 * Forward-looking module: not consumed by the current 25 Phase 1 tools (all of
 * which are stateless or hold OAuth tokens in memory only). Wired up now so
 * future state-using code (token cache, allowlists, request logs) writes to
 * the correct location automatically — no Dockerfile or compose change needed
 * when the first consumer lands.
 *
 * Resolution order: env var → default. Defaults match the container layout
 * (`/app/data`, `/app/config`, `/app/logs`) when run inside the published image,
 * and a hidden directory under the user's home when run locally.
 *
 * @module
 */

import os from "node:os";
import path from "node:path";

/** Resolved filesystem paths for runtime state. */
export interface McpPaths {
  /** Directory for persistent state (token caches, rate-limit windows, etc.). */
  dataDir: string;
  /** Directory for operator-managed config files. */
  configDir: string;
  /** Directory for structured logs (when added). */
  logDir: string;
}

/**
 * Default base directory when no env vars are set.
 *
 * In a container the image's `WORKDIR` is `/app` and the Dockerfile pre-creates
 * `/app/{data,config,logs}` — but those exact paths are still expected to come
 * via env vars set by the compose file. The fallback here targets local
 * `npx`/`npm run dev` use, where we want a stable per-user location.
 */
function defaultBase(): string {
  return path.join(os.homedir(), ".reddit-mcp");
}

/**
 * Resolve runtime paths from environment variables, falling back to local
 * defaults when unset. Env var precedence: explicit `MCP_DATA_DIR` etc. win;
 * otherwise sub-directories of `defaultBase()`.
 *
 * @param env - Environment object to read from. Defaults to `process.env`.
 * @returns Resolved `McpPaths` for data, config, and log directories.
 */
export function resolvePaths(env: Record<string, string | undefined> = process.env): McpPaths {
  const base = defaultBase();
  return {
    dataDir: env.MCP_DATA_DIR?.trim() || path.join(base, "data"),
    configDir: env.MCP_CONFIG_DIR?.trim() || path.join(base, "config"),
    logDir: env.MCP_LOG_DIR?.trim() || path.join(base, "logs"),
  };
}
