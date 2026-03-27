/**
 * Tier 2: App-Only Auth (Client Credentials Grant).
 *
 * Authenticates with `grant_type=client_credentials` using
 * HTTP Basic Auth (CLIENT_ID:CLIENT_SECRET). 100 QPM, read-only.
 *
 * @module
 */

import type { AuthTier } from "../config.js";
import type { TokenGrant, TokenResponse } from "../auth.js";

/** Reddit's OAuth token endpoint. */
const TOKEN_ENDPOINT = "https://www.reddit.com/api/v1/access_token";

/**
 * App-only grant strategy — requires CLIENT_ID and CLIENT_SECRET.
 * Gets a read-only access token at 100 QPM rate limit.
 */
export class AppOnlyGrant implements TokenGrant {
  readonly tier: AuthTier = "app";

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly userAgent: string;

  constructor(clientId: string, clientSecret: string, userAgent: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.userAgent = userAgent;
  }

  async authenticate(): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
    });

    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.userAgent,
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`App-only OAuth failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as TokenResponse;
    return data;
  }
}
