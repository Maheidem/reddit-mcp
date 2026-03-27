/**
 * Reddit HTTP Client Foundation.
 *
 * Wraps native `fetch` with Reddit API conventions:
 * - `raw_json=1` on all GET requests (prevents HTML-encoding)
 * - `api_type=json` on all POST requests (forces JSON responses)
 * - User-Agent in Reddit format: `platform:app_id:version (by /u/username)`
 * - Base URL defaults to `https://oauth.reddit.com`
 * - Optional rate limiter integration (acquire before, updateFromHeaders after)
 * - Optional error parsing for all 4 Reddit error formats
 *
 * @module
 */

import type { TokenBucketRateLimiter } from "./rate-limiter.js";
import type { RedditAuthManager } from "./auth.js";
import { parseRedditErrors } from "./errors.js";

/** Configuration options for the Reddit HTTP client. */
export interface RedditClientOptions {
  /** Base URL for API requests. Defaults to `https://oauth.reddit.com`. */
  baseUrl?: string;
  /** User-Agent string in Reddit format: `platform:app_id:version (by /u/username)`. */
  userAgent: string;
  /** Optional rate limiter. When provided, `acquire()` is called before each request. */
  rateLimiter?: TokenBucketRateLimiter;
  /** Optional auth manager. When provided, Bearer token is injected into every request. */
  authManager?: RedditAuthManager;
}

/** Shape of a successful Reddit client response. */
export interface RedditResponse<T = unknown> {
  data: T;
  headers: Headers;
  status: number;
  /** Warning string when rate limit tokens are low (< 10 remaining). */
  rateLimitWarning: string | null;
}

/**
 * Low-level HTTP client for the Reddit API.
 *
 * Every GET request appends `raw_json=1` to prevent HTML-encoding.
 * Every POST request includes `api_type=json` in the body.
 * When a rate limiter is provided, requests are automatically throttled.
 */
export class RedditClient {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly rateLimiter: TokenBucketRateLimiter | null;
  private readonly authManager: RedditAuthManager | null;
  private authHeader: string | null = null;

  constructor(options: RedditClientOptions) {
    this.baseUrl = (options.baseUrl ?? "https://oauth.reddit.com").replace(/\/+$/, "");
    this.userAgent = options.userAgent;
    this.rateLimiter = options.rateLimiter ?? null;
    this.authManager = options.authManager ?? null;
  }

  /**
   * Set the Authorization header for authenticated requests.
   * @param header - The full Authorization header value (e.g., `"Bearer <token>"`).
   */
  setAuthHeader(header: string | null): void {
    this.authHeader = header;
  }

  /**
   * Send a GET request to the Reddit API.
   * Automatically appends `raw_json=1` to query parameters.
   *
   * @param path - The API path (e.g., `/r/programming/hot`).
   * @param params - Additional query parameters.
   * @returns The parsed JSON response with headers and status.
   * @throws {RedditApiError} When Reddit returns an error in any of its 4 formats.
   */
  async get<T = unknown>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<RedditResponse<T>> {
    // Rate limit: acquire token before request
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("raw_json", "1");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const headers = await this.buildHeaders();

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    return this.processResponse<T>(response);
  }

  /**
   * Send a POST request to the Reddit API.
   * Automatically includes `api_type=json` in the request body.
   *
   * @param path - The API path (e.g., `/api/submit`).
   * @param body - Form body parameters.
   * @returns The parsed JSON response with headers and status.
   * @throws {RedditApiError} When Reddit returns an error in any of its 4 formats.
   */
  async post<T = unknown>(
    path: string,
    body: Record<string, string> = {},
  ): Promise<RedditResponse<T>> {
    // Rate limit: acquire token before request
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const url = new URL(`${this.baseUrl}${path}`);
    const formBody = new URLSearchParams({ api_type: "json", ...body });
    const headers = await this.buildHeaders();

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    });

    return this.processResponse<T>(response);
  }

  /**
   * Process a fetch Response: update rate limiter, parse errors, return structured result.
   */
  private async processResponse<T>(response: Response): Promise<RedditResponse<T>> {
    // Rate limit: sync state from response headers
    if (this.rateLimiter) {
      this.rateLimiter.updateFromHeaders(response.headers);
    }

    const data = (await response.json()) as T;

    // Error parsing: check all 4 Reddit error formats
    const errors = parseRedditErrors(data, response.status);
    if (errors && errors.length > 0) {
      throw errors[0];
    }

    return {
      data,
      headers: response.headers,
      status: response.status,
      rateLimitWarning: this.rateLimiter?.warning ?? null,
    };
  }

  private async buildHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
    };

    // Auth manager takes priority over manual auth header
    if (this.authManager) {
      const token = await this.authManager.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } else if (this.authHeader) {
      headers["Authorization"] = this.authHeader;
    }

    return headers;
  }
}
