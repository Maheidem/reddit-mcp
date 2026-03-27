import { describe, it, expect } from "vitest";
import { requireAuth, hasScope, AuthGuardError } from "../../reddit/auth-guard.js";
import type { AuthTier } from "../../reddit/config.js";

describe("requireAuth", () => {
  describe("anon requirement", () => {
    it("should pass when current tier is anon", () => {
      expect(() => requireAuth("anon", "anon")).not.toThrow();
    });

    it("should pass when current tier is app", () => {
      expect(() => requireAuth("app", "anon")).not.toThrow();
    });

    it("should pass when current tier is user", () => {
      expect(() => requireAuth("user", "anon")).not.toThrow();
    });
  });

  describe("app requirement", () => {
    it("should fail when current tier is anon", () => {
      expect(() => requireAuth("anon", "app")).toThrow(AuthGuardError);
    });

    it("should pass when current tier is app", () => {
      expect(() => requireAuth("app", "app")).not.toThrow();
    });

    it("should pass when current tier is user", () => {
      expect(() => requireAuth("user", "app")).not.toThrow();
    });
  });

  describe("user requirement", () => {
    it("should fail when current tier is anon", () => {
      expect(() => requireAuth("anon", "user")).toThrow(AuthGuardError);
    });

    it("should fail when current tier is app", () => {
      expect(() => requireAuth("app", "user")).toThrow(AuthGuardError);
    });

    it("should pass when current tier is user", () => {
      expect(() => requireAuth("user", "user")).not.toThrow();
    });
  });

  describe("error messages", () => {
    it("should name specific env vars for app-level upgrade", () => {
      try {
        requireAuth("anon", "app");
      } catch (error: unknown) {
        const message = (error as AuthGuardError).message;
        expect(message).toContain("REDDIT_CLIENT_ID");
        expect(message).toContain("REDDIT_CLIENT_SECRET");
      }
    });

    it("should name specific env vars for user-level upgrade", () => {
      try {
        requireAuth("anon", "user");
      } catch (error: unknown) {
        const message = (error as AuthGuardError).message;
        expect(message).toContain("REDDIT_USERNAME");
        expect(message).toContain("REDDIT_PASSWORD");
        expect(message).toContain("REDDIT_CLIENT_ID");
        expect(message).toContain("REDDIT_CLIENT_SECRET");
      }
    });

    it("should include current and required tier in error", () => {
      try {
        requireAuth("anon", "user");
      } catch (error: unknown) {
        const guardError = error as AuthGuardError;
        expect(guardError.currentTier).toBe("anon" satisfies AuthTier);
        expect(guardError.requiredTier).toBe("user" satisfies AuthTier);
      }
    });
  });
});

describe("hasScope", () => {
  it("should return true when scope is present", () => {
    expect(hasScope("read identity submit", "identity")).toBe(true);
  });

  it("should return false when scope is absent", () => {
    expect(hasScope("read identity", "submit")).toBe(false);
  });

  it("should handle single scope string", () => {
    expect(hasScope("read", "read")).toBe(true);
  });

  it("should not match partial scope names", () => {
    expect(hasScope("read identity", "ident")).toBe(false);
  });

  it("should handle empty scope string", () => {
    expect(hasScope("", "read")).toBe(false);
  });
});

describe("AuthGuardError", () => {
  it("should be an instance of Error", () => {
    const error = new AuthGuardError("anon", "user");
    expect(error).toBeInstanceOf(Error);
  });

  it("should have name AuthGuardError", () => {
    const error = new AuthGuardError("anon", "user");
    expect(error.name).toBe("AuthGuardError");
  });

  it("should expose currentTier and requiredTier", () => {
    const error = new AuthGuardError("app", "user");
    expect(error.currentTier).toBe("app");
    expect(error.requiredTier).toBe("user");
  });
});
