import { describe, it, expect } from "vitest";
import {
  decodeRedditUrl,
  isDeleted,
  isRemoved,
  detectPostTypeFromRaw,
  extractPagination,
} from "../../utils/normalize.js";
import type { Listing, RedditPost, RedditComment } from "../../reddit/types.js";

describe("decodeRedditUrl", () => {
  it("should decode &amp; to &", () => {
    const url = "https://preview.redd.it/img.jpg?auto=webp&amp;s=abc123";
    expect(decodeRedditUrl(url)).toBe("https://preview.redd.it/img.jpg?auto=webp&s=abc123");
  });

  it("should decode multiple &amp; instances", () => {
    const url = "https://example.com?a=1&amp;b=2&amp;c=3";
    expect(decodeRedditUrl(url)).toBe("https://example.com?a=1&b=2&c=3");
  });

  it("should decode &lt; and &gt;", () => {
    expect(decodeRedditUrl("&lt;tag&gt;")).toBe("<tag>");
  });

  it("should return unchanged URLs without entities", () => {
    const url = "https://i.redd.it/clean.jpg";
    expect(decodeRedditUrl(url)).toBe(url);
  });
});

describe("isDeleted", () => {
  it("should detect user-deleted posts", () => {
    expect(isDeleted({ author: "[deleted]", selftext: "[deleted]" })).toBe(true);
  });

  it("should detect user-deleted comments", () => {
    expect(isDeleted({ author: "[deleted]", body: "[deleted]" })).toBe(true);
  });

  it("should NOT flag mod-removed content as deleted", () => {
    expect(isDeleted({ author: "[deleted]", body: "[removed]" })).toBe(false);
  });

  it("should NOT flag normal content as deleted", () => {
    expect(isDeleted({ author: "testuser", body: "hello" })).toBe(false);
  });

  it("should NOT flag when only author is deleted but content remains", () => {
    expect(isDeleted({ author: "[deleted]", body: "content still here" })).toBe(false);
  });
});

describe("isRemoved", () => {
  it("should detect mod-removed comments", () => {
    expect(isRemoved({ body: "[removed]" })).toBe(true);
  });

  it("should detect mod-removed posts", () => {
    expect(isRemoved({ selftext: "[removed]" })).toBe(true);
  });

  it("should NOT flag normal content", () => {
    expect(isRemoved({ body: "normal comment" })).toBe(false);
  });

  it("should NOT flag deleted content as removed", () => {
    expect(isRemoved({ body: "[deleted]" })).toBe(false);
  });
});

describe("detectPostTypeFromRaw", () => {
  it("should delegate to detectPostType", () => {
    const post = {
      is_self: true,
      is_video: false,
      is_crosspostable: true,
    } as RedditPost;
    expect(detectPostTypeFromRaw(post)).toBe("self");
  });
});

describe("extractPagination", () => {
  it("should extract after and before cursors", () => {
    const listing: Listing<RedditPost> = {
      kind: "Listing",
      data: {
        after: "t3_next",
        before: "t3_prev",
        children: [],
        dist: 25,
      },
    };

    const result = extractPagination(listing);
    expect(result.after).toBe("t3_next");
    expect(result.before).toBe("t3_prev");
    expect(result.count).toBe(25);
  });

  it("should handle null cursors", () => {
    const listing: Listing<RedditComment> = {
      kind: "Listing",
      data: {
        after: null,
        before: null,
        children: [],
        dist: null,
      },
    };

    const result = extractPagination(listing);
    expect(result.after).toBeNull();
    expect(result.before).toBeNull();
    expect(result.count).toBe(0);
  });

  it("should use children.length when dist is null", () => {
    const listing: Listing<RedditPost> = {
      kind: "Listing",
      data: {
        after: null,
        before: null,
        children: [
          { kind: "t3", data: {} as RedditPost },
          { kind: "t3", data: {} as RedditPost },
        ],
        dist: null,
      },
    };

    const result = extractPagination(listing);
    expect(result.count).toBe(2);
  });
});
