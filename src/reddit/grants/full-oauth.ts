/**
 * Tier 3: Full OAuth (Password Grant).
 *
 * Authenticates with `grant_type=password` using all 4 credential vars.
 * 100 QPM, full read/write/moderate access.
 *
 * @module
 */

import type { AuthTier } from "../config.js";
import type { TokenGrant, TokenResponse } from "../auth.js";

/** Reddit's OAuth token endpoint. */
const TOKEN_ENDPOINT = "https://www.reddit.com/api/v1/access_token";

/**
 * Phase 1 OAuth scopes (12 scopes).
 * Extensible for Phase 2/3 expansion.
 */
export const PHASE1_SCOPES = [
  "read",
  "identity",
  "submit",
  "edit",
  "vote",
  "privatemessages",
  "history",
  "wikiread",
  "modposts",
  "modcontributors",
  "modlog",
  "modnote",
] as const;

/**
 * Full OAuth grant strategy — requires all 4 credential vars.
 * Gets a full-access token with all Phase 1 scopes.
 */
export class FullOAuthGrant implements TokenGrant {
  readonly tier: AuthTier = "user";

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly userAgent: string;
  private readonly scopes: readonly string[];

  constructor(
    clientId: string,
    clientSecret: string,
    username: string,
    password: string,
    userAgent: string,
    scopes: readonly string[] = PHASE1_SCOPES,
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.username = username;
    this.password = password;
    this.userAgent = userAgent;
    this.scopes = scopes;
  }

  async authenticate(): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "password",
      username: this.username,
      password: this.password,
      scope: this.scopes.join(" "),
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
      throw new Error(`Full OAuth failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as TokenResponse;
    return data;
  }
}
