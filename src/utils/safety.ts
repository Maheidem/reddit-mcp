/**
 * Write-operation safety layer.
 *
 * Content validation (character limits), bot disclosure footer,
 * and duplicate submission detection. All write tools pass through
 * these checks before hitting the Reddit API.
 *
 * Character counting uses `[...str].length` (Unicode code points),
 * not `str.length` (UTF-16 code units), to match Reddit's behavior.
 *
 * @module
 */

// ─── Content Limits ──────────────────────────────────────────────

/** Reddit content character limits. */
export const CONTENT_LIMITS = {
  /** Post title: 300 characters, required non-empty. */
  TITLE: 300,
  /** Self-post body: 40,000 characters (standard users). */
  BODY_STANDARD: 40_000,
  /** Self-post body: 80,000 characters (Reddit Premium users). */
  BODY_PREMIUM: 80_000,
  /** Comment: 10,000 characters. */
  COMMENT: 10_000,
  /** Direct message: 10,000 characters. */
  MESSAGE: 10_000,
  /** Flair text: 64 characters. */
  FLAIR: 64,
} as const;

// ─── Validation Result ───────────────────────────────────────────

/** Result of a content validation check. */
export interface ValidationResult {
  /** Whether the content passed validation. */
  valid: boolean;
  /** Human-readable error message when invalid; `null` when valid. */
  error: string | null;
}

/** Shorthand for a passing validation. */
const VALID: ValidationResult = { valid: true, error: null };

/**
 * Count Unicode characters (code points), not UTF-16 code units.
 * Emoji like 👍 count as 1 character, not 2.
 */
function charCount(str: string): number {
  return [...str].length;
}

/** Format a number with comma thousands separators (locale-independent). */
function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ─── Validators ──────────────────────────────────────────────────

/**
 * Validate a post title.
 *
 * Rules: non-empty, at most 300 Unicode characters.
 *
 * @param title - The post title to validate.
 * @returns Validation result with specific error if invalid.
 */
export function validateTitle(title: string): ValidationResult {
  if (title.length === 0) {
    return { valid: false, error: "title must not be empty" };
  }
  const len = charCount(title);
  if (len > CONTENT_LIMITS.TITLE) {
    return {
      valid: false,
      error: `title exceeds ${CONTENT_LIMITS.TITLE} character limit (got ${len})`,
    };
  }
  return VALID;
}

/**
 * Validate a self-post body.
 *
 * @param body - The post body text.
 * @param options - Optional settings.
 * @param options.premium - If `true`, use the 80K premium limit instead of 40K.
 * @returns Validation result with specific error if invalid.
 */
export function validateBody(
  body: string,
  options: { premium?: boolean } = {},
): ValidationResult {
  const limit = options.premium ? CONTENT_LIMITS.BODY_PREMIUM : CONTENT_LIMITS.BODY_STANDARD;
  const len = charCount(body);
  if (len > limit) {
    return {
      valid: false,
      error: `body exceeds ${formatNum(limit)} character limit (got ${formatNum(len)})`,
    };
  }
  return VALID;
}

/**
 * Validate a comment.
 *
 * @param text - The comment text.
 * @returns Validation result with specific error if invalid.
 */
export function validateComment(text: string): ValidationResult {
  const len = charCount(text);
  if (len > CONTENT_LIMITS.COMMENT) {
    return {
      valid: false,
      error: `comment exceeds ${formatNum(CONTENT_LIMITS.COMMENT)} character limit (got ${formatNum(len)})`,
    };
  }
  return VALID;
}

/**
 * Validate a direct message body.
 *
 * @param text - The message text.
 * @returns Validation result with specific error if invalid.
 */
export function validateMessage(text: string): ValidationResult {
  const len = charCount(text);
  if (len > CONTENT_LIMITS.MESSAGE) {
    return {
      valid: false,
      error: `message exceeds ${formatNum(CONTENT_LIMITS.MESSAGE)} character limit (got ${formatNum(len)})`,
    };
  }
  return VALID;
}

/**
 * Validate flair text.
 *
 * @param text - The flair text.
 * @returns Validation result with specific error if invalid.
 */
export function validateFlair(text: string): ValidationResult {
  const len = charCount(text);
  if (len > CONTENT_LIMITS.FLAIR) {
    return {
      valid: false,
      error: `flair exceeds ${CONTENT_LIMITS.FLAIR} character limit (got ${len})`,
    };
  }
  return VALID;
}

// ─── Bot Disclosure ──────────────────────────────────────────────

/** Default bot footer per Reddit Responsible Builder Policy. */
const DEFAULT_BOT_FOOTER = "\n\n---\n*I am a bot. This action was performed automatically.*";

/**
 * Append the bot disclosure footer to content.
 *
 * Footer text is read from `REDDIT_BOT_FOOTER` env var,
 * falling back to a sensible default.
 *
 * @param content - The original content text.
 * @returns Content with bot footer appended.
 */
export function appendBotFooter(content: string): string {
  const footer = process.env.REDDIT_BOT_FOOTER ?? DEFAULT_BOT_FOOTER;
  return content + footer;
}

/**
 * Calculate the total length of content after bot footer is appended.
 * Useful for pre-validating that content + footer stays within limits.
 *
 * @param content - The original content text.
 * @returns Total Unicode character count including footer.
 */
export function contentLengthWithFooter(content: string): number {
  return charCount(appendBotFooter(content));
}

// ─── Duplicate Detection ─────────────────────────────────────────

/** Default duplicate detection window: 5 minutes. */
const DEFAULT_DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

/** Entry in the duplicate detection map. */
interface DuplicateEntry {
  /** Timestamp when this entry was recorded. */
  timestamp: number;
}

/**
 * In-memory duplicate submission detector.
 *
 * Tracks recent submissions by normalized `subreddit:title` key.
 * Entries auto-expire after the configured TTL window.
 * No external storage — purely in-memory with periodic cleanup.
 */
export class DuplicateDetector {
  private readonly entries = new Map<string, DuplicateEntry>();
  private readonly windowMs: number;

  /**
   * @param windowMs - Duplicate detection window in milliseconds. Defaults to 5 minutes.
   */
  constructor(windowMs: number = DEFAULT_DUPLICATE_WINDOW_MS) {
    this.windowMs = windowMs;
  }

  /**
   * Check if a submission is a duplicate and record it if not.
   *
   * @param subreddit - Target subreddit name.
   * @param title - Post title.
   * @param force - If `true`, bypass duplicate detection and record the submission.
   * @returns `true` if this is a duplicate (submission blocked), `false` if allowed.
   */
  isDuplicate(subreddit: string, title: string, force = false): boolean {
    this.cleanup();

    const key = this.normalizeKey(subreddit, title);

    if (force) {
      this.entries.set(key, { timestamp: Date.now() });
      return false;
    }

    const existing = this.entries.get(key);
    if (existing && Date.now() - existing.timestamp < this.windowMs) {
      return true;
    }

    this.entries.set(key, { timestamp: Date.now() });
    return false;
  }

  /** Number of tracked entries (for testing). */
  get size(): number {
    return this.entries.size;
  }

  /** Remove expired entries to prevent memory leaks. */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (now - entry.timestamp >= this.windowMs) {
        this.entries.delete(key);
      }
    }
  }

  /** Normalize the dedup key: lowercase subreddit and title. */
  private normalizeKey(subreddit: string, title: string): string {
    return `${subreddit.toLowerCase()}:${title.toLowerCase()}`;
  }
}
