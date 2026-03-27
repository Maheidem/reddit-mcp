import { describe, it, expect } from "vitest";
import { RedditApiError, parseRedditErrors } from "../../reddit/errors.js";

describe("parseRedditErrors", () => {
  describe("Format 1: Standard HTTP error", () => {
    it("should parse standard HTTP error format", () => {
      const data = { message: "Forbidden", error: 403 };
      const errors = parseRedditErrors(data, 403);

      expect(errors).toHaveLength(1);
      expect(errors![0]).toBeInstanceOf(RedditApiError);
      expect(errors![0].message).toBe("Forbidden");
      expect(errors![0].status).toBe(403);
      expect(errors![0].code).toBe("403");
      expect(errors![0].field).toBeNull();
    });

    it("should parse 404 Not Found", () => {
      const data = { message: "Not Found", error: 404 };
      const errors = parseRedditErrors(data, 404);

      expect(errors).toHaveLength(1);
      expect(errors![0].status).toBe(404);
    });
  });

  describe("Format 2: Wrapped JSON errors", () => {
    it("should parse single wrapped error", () => {
      const data = { json: { errors: [["BAD_SR_NAME", "that name isn't going to work", "sr"]] } };
      const errors = parseRedditErrors(data, 200);

      expect(errors).toHaveLength(1);
      expect(errors![0].code).toBe("BAD_SR_NAME");
      expect(errors![0].message).toBe("that name isn't going to work");
      expect(errors![0].field).toBe("sr");
    });

    it("should parse multiple wrapped errors", () => {
      const data = {
        json: {
          errors: [
            ["BAD_SR_NAME", "invalid subreddit", "sr"],
            ["NO_TEXT", "we need a title", "title"],
          ],
        },
      };
      const errors = parseRedditErrors(data, 200);

      expect(errors).toHaveLength(2);
      expect(errors![0].code).toBe("BAD_SR_NAME");
      expect(errors![1].code).toBe("NO_TEXT");
      expect(errors![1].field).toBe("title");
    });

    it("should return null for empty wrapped errors array", () => {
      const data = { json: { errors: [] } };
      const errors = parseRedditErrors(data, 200);

      expect(errors).toBeNull();
    });
  });

  describe("Format 3: jQuery callback response", () => {
    it("should detect jQuery callback format (array at top level)", () => {
      const data = [
        ["call", "attr", "#thing_t3_abc"],
        ["call", "redirect", "https://reddit.com"],
      ];
      const errors = parseRedditErrors(data, 200);

      expect(errors).toHaveLength(1);
      expect(errors![0].code).toBe("JQUERY_RESPONSE");
      expect(errors![0].message).toContain("api_type=json");
    });
  });

  describe("Format 4: Empty object (success)", () => {
    it("should return null for empty object (success)", () => {
      const data = {};
      const errors = parseRedditErrors(data, 200);

      expect(errors).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should return null for null data", () => {
      expect(parseRedditErrors(null, 200)).toBeNull();
    });

    it("should return null for undefined data", () => {
      expect(parseRedditErrors(undefined, 200)).toBeNull();
    });

    it("should return null for non-object data", () => {
      expect(parseRedditErrors("string", 200)).toBeNull();
    });

    it("should handle unrecognized format with error status code", () => {
      const data = { unexpected: "format" };
      const errors = parseRedditErrors(data, 500);

      expect(errors).toHaveLength(1);
      expect(errors![0].code).toBe("UNKNOWN_ERROR");
      expect(errors![0].status).toBe(500);
    });

    it("should return null for unrecognized format with success status", () => {
      const data = { unexpected: "format" };
      const errors = parseRedditErrors(data, 200);

      expect(errors).toBeNull();
    });
  });

  describe("RedditApiError", () => {
    it("should extend Error", () => {
      const error = new RedditApiError({
        message: "test",
        status: 400,
        code: "TEST",
      });
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("RedditApiError");
    });

    it("should have field as null when not provided", () => {
      const error = new RedditApiError({
        message: "test",
        status: 400,
        code: "TEST",
      });
      expect(error.field).toBeNull();
    });
  });
});
