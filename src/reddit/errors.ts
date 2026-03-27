/**
 * Reddit API error parser.
 *
 * Handles all 4 Reddit error response formats:
 * 1. Standard HTTP: `{"message":"Forbidden","error":403}`
 * 2. Wrapped JSON: `{"json":{"errors":[["BAD_SR_NAME","invalid","sr"]]}}`
 * 3. jQuery callback: `[["call","attr",...]]` (safety net)
 * 4. Empty object `{}`: treated as success, not an error
 *
 * @module
 */

/** Structured error from the Reddit API. */
export class RedditApiError extends Error {
  /** HTTP status code (e.g., 403, 404). */
  readonly status: number;
  /** Reddit error code (e.g., "BAD_SR_NAME", "FORBIDDEN"). */
  readonly code: string;
  /** Field that caused the error, if applicable (e.g., "sr"). */
  readonly field: string | null;

  constructor(options: { message: string; status: number; code: string; field?: string }) {
    super(options.message);
    this.name = "RedditApiError";
    this.status = options.status;
    this.code = options.code;
    this.field = options.field ?? null;
  }
}

/**
 * A single error tuple from Reddit's wrapped JSON format.
 * Format: `[error_code, human_message, field_name]`
 */
type RedditErrorTuple = [string, string, string];

/** Shape of Reddit's wrapped JSON error. */
interface WrappedJsonError {
  json: {
    errors: RedditErrorTuple[];
  };
}

/**
 * Parse a Reddit API response and extract errors if present.
 *
 * @param data - The parsed JSON response body.
 * @param status - The HTTP status code.
 * @returns An array of `RedditApiError` instances, or `null` if no errors found.
 */
export function parseRedditErrors(data: unknown, status: number): RedditApiError[] | null {
  // Non-object responses
  if (data === null || data === undefined) {
    return null;
  }

  // Format 3: jQuery callback format — array at top level
  // Note: Reddit's /r/{sub}/comments/{id} legitimately returns a 2-element array
  // [postListing, commentListing]. Only flag as jQuery if the array contains
  // nested arrays (like [["call","attr",...]]), not valid Listing objects.
  if (Array.isArray(data)) {
    const isJquery =
      data.length > 0 &&
      data.every((item) => Array.isArray(item) && typeof item[0] === "string");
    if (isJquery) {
      return [
        new RedditApiError({
          message:
            "Received jQuery callback response. Ensure api_type=json is included in POST requests.",
          status,
          code: "JQUERY_RESPONSE",
        }),
      ];
    }
    return null;
  }

  if (typeof data !== "object") {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Format 4: Empty object — success, not an error
  if (Object.keys(obj).length === 0) {
    return null;
  }

  // Format 1: Standard HTTP error {"message": "...", "error": 403}
  if (isStandardHttpError(obj)) {
    return [
      new RedditApiError({
        message: obj.message as string,
        status: obj.error as number,
        code: String(obj.error),
      }),
    ];
  }

  // Format 2: Wrapped JSON errors {"json": {"errors": [["CODE", "msg", "field"]]}}
  if (isWrappedJsonError(obj)) {
    const wrapped = obj as unknown as WrappedJsonError;
    const errors = wrapped.json.errors;
    if (errors.length === 0) {
      return null;
    }
    return errors.map(
      ([code, message, field]) =>
        new RedditApiError({
          message,
          status,
          code,
          field: field || undefined,
        }),
    );
  }

  // HTTP status indicates error but body format is unrecognized
  if (status >= 400) {
    return [
      new RedditApiError({
        message: `HTTP ${status} error with unrecognized response format`,
        status,
        code: "UNKNOWN_ERROR",
      }),
    ];
  }

  return null;
}

function isStandardHttpError(obj: Record<string, unknown>): boolean {
  return typeof obj.message === "string" && typeof obj.error === "number";
}

function isWrappedJsonError(obj: Record<string, unknown>): boolean {
  if (typeof obj.json !== "object" || obj.json === null) return false;
  const json = obj.json as Record<string, unknown>;
  return Array.isArray(json.errors);
}
