import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedditAuthManager } from "../../reddit/auth.js";
import type { TokenGrant, TokenResponse } from "../../reddit/auth.js";
import type { AuthTier } from "../../reddit/config.js";

/** Helper to create a mock TokenGrant. */
function mockGrant(tier: AuthTier = "app"): TokenGrant & { authenticate: ReturnType<typeof vi.fn> } {
  return {
    tier,
    authenticate: vi.fn<() => Promise<TokenResponse>>().mockResolvedValue({
      access_token: "mock-token-abc",
      token_type: "bearer",
      expires_in: 3600,
      scope: "read",
    }),
  };
}

describe("RedditAuthManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should expose the grant tier", () => {
    const grant = mockGrant("user");
    const manager = new RedditAuthManager(grant);

    expect(manager.tier).toBe("user");
  });

  describe("getAccessToken", () => {
    it("should authenticate on first call", async () => {
      const grant = mockGrant();
      const manager = new RedditAuthManager(grant);

      const token = await manager.getAccessToken();

      expect(token).toBe("mock-token-abc");
      expect(grant.authenticate).toHaveBeenCalledOnce();
    });

    it("should return cached token on subsequent calls within 50 minutes", async () => {
      const grant = mockGrant();
      const manager = new RedditAuthManager(grant);

      await manager.getAccessToken();

      // Advance 49 minutes — still within the 50-min refresh window
      vi.advanceTimersByTime(49 * 60 * 1000);

      const token = await manager.getAccessToken();

      expect(token).toBe("mock-token-abc");
      expect(grant.authenticate).toHaveBeenCalledOnce(); // No re-auth
    });

    it("should refresh token after 50 minutes", async () => {
      const grant = mockGrant();
      grant.authenticate
        .mockResolvedValueOnce({
          access_token: "token-1",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        })
        .mockResolvedValueOnce({
          access_token: "token-2",
          token_type: "bearer",
          expires_in: 3600,
          scope: "read",
        });

      const manager = new RedditAuthManager(grant);

      const first = await manager.getAccessToken();
      expect(first).toBe("token-1");

      // Advance past 50 minutes
      vi.advanceTimersByTime(51 * 60 * 1000);

      const second = await manager.getAccessToken();
      expect(second).toBe("token-2");
      expect(grant.authenticate).toHaveBeenCalledTimes(2);
    });

    it("should NOT refresh before 50 minutes", async () => {
      const grant = mockGrant();
      const manager = new RedditAuthManager(grant);

      await manager.getAccessToken();

      // Advance exactly to 49 min 59 sec — should still be cached
      vi.advanceTimersByTime(49 * 60 * 1000 + 59 * 1000);

      await manager.getAccessToken();

      expect(grant.authenticate).toHaveBeenCalledOnce();
    });

    it("should throw clear error on refresh failure", async () => {
      const grant = mockGrant();
      grant.authenticate.mockRejectedValue(new Error("Network timeout"));

      const manager = new RedditAuthManager(grant);

      await expect(manager.getAccessToken()).rejects.toThrow(
        "Token refresh failed: Network timeout. Check credentials and retry.",
      );
    });

    it("should clear stale token on refresh failure", async () => {
      const grant = mockGrant();
      const manager = new RedditAuthManager(grant);

      // Successful first auth
      await manager.getAccessToken();
      expect(manager.hasValidToken).toBe(true);

      // Expire token
      vi.advanceTimersByTime(51 * 60 * 1000);

      // Fail the refresh
      grant.authenticate.mockRejectedValueOnce(new Error("Fail"));

      await expect(manager.getAccessToken()).rejects.toThrow();
      expect(manager.hasValidToken).toBe(false);
    });
  });

  describe("hasValidToken", () => {
    it("should return false before any authentication", () => {
      const manager = new RedditAuthManager(mockGrant());

      expect(manager.hasValidToken).toBe(false);
    });

    it("should return true after successful authentication", async () => {
      const manager = new RedditAuthManager(mockGrant());

      await manager.getAccessToken();

      expect(manager.hasValidToken).toBe(true);
    });

    it("should return false after token expires", async () => {
      const manager = new RedditAuthManager(mockGrant());

      await manager.getAccessToken();

      // Advance past 50 minutes
      vi.advanceTimersByTime(51 * 60 * 1000);

      expect(manager.hasValidToken).toBe(false);
    });
  });
});
