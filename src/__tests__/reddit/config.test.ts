import { describe, it, expect } from "vitest";
import { loadConfig } from "../../reddit/config.js";
import type { AuthTier } from "../../reddit/config.js";

describe("loadConfig", () => {
  /** Helper to build a minimal env object. */
  function env(vars: Record<string, string> = {}): Record<string, string | undefined> {
    return vars;
  }

  describe("tier detection", () => {
    it("should detect Tier 1 (anon) when no env vars are set", () => {
      const config = loadConfig(env());

      expect(config.tier).toBe("anon" satisfies AuthTier);
      expect(config.clientId).toBeNull();
      expect(config.clientSecret).toBeNull();
      expect(config.username).toBeNull();
      expect(config.password).toBeNull();
    });

    it("should detect Tier 2 (app) when CLIENT_ID and CLIENT_SECRET are set", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "my-client-id",
          REDDIT_CLIENT_SECRET: "my-client-secret",
        }),
      );

      expect(config.tier).toBe("app" satisfies AuthTier);
      expect(config.clientId).toBe("my-client-id");
      expect(config.clientSecret).toBe("my-client-secret");
      expect(config.username).toBeNull();
      expect(config.password).toBeNull();
    });

    it("should detect Tier 3 (user) when all 4 credential vars are set", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "my-client-id",
          REDDIT_CLIENT_SECRET: "my-client-secret",
          REDDIT_USERNAME: "testuser",
          REDDIT_PASSWORD: "testpass",
        }),
      );

      expect(config.tier).toBe("user" satisfies AuthTier);
      expect(config.clientId).toBe("my-client-id");
      expect(config.clientSecret).toBe("my-client-secret");
      expect(config.username).toBe("testuser");
      expect(config.password).toBe("testpass");
    });

    it("should remain Tier 2 when username is set but password is missing", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "my-client-id",
          REDDIT_CLIENT_SECRET: "my-client-secret",
          REDDIT_USERNAME: "testuser",
        }),
      );

      expect(config.tier).toBe("app" satisfies AuthTier);
    });

    it("should remain Tier 2 when password is set but username is missing", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "my-client-id",
          REDDIT_CLIENT_SECRET: "my-client-secret",
          REDDIT_PASSWORD: "testpass",
        }),
      );

      expect(config.tier).toBe("app" satisfies AuthTier);
    });
  });

  describe("validation", () => {
    it("should throw if CLIENT_SECRET is set without CLIENT_ID", () => {
      expect(() =>
        loadConfig(env({ REDDIT_CLIENT_SECRET: "secret-only" })),
      ).toThrow("REDDIT_CLIENT_SECRET is set but REDDIT_CLIENT_ID is missing");
    });

    it("should accept CLIENT_ID without CLIENT_SECRET (stays Tier 1)", () => {
      const config = loadConfig(env({ REDDIT_CLIENT_ID: "my-id" }));

      expect(config.tier).toBe("anon" satisfies AuthTier);
      expect(config.clientId).toBe("my-id");
      expect(config.clientSecret).toBeNull();
    });
  });

  describe("User-Agent", () => {
    it("should use REDDIT_USER_AGENT when set", () => {
      const config = loadConfig(
        env({ REDDIT_USER_AGENT: "custom:app:1.0 (by /u/someone)" }),
      );

      expect(config.userAgent).toBe("custom:app:1.0 (by /u/someone)");
    });

    it("should use default User-Agent when REDDIT_USER_AGENT is not set", () => {
      const config = loadConfig(env());

      expect(config.userAgent).toMatch(/^nodejs:reddit-mcp-server:/);
      expect(config.userAgent).toContain("(by /u/");
    });
  });

  describe("whitespace trimming", () => {
    it("should trim whitespace from all env var values", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "  my-id  ",
          REDDIT_CLIENT_SECRET: "  my-secret  ",
          REDDIT_USERNAME: "  user  ",
          REDDIT_PASSWORD: "  pass  ",
          REDDIT_USER_AGENT: "  custom:agent  ",
        }),
      );

      expect(config.clientId).toBe("my-id");
      expect(config.clientSecret).toBe("my-secret");
      expect(config.username).toBe("user");
      expect(config.password).toBe("pass");
      expect(config.userAgent).toBe("custom:agent");
    });

    it("should treat whitespace-only values as absent", () => {
      const config = loadConfig(
        env({
          REDDIT_CLIENT_ID: "   ",
          REDDIT_CLIENT_SECRET: "   ",
        }),
      );

      expect(config.tier).toBe("anon" satisfies AuthTier);
      expect(config.clientId).toBeNull();
    });
  });
});
