import { describe, it, expect } from "vitest";
import type { RedditPost } from "../../reddit/types.js";
import {
  detectPostType,
  isGallery,
  isPoll,
  isVideo,
  isCrosspost,
} from "../../reddit/types.js";

/** Minimal post factory for testing type detection. */
function makePost(overrides: Partial<RedditPost> = {}): RedditPost {
  return {
    id: "abc123",
    name: "t3_abc123",
    title: "Test Post",
    author: "testuser",
    subreddit: "test",
    subreddit_name_prefixed: "r/test",
    selftext: "",
    selftext_html: null,
    url: "https://reddit.com/r/test/comments/abc123/test_post/",
    permalink: "/r/test/comments/abc123/test_post/",
    domain: "self.test",
    score: 1,
    upvote_ratio: 1.0,
    num_comments: 0,
    created_utc: 1700000000,
    edited: false,
    over_18: false,
    spoiler: false,
    stickied: false,
    locked: false,
    archived: false,
    is_self: true,
    is_video: false,
    is_crosspostable: true,
    thumbnail: "self",
    likes: null,
    saved: false,
    distinguished: null,
    score_hidden: false,
    link_flair_text: null,
    author_flair_text: null,
    ...overrides,
  };
}

describe("detectPostType", () => {
  it("should detect self/text posts", () => {
    const post = makePost({ is_self: true });
    expect(detectPostType(post)).toBe("self");
  });

  it("should detect link posts", () => {
    const post = makePost({ is_self: false, url: "https://example.com" });
    expect(detectPostType(post)).toBe("link");
  });

  it("should detect image posts via post_hint", () => {
    const post = makePost({ is_self: false, post_hint: "image" });
    expect(detectPostType(post)).toBe("image");
  });

  it("should detect image posts via preview.images", () => {
    const post = makePost({
      is_self: false,
      preview: {
        images: [{ source: { url: "https://i.redd.it/img.jpg", width: 100, height: 100 }, resolutions: [] }],
        enabled: true,
      },
    });
    expect(detectPostType(post)).toBe("image");
  });

  it("should detect video posts via is_video", () => {
    const post = makePost({ is_self: false, is_video: true });
    expect(detectPostType(post)).toBe("video");
  });

  it("should detect video posts via media.reddit_video", () => {
    const post = makePost({
      is_self: false,
      media: {
        reddit_video: {
          fallback_url: "https://v.redd.it/abc/DASH_720.mp4",
          height: 720,
          width: 1280,
          duration: 30,
          is_gif: false,
        },
      },
    });
    expect(detectPostType(post)).toBe("video");
  });

  it("should detect gallery posts", () => {
    const post = makePost({ is_gallery: true });
    expect(detectPostType(post)).toBe("gallery");
  });

  it("should detect poll posts", () => {
    const post = makePost({
      poll_data: {
        options: [
          { id: "1", text: "Yes" },
          { id: "2", text: "No" },
        ],
        total_vote_count: 100,
        voting_end_timestamp: 1700100000,
      },
    });
    expect(detectPostType(post)).toBe("poll");
  });

  it("should detect crosspost", () => {
    const post = makePost({ crosspost_parent: "t3_xyz789" });
    expect(detectPostType(post)).toBe("crosspost");
  });

  it("should prioritize crosspost over other types", () => {
    const post = makePost({ crosspost_parent: "t3_xyz789", is_self: true });
    expect(detectPostType(post)).toBe("crosspost");
  });

  it("should prioritize gallery over image/video", () => {
    const post = makePost({ is_gallery: true, is_video: true });
    expect(detectPostType(post)).toBe("gallery");
  });
});

describe("type guard helpers", () => {
  it("isGallery returns true for gallery posts", () => {
    expect(isGallery(makePost({ is_gallery: true }))).toBe(true);
    expect(isGallery(makePost())).toBe(false);
  });

  it("isPoll returns true for poll posts", () => {
    expect(
      isPoll(
        makePost({
          poll_data: {
            options: [{ id: "1", text: "Yes" }],
            total_vote_count: 10,
            voting_end_timestamp: 0,
          },
        }),
      ),
    ).toBe(true);
    expect(isPoll(makePost())).toBe(false);
  });

  it("isVideo returns true for video posts", () => {
    expect(isVideo(makePost({ is_video: true }))).toBe(true);
    expect(
      isVideo(
        makePost({
          media: { reddit_video: { fallback_url: "", height: 0, width: 0, duration: 0, is_gif: false } },
        }),
      ),
    ).toBe(true);
    expect(isVideo(makePost())).toBe(false);
  });

  it("isCrosspost returns true for crosspost posts", () => {
    expect(isCrosspost(makePost({ crosspost_parent: "t3_abc" }))).toBe(true);
    expect(isCrosspost(makePost())).toBe(false);
  });
});

describe("Reddit field quirks", () => {
  it("should type edited as boolean when never edited", () => {
    const post = makePost({ edited: false });
    expect(post.edited).toBe(false);
  });

  it("should type edited as number (timestamp) when edited", () => {
    const post = makePost({ edited: 1700000000 });
    expect(typeof post.edited).toBe("number");
  });

  it("should type over_18 on posts (underscore)", () => {
    const post = makePost({ over_18: true });
    expect(post.over_18).toBe(true);
  });
});
