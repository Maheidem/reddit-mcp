/**
 * Configuration and environment loading for the Reddit MCP Server.
 *
 * Detects auth tier based on which environment variables are present:
 * - Tier 1 (anonymous): No credentials needed
 * - Tier 2 (app-only): REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
 * - Tier 3 (user): All 4 credential vars (+ CLIENT_ID/SECRET)
 *
 * @module
 */

/** Authentication tier levels. */
export type AuthTier = "anon" | "app" | "user";

/** Reddit server configuration loaded from environment variables. */
export interface RedditConfig {
  /** Detected authentication tier. */
  tier: AuthTier;
  /** OAuth client ID (Tier 2+). */
  clientId: string | null;
  /** OAuth client secret (Tier 2+). */
  clientSecret: string | null;
  /** Reddit username (Tier 3 only). */
  username: string | null;
  /** Reddit password (Tier 3 only). */
  password: string | null;
  /** User-Agent string in Reddit format. */
  userAgent: string;
}

/** Default User-Agent when REDDIT_USER_AGENT is not set. */
const DEFAULT_USER_AGENT = "nodejs:reddit-mcp-server:0.1.0 (by /u/reddit-mcp-bot)";

/**
 * Load Reddit configuration from environment variables.
 *
 * @param env - Environment object to read from. Defaults to `process.env`.
 * @returns Validated `RedditConfig` with detected auth tier.
 * @throws {Error} If CLIENT_SECRET is set without CLIENT_ID.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): RedditConfig {
  const clientId = env.REDDIT_CLIENT_ID?.trim() || null;
  const clientSecret = env.REDDIT_CLIENT_SECRET?.trim() || null;
  const username = env.REDDIT_USERNAME?.trim() || null;
  const password = env.REDDIT_PASSWORD?.trim() || null;
  const userAgent = env.REDDIT_USER_AGENT?.trim() || DEFAULT_USER_AGENT;

  // Validation: CLIENT_SECRET without CLIENT_ID is invalid
  if (clientSecret && !clientId) {
    throw new Error(
      "Invalid configuration: REDDIT_CLIENT_SECRET is set but REDDIT_CLIENT_ID is missing. " +
        "Both must be provided together.",
    );
  }

  // Tier detection based on which vars are present
  let tier: AuthTier;
  if (clientId && clientSecret && username && password) {
    tier = "user";
  } else if (clientId && clientSecret) {
    tier = "app";
  } else {
    tier = "anon";
  }

  return { tier, clientId, clientSecret, username, password, userAgent };
}
