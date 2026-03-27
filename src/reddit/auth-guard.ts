/**
 * Auth-aware tool guard for the Reddit MCP Server.
 *
 * Tools use `requireAuth()` to verify the current auth tier
 * supports the required operation before making API calls.
 *
 * @module
 */

import type { AuthTier } from "./config.js";

/** Numeric tier ordering for comparison. */
const TIER_LEVEL: Record<AuthTier, number> = {
  anon: 0,
  app: 1,
  user: 2,
};

/** Environment variable guidance by tier. */
const TIER_UPGRADE_GUIDANCE: Record<AuthTier, string> = {
  anon: "",
  app: "Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables.",
  user:
    "Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, and REDDIT_PASSWORD environment variables.",
};

/**
 * Error thrown when auth tier is insufficient for the requested operation.
 * Structured for MCP `isError: true` response pattern.
 */
export class AuthGuardError extends Error {
  /** The tier currently active. */
  readonly currentTier: AuthTier;
  /** The tier required for the operation. */
  readonly requiredTier: AuthTier;

  constructor(currentTier: AuthTier, requiredTier: AuthTier) {
    const guidance = TIER_UPGRADE_GUIDANCE[requiredTier];
    super(
      `This tool requires ${requiredTier}-level authentication (current: ${currentTier}). ${guidance}`,
    );
    this.name = "AuthGuardError";
    this.currentTier = currentTier;
    this.requiredTier = requiredTier;
  }
}

/**
 * Verify the current auth tier meets the minimum required tier.
 *
 * Tier hierarchy: anon < app < user.
 * Each tier includes capabilities of all lower tiers.
 *
 * @param currentTier - The currently active auth tier.
 * @param requiredTier - The minimum tier required for the operation.
 * @throws {AuthGuardError} If the current tier is insufficient.
 */
export function requireAuth(currentTier: AuthTier, requiredTier: AuthTier): void {
  if (TIER_LEVEL[currentTier] < TIER_LEVEL[requiredTier]) {
    throw new AuthGuardError(currentTier, requiredTier);
  }
}

/**
 * Check if a required scope is present in the granted scopes.
 *
 * @param grantedScopes - Space-separated string of granted scopes.
 * @param requiredScope - The scope to check for.
 * @returns `true` if the scope is granted.
 */
export function hasScope(grantedScopes: string, requiredScope: string): boolean {
  const scopes = grantedScopes.split(" ");
  return scopes.includes(requiredScope);
}
