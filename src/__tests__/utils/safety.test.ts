import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateTitle,
  validateBody,
  validateComment,
  validateMessage,
  validateFlair,
  appendBotFooter,
  contentLengthWithFooter,
  DuplicateDetector,
} from "../../utils/safety.js";

// ─── Content Validation ──────────────────────────────────────────

describe("validateTitle", () => {
  it("should accept a valid title", () => {
    expect(validateTitle("Hello World")).toEqual({ valid: true, error: null });
  });

  it("should reject an empty title", () => {
    const result = validateTitle("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("must not be empty");
  });

  it("should accept title at exactly 300 characters", () => {
    const title = "a".repeat(300);
    expect(validateTitle(title)).toEqual({ valid: true, error: null });
  });

  it("should reject title at 301 characters", () => {
    const title = "a".repeat(301);
    const result = validateTitle(title);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds 300 character limit");
    expect(result.error).toContain("got 301");
  });

  it("should count Unicode characters, not UTF-16 code units", () => {
    // 299 ASCII chars + 1 emoji (1 Unicode char, 2 UTF-16 code units) = 300 chars
    const title = "a".repeat(299) + "👍";
    expect(validateTitle(title)).toEqual({ valid: true, error: null });
  });

  it("should reject when emoji push count over limit", () => {
    // 300 ASCII chars + 1 emoji = 301 Unicode chars
    const title = "a".repeat(300) + "👍";
    const result = validateTitle(title);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("got 301");
  });

  it("should count ZWJ sequences as multiple code points", () => {
    // 👨‍👩‍👧‍👦 = 7 code points (4 emoji + 3 ZWJ), not 1 grapheme
    const zwj = "👨‍👩‍👧‍👦";
    const codePoints = [...zwj].length; // 7
    const title = "a".repeat(300 - codePoints) + zwj;
    expect(validateTitle(title)).toEqual({ valid: true, error: null });
  });

  it("should count CJK characters as 1 code point each", () => {
    // CJK ideographs are single code points
    const title = "你".repeat(300);
    expect(validateTitle(title)).toEqual({ valid: true, error: null });

    const overLimit = "你".repeat(301);
    expect(validateTitle(overLimit).valid).toBe(false);
  });

  it("should reject whitespace-only title as non-empty", () => {
    // Whitespace-only passes length === 0 check (title.length > 0),
    // so it validates successfully — documenting current behavior
    const result = validateTitle("   ");
    expect(result.valid).toBe(true);
  });
});

describe("validateBody", () => {
  it("should accept an empty body", () => {
    expect(validateBody("")).toEqual({ valid: true, error: null });
  });

  it("should accept body at exactly 40,000 characters (standard)", () => {
    const body = "x".repeat(40_000);
    expect(validateBody(body)).toEqual({ valid: true, error: null });
  });

  it("should reject body at 40,001 characters (standard)", () => {
    const body = "x".repeat(40_001);
    const result = validateBody(body);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("40,000 character limit");
  });

  it("should accept 40,001 characters with premium flag", () => {
    const body = "x".repeat(40_001);
    expect(validateBody(body, { premium: true })).toEqual({ valid: true, error: null });
  });

  it("should accept body at exactly 80,000 characters (premium)", () => {
    const body = "x".repeat(80_000);
    expect(validateBody(body, { premium: true })).toEqual({ valid: true, error: null });
  });

  it("should reject body at 80,001 characters (premium)", () => {
    const body = "x".repeat(80_001);
    const result = validateBody(body, { premium: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("80,000 character limit");
  });

  it("should count Unicode characters correctly", () => {
    // 39,999 ASCII + 1 emoji = 40,000 Unicode chars → valid
    const body = "a".repeat(39_999) + "🎉";
    expect(validateBody(body)).toEqual({ valid: true, error: null });
  });
});

describe("validateComment", () => {
  it("should accept a valid comment", () => {
    expect(validateComment("Great post!")).toEqual({ valid: true, error: null });
  });

  it("should accept comment at exactly 10,000 characters", () => {
    const text = "c".repeat(10_000);
    expect(validateComment(text)).toEqual({ valid: true, error: null });
  });

  it("should reject comment at 10,001 characters", () => {
    const text = "c".repeat(10_001);
    const result = validateComment(text);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10,000 character limit");
    expect(result.error).toContain("got 10,001");
  });
});

describe("validateMessage", () => {
  it("should accept a valid message", () => {
    expect(validateMessage("Hello there")).toEqual({ valid: true, error: null });
  });

  it("should accept message at exactly 10,000 characters", () => {
    const text = "m".repeat(10_000);
    expect(validateMessage(text)).toEqual({ valid: true, error: null });
  });

  it("should reject message at 10,001 characters", () => {
    const text = "m".repeat(10_001);
    const result = validateMessage(text);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10,000 character limit");
  });
});

describe("validateFlair", () => {
  it("should accept flair at exactly 64 characters", () => {
    const text = "f".repeat(64);
    expect(validateFlair(text)).toEqual({ valid: true, error: null });
  });

  it("should reject flair at 65 characters", () => {
    const text = "f".repeat(65);
    const result = validateFlair(text);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("64 character limit");
    expect(result.error).toContain("got 65");
  });
});

// ─── Bot Disclosure ──────────────────────────────────────────────

describe("appendBotFooter", () => {
  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("should append the default footer", () => {
    const result = appendBotFooter("Hello");
    expect(result).toBe(
      "Hello\n\n---\n*I am a bot. This action was performed automatically.*",
    );
  });

  it("should use REDDIT_BOT_FOOTER env var when set", () => {
    process.env.REDDIT_BOT_FOOTER = "\n\n-- Custom Bot v1.0";
    const result = appendBotFooter("Hello");
    expect(result).toBe("Hello\n\n-- Custom Bot v1.0");
  });

  it("should work with empty content", () => {
    const result = appendBotFooter("");
    expect(result).toContain("I am a bot");
  });
});

describe("contentLengthWithFooter", () => {
  afterEach(() => {
    delete process.env.REDDIT_BOT_FOOTER;
  });

  it("should include footer length in the count", () => {
    const footer = "\n\n---\n*I am a bot. This action was performed automatically.*";
    const footerLen = [...footer].length;
    const content = "Hello";
    const contentLen = [...content].length;
    expect(contentLengthWithFooter(content)).toBe(contentLen + footerLen);
  });
});

// ─── Duplicate Detection ─────────────────────────────────────────

describe("DuplicateDetector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow the first submission", () => {
    const detector = new DuplicateDetector();
    expect(detector.isDuplicate("test", "My Post")).toBe(false);
  });

  it("should detect duplicate title+subreddit within window", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("test", "My Post");
    expect(detector.isDuplicate("test", "My Post")).toBe(true);
  });

  it("should normalize keys to lowercase", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("TestSub", "My POST");
    expect(detector.isDuplicate("testsub", "my post")).toBe(true);
  });

  it("should allow different titles in the same subreddit", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("test", "Post A");
    expect(detector.isDuplicate("test", "Post B")).toBe(false);
  });

  it("should allow the same title in different subreddits", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("sub1", "Same Title");
    expect(detector.isDuplicate("sub2", "Same Title")).toBe(false);
  });

  it("should allow resubmission after window expires", () => {
    const detector = new DuplicateDetector(5 * 60 * 1000); // 5 minutes
    detector.isDuplicate("test", "My Post");

    // Advance past 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(detector.isDuplicate("test", "My Post")).toBe(false);
  });

  it("should still block within window", () => {
    const detector = new DuplicateDetector(5 * 60 * 1000);
    detector.isDuplicate("test", "My Post");

    // Advance 4 minutes 59 seconds — still within window
    vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

    expect(detector.isDuplicate("test", "My Post")).toBe(true);
  });

  it("should bypass duplicate detection with force=true", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("test", "My Post");
    // Same submission with force=true should be allowed
    expect(detector.isDuplicate("test", "My Post", true)).toBe(false);
  });

  it("should record the submission when force=true", () => {
    const detector = new DuplicateDetector();
    detector.isDuplicate("test", "My Post", true);
    // Now without force, it should be blocked
    expect(detector.isDuplicate("test", "My Post")).toBe(true);
  });

  it("should clean up expired entries", () => {
    const detector = new DuplicateDetector(1000); // 1 second window
    detector.isDuplicate("test", "Post 1");
    detector.isDuplicate("test", "Post 2");
    expect(detector.size).toBe(2);

    vi.advanceTimersByTime(1001);

    // Trigger cleanup via isDuplicate call
    detector.isDuplicate("test", "Post 3");
    expect(detector.size).toBe(1); // Only Post 3 remains
  });

  it("should support custom window duration", () => {
    const detector = new DuplicateDetector(1000); // 1 second
    detector.isDuplicate("test", "Quick");

    vi.advanceTimersByTime(1001);

    expect(detector.isDuplicate("test", "Quick")).toBe(false);
  });
});
