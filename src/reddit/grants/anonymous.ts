/**
 * Tier 1: Anonymous Auth Grant.
 *
 * Uses installed client credentials grant (device ID, no secret).
 * Falls back to unauthenticated `.json` suffix access if OAuth fails.
 * Read-only, ~10 RPM rate limit.
 *
 * @module
 */

import type { AuthTier } from "../config.js";
import type { TokenGrant, TokenResponse } from "../auth.js";

/** Reddit's application-only grant endpoint. */
const TOKEN_ENDPOINT = "https://www.reddit.com/api/v1/access_token";

/** Device ID for anonymous installed-client grant. */
const ANONYMOUS_DEVICE_ID = "DO_NOT_TRACK_THIS_DEVICE";

/**
 * Anonymous grant strategy — no user credentials required.
 *
 * Primary path: installed client credentials grant with a device ID.
 * Fallback: returns a special marker token that signals the client
 * to use `https://www.reddit.com` with `.json` suffix instead.
 */
export class AnonymousGrant implements TokenGrant {
  readonly tier: AuthTier = "anon";

  private readonly userAgent: string;
  /** When true, the client should use `.json` suffix on `www.reddit.com`. */
  useFallback = false;

  constructor(userAgent: string) {
    this.userAgent = userAgent;
  }

  async authenticate(): Promise<TokenResponse> {
    try {
      const body = new URLSearchParams({
        grant_type: "https://oauth.reddit.com/grants/installed_client",
        device_id: ANONYMOUS_DEVICE_ID,
      });

      const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": this.userAgent,
          // Installed client grant: Basic auth with empty password
          Authorization: `Basic ${btoa("DO_NOT_TRACK_THIS_DEVICE:")}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Anonymous OAuth failed: HTTP ${response.status}`);
      }

      const data = (await response.json()) as TokenResponse;
      this.useFallback = false;
      return data;
    } catch {
      // Fallback: signal the client to use unauthenticated .json access
      this.useFallback = true;
      return {
        access_token: "",
        token_type: "bearer",
        expires_in: 3600,
        scope: "read",
      };
    }
  }
}
