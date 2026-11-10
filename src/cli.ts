/**
 * CLI argument parsing helpers for the entry point.
 *
 * Extracted from `src/index.ts` so tests can import the resolution logic without
 * triggering the module's `main()` side effect.
 *
 * @module
 */

/**
 * Parse a CLI flag value: `--flag value` or `--flag=value`.
 *
 * @param args - Argv slice (e.g. `process.argv.slice(2)`).
 * @param flag - Flag name including leading dashes (e.g. `"--host"`).
 * @returns The value if found, or `undefined`.
 */
export function getFlag(args: string[], flag: string): string | undefined {
  const eqIdx = args.findIndex((a) => a.startsWith(`${flag}=`));
  if (eqIdx !== -1) return args[eqIdx].split("=")[1];
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

/** Result of resolving HTTP transport CLI/env options. */
export interface ResolvedHttpOptions {
  /** Resolved bind host. `undefined` lets `startHttpTransport` use its default. */
  host: string | undefined;
  /** Resolved listen port. `undefined` lets `startHttpTransport` use its default. */
  port: number | undefined;
  /**
   * Validation error message if the resolved port is invalid. When present,
   * `port` is `undefined` and the caller should print this and exit 1.
   */
  error?: string;
}

/**
 * Resolve `--host` and `--port` from CLI flags, falling back to `MCP_HTTP_HOST`
 * and `MCP_HTTP_PORT` env vars, then to transport defaults.
 *
 * Precedence: CLI flag > env var > default.
 *
 * @param args - Argv slice (e.g. `process.argv.slice(2)`).
 * @param env - Environment object (e.g. `process.env`). Defaults to `process.env`.
 * @returns Resolved host/port plus an optional validation error.
 */
export function resolveHttpOptions(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): ResolvedHttpOptions {
  const host = getFlag(args, "--host") ?? env.MCP_HTTP_HOST ?? undefined;
  const portStr = getFlag(args, "--port") ?? env.MCP_HTTP_PORT;

  if (portStr === undefined || portStr === "") {
    return { host, port: undefined };
  }

  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      host,
      port: undefined,
      error: `reddit-mcp-server: invalid port "${portStr}". Must be 1-65535.`,
    };
  }
  return { host, port };
}
