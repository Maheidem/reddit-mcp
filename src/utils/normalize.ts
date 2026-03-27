/**
 * Response normalization utilities for Reddit API data.
 *
 * Handles common Reddit API quirks:
 * - HTML-encoded URLs (`&amp;` in preview/gallery image URLs)
 * - Deleted/removed content detection
 * - Post type detection from raw response data
 * - Listing pagination cursor extraction
 *
 * @module
 */

import type { Listing, RedditPost, RedditComment } from "../reddit/types.js";
import { type PostType, detectPostType } from "../reddit/types.js";

/**
 * Decode HTML entities in Reddit URLs.
 * Reddit HTML-encodes ampersands in `preview`, `media_metadata`, and gallery URLs,
 * even with `raw_json=1` on some fields.
 *
 * @param url - The URL string potentially containing HTML entities.
 * @returns The decoded URL.
 */
export function decodeRedditUrl(url: string): string {
  return url.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/**
 * Check if content was deleted by the user.
 * User-deleted: author is `"[deleted]"` AND body/selftext is `"[deleted]"`.
 *
 * @param content - A post or comment object.
 * @returns `true` if the content was deleted by the user.
 */
export function isDeleted(content: { author: string; body?: string; selftext?: string }): boolean {
  if (content.author !== "[deleted]") return false;
  const text = content.body ?? content.selftext ?? "";
  return text === "[deleted]";
}

/**
 * Check if content was removed by a moderator.
 * Mod-removed: body/selftext is `"[removed]"`.
 *
 * @param content - A post or comment object.
 * @returns `true` if the content was removed by a moderator.
 */
export function isRemoved(content: { body?: string; selftext?: string }): boolean {
  const text = content.body ?? content.selftext ?? "";
  return text === "[removed]";
}

/**
 * Detect the post type from raw Reddit post data.
 * Delegates to `detectPostType` from the types module.
 *
 * @param post - A Reddit post object.
 * @returns The detected `PostType`.
 */
export function detectPostTypeFromRaw(post: RedditPost): PostType {
  return detectPostType(post);
}

/** Pagination cursors extracted from a Reddit Listing. */
export interface PaginationInfo {
  /** Fullname of the last item for forward pagination. */
  after: string | null;
  /** Fullname of the first item for backward pagination. */
  before: string | null;
  /** Number of items already seen (for offset tracking). */
  count: number;
}

/**
 * Extract pagination cursors from a Reddit Listing response.
 *
 * @param listing - A Reddit Listing response.
 * @returns Pagination info with `after`, `before`, and `count`.
 */
export function extractPagination(listing: Listing<RedditPost | RedditComment>): PaginationInfo {
  return {
    after: listing.data.after ?? null,
    before: listing.data.before ?? null,
    count: listing.data.dist ?? listing.data.children.length,
  };
}
