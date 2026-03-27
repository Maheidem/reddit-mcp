/**
 * Token Bucket Rate Limiter for the Reddit API.
 *
 * Implements a token bucket algorithm with configurable capacity
 * (default 100 QPM for standard endpoints, 30 QPM for mod notes).
 * Syncs state from Reddit's `X-Ratelimit-*` response headers.
 * Emits a warning string when remaining tokens drop below 10.
 *
 * @module
 */

/** Options for creating a rate limiter instance. */
export interface RateLimiterOptions {
  /** Maximum tokens (requests) allowed. Defaults to 100. */
  capacity?: number;
  /** Window size in seconds for refill calculation. Defaults to 600 (10 minutes). */
  windowSeconds?: number;
}

/**
 * Token bucket rate limiter that respects Reddit's rate limit headers.
 *
 * Usage:
 * 1. Call `acquire()` before each request — blocks if tokens are exhausted.
 * 2. Call `updateFromHeaders()` after each response to sync with server state.
 * 3. Check `warning` for a message to surface when tokens are low.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private lastRefill: number;

  /** Warning message when remaining tokens < 10, or `null` when healthy. */
  warning: string | null = null;

  constructor(options: RateLimiterOptions = {}) {
    const capacity = options.capacity ?? 100;
    const windowSeconds = options.windowSeconds ?? 600;

    this.maxTokens = capacity;
    this.tokens = capacity;
    this.refillRate = capacity / windowSeconds;
    this.lastRefill = Date.now();
  }

  /** Number of tokens currently available. */
  get remaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Acquire a token before making a request.
   * Blocks (via setTimeout) if no tokens are available, resolving when a token is refilled.
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.refill();
    }

    this.tokens -= 1;
    this.updateWarning();
  }

  /**
   * Sync internal state from Reddit's rate limit response headers.
   *
   * @param headers - The response Headers object containing `X-Ratelimit-*` values.
   */
  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get("X-Ratelimit-Remaining");

    if (remaining !== null) {
      this.tokens = parseFloat(remaining);
      // Anchor lastRefill to now so refill() doesn't immediately add tokens
      this.lastRefill = Date.now();
    }

    this.updateWarning();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSeconds * this.refillRate);
    this.lastRefill = now;
  }

  private updateWarning(): void {
    if (this.tokens < 10) {
      this.warning = `Rate limit warning: ${Math.floor(this.tokens)} requests remaining. Requests may be delayed.`;
    } else {
      this.warning = null;
    }
  }
}
