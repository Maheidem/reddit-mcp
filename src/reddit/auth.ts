/**
 * Reddit Auth Manager with token lifecycle management.
 *
 * Caches access tokens in memory. Auto-refreshes at 50 minutes
 * (not 60) to avoid token expiry race conditions.
 * Tokens are never written to disk (Trail of Bits finding).
 *
 * Uses a `TokenGrant` strategy interface — tier-specific grant
 * implementations (T03-T05) plug into this manager.
 *
 * @module
 */

import type { AuthTier } from "./config.js";

/** Response shape from Reddit's token endpoint. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Strategy interface for tier-specific token acquisition.
 * Each auth tier (T03-T05) implements this to provide its own grant flow.
 */
export interface TokenGrant {
  /** Execute the OAuth grant flow and return a token response. */
  authenticate(): Promise<TokenResponse>;
  /** The auth tier this grant represents. */
  readonly tier: AuthTier;
}

/** Refresh buffer: refresh 10 minutes before actual expiry (50 min instead of 60). */
const REFRESH_BUFFER_MS = 50 * 60 * 1000;

/**
 * Manages Reddit OAuth token lifecycle.
 *
 * Call `getAccessToken()` before each request — it transparently
 * handles caching and refresh.
 */
export class RedditAuthManager {
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private readonly grant: TokenGrant;

  constructor(grant: TokenGrant) {
    this.grant = grant;
  }

  /** The auth tier of the underlying grant strategy. */
  get tier(): AuthTier {
    return this.grant.tier;
  }

  /**
   * Get a valid access token, refreshing if necessary.
   *
   * Returns cached token when still valid. Transparently refreshes
   * at the 50-minute mark.
   *
   * @returns A valid OAuth access token string.
   * @throws {Error} When token refresh fails.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.grant.authenticate();
      this.accessToken = response.access_token;
      this.tokenExpiry = Date.now() + REFRESH_BUFFER_MS;
      return this.accessToken;
    } catch (error: unknown) {
      // Clear any stale token on failure
      this.accessToken = null;
      this.tokenExpiry = 0;

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Token refresh failed: ${message}. Check credentials and retry.`,
        { cause: error },
      );
    }
  }

  /** Check if a token is currently cached and not expired. */
  get hasValidToken(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiry;
  }
}
