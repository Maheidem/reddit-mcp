import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenBucketRateLimiter } from "../../reddit/rate-limiter.js";

describe("TokenBucketRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("token consumption", () => {
    it("should start with full capacity", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      expect(limiter.remaining).toBe(100);
    });

    it("should consume one token per acquire", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      await limiter.acquire();
      // remaining is approximate due to refill, but should be ~99
      expect(limiter.remaining).toBe(99);
    });

    it("should support configurable capacity", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 30 });
      expect(limiter.remaining).toBe(30);
    });
  });

  describe("token refill", () => {
    it("should refill tokens over time", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100, windowSeconds: 600 });

      // Consume 50 tokens
      for (let i = 0; i < 50; i++) {
        await limiter.acquire();
      }
      expect(limiter.remaining).toBe(50);

      // Advance time by 300 seconds (half the window) — should refill ~50 tokens
      vi.advanceTimersByTime(300_000);
      expect(limiter.remaining).toBe(100); // capped at max
    });

    it("should not exceed max capacity", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100, windowSeconds: 600 });

      // Advance time well beyond the window
      vi.advanceTimersByTime(1_200_000);
      expect(limiter.remaining).toBe(100);
    });
  });

  describe("blocking behavior", () => {
    it("should block when tokens are exhausted and resolve after refill", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 2, windowSeconds: 600 });

      // Exhaust all tokens
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.remaining).toBe(0);

      // Start acquiring — this should block
      let resolved = false;
      const acquirePromise = limiter.acquire().then(() => {
        resolved = true;
      });

      // Should not resolve immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      // Advance enough time for 1 token to refill
      // refillRate = 2/600 = 0.00333 tokens/sec, need 1 token = ~300s
      await vi.advanceTimersByTimeAsync(301_000);
      await acquirePromise;
      expect(resolved).toBe(true);
    });
  });

  describe("header-based state sync", () => {
    it("should update tokens from X-Ratelimit-Remaining header", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      const headers = new Headers({
        "X-Ratelimit-Remaining": "42",
        "X-Ratelimit-Reset": "180",
      });

      limiter.updateFromHeaders(headers);
      expect(limiter.remaining).toBe(42);
    });

    it("should handle missing headers gracefully", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      const headers = new Headers();

      limiter.updateFromHeaders(headers);
      expect(limiter.remaining).toBe(100);
    });
  });

  describe("pre-emptive warning", () => {
    it("should emit warning when remaining < 10", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 10 });

      // Consume all but 9 tokens
      await limiter.acquire();
      expect(limiter.warning).not.toBeNull();
      expect(limiter.warning).toContain("Rate limit warning");
      expect(limiter.warning).toContain("9 requests remaining");
    });

    it("should not emit warning when remaining >= 10", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      await limiter.acquire();
      expect(limiter.warning).toBeNull();
    });

    it("should emit warning from header sync", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 100 });
      const headers = new Headers({
        "X-Ratelimit-Remaining": "5",
        "X-Ratelimit-Reset": "60",
      });

      limiter.updateFromHeaders(headers);
      expect(limiter.warning).toContain("5 requests remaining");
    });
  });

  describe("configurable capacity (mod notes)", () => {
    it("should work with 30 QPM limit for mod notes", async () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 30, windowSeconds: 60 });
      expect(limiter.remaining).toBe(30);

      for (let i = 0; i < 25; i++) {
        await limiter.acquire();
      }
      expect(limiter.remaining).toBe(5);
      expect(limiter.warning).toContain("5 requests remaining");
    });
  });
});
