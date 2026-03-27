/**
 * Reddit Thing Types and Response Types.
 *
 * TypeScript types for Reddit's data model: Things (t1-t6),
 * Listings, and post type detection helpers.
 *
 * Handles documented quirks:
 * - `replies`: `Listing | ""` (empty string when no replies)
 * - `edited`: `boolean | number` (false or Unix timestamp)
 * - `over_18` on posts vs `over18` on subreddits
 *
 * @module
 */

// ─── Thing Kind Prefixes ─────────────────────────────────────────────

/** Reddit Thing kind prefixes. */
export type ThingKind = "t1" | "t2" | "t3" | "t4" | "t5" | "t6" | "Listing" | "more";

// ─── Listing ─────────────────────────────────────────────────────────

/** Pagination cursors for a Reddit Listing. */
export interface ListingData<T> {
  after: string | null;
  before: string | null;
  children: Array<Thing<T>>;
  dist: number | null;
  modhash?: string;
}

/** A Reddit Listing wrapper. */
export interface Listing<T = RedditThing> {
  kind: "Listing";
  data: ListingData<T>;
}

/** A wrapped Thing with kind prefix. */
export interface Thing<T = RedditThing> {
  kind: ThingKind;
  data: T;
}

// ─── Post (t3) ───────────────────────────────────────────────────────

/** A Reddit post (t3 / Link). */
export interface RedditPost {
  id: string;
  name: string; // fullname: t3_{id}
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  selftext: string;
  selftext_html: string | null;
  url: string;
  permalink: string;
  domain: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  /** `false` when never edited, Unix timestamp when edited. */
  edited: boolean | number;
  /** NSFW flag — note: subreddits use `over18` (no underscore). */
  over_18: boolean;
  spoiler: boolean;
  stickied: boolean;
  locked: boolean;
  archived: boolean;
  is_self: boolean;
  is_video: boolean;
  is_gallery?: boolean;
  is_crosspostable: boolean;
  post_hint?: string;
  thumbnail: string;
  media?: RedditMedia | null;
  preview?: RedditPreview;
  poll_data?: RedditPollData;
  crosspost_parent?: string;
  crosspost_parent_list?: RedditPost[];
  media_metadata?: Record<string, RedditMediaMetadata>;
  gallery_data?: RedditGalleryData;
  likes: boolean | null;
  saved: boolean;
  distinguished: string | null;
  score_hidden: boolean;
  link_flair_text: string | null;
  author_flair_text: string | null;
}

/** Reddit video media. */
export interface RedditMedia {
  reddit_video?: {
    fallback_url: string;
    height: number;
    width: number;
    duration: number;
    is_gif: boolean;
  };
}

/** Reddit image preview data. */
export interface RedditPreview {
  images: Array<{
    source: { url: string; width: number; height: number };
    resolutions: Array<{ url: string; width: number; height: number }>;
  }>;
  enabled: boolean;
}

/** Reddit poll data. */
export interface RedditPollData {
  options: Array<{ id: string; text: string; vote_count?: number }>;
  total_vote_count: number;
  voting_end_timestamp: number;
  user_selection?: string | null;
}

/** Reddit media metadata for gallery items. */
export interface RedditMediaMetadata {
  status: string;
  e: string;
  m: string;
  s: { u: string; x: number; y: number };
  id: string;
}

/** Reddit gallery data. */
export interface RedditGalleryData {
  items: Array<{ media_id: string; id: number; caption?: string; outbound_url?: string }>;
}

// ─── Comment (t1) ────────────────────────────────────────────────────

/** A Reddit comment (t1). */
export interface RedditComment {
  id: string;
  name: string; // fullname: t1_{id}
  author: string;
  body: string;
  body_html: string;
  subreddit: string;
  link_id: string;
  parent_id: string;
  score: number;
  created_utc: number;
  /** `false` when never edited, Unix timestamp when edited. */
  edited: boolean | number;
  /** Nested replies: a Listing when present, empty string `""` when none. */
  replies: Listing<RedditComment> | "";
  stickied: boolean;
  locked: boolean;
  archived: boolean;
  distinguished: string | null;
  likes: boolean | null;
  saved: boolean;
  depth: number;
  is_submitter: boolean;
  author_flair_text: string | null;
  score_hidden: boolean;
}

// ─── Subreddit (t5) ──────────────────────────────────────────────────

/** A Reddit subreddit (t5). */
export interface RedditSubreddit {
  id: string;
  name: string; // fullname: t5_{id}
  display_name: string;
  display_name_prefixed: string;
  title: string;
  public_description: string;
  description: string;
  description_html: string | null;
  subscribers: number;
  active_user_count: number | null;
  created_utc: number;
  /** NSFW flag — note: posts use `over_18` (with underscore). */
  over18: boolean;
  subreddit_type: "public" | "private" | "restricted" | "gold_restricted" | "archived" | "user";
  url: string;
  icon_img: string;
  community_icon: string;
  banner_img: string;
  lang: string;
  allow_images: boolean;
  allow_videos: boolean;
  allow_polls: boolean;
  spoilers_enabled: boolean;
  user_is_subscriber: boolean | null;
  user_is_moderator: boolean | null;
  user_is_banned: boolean | null;
}

// ─── User (t2) ───────────────────────────────────────────────────────

/** A Reddit user account (t2). */
export interface RedditUser {
  id: string;
  name: string;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
  is_gold: boolean;
  is_mod: boolean;
  has_verified_email: boolean;
  icon_img: string;
  subreddit?: RedditUserSubreddit;
  snoovatar_img?: string;
}

/** A user's profile subreddit. */
export interface RedditUserSubreddit {
  display_name: string;
  display_name_prefixed: string;
  title: string;
  public_description: string;
  subscribers: number;
  over_18: boolean;
  url: string;
}

// ─── Message (t4) ────────────────────────────────────────────────────

/** A Reddit private message (t4). */
export interface RedditMessage {
  id: string;
  name: string; // fullname: t4_{id}
  author: string;
  dest: string;
  subject: string;
  body: string;
  body_html: string;
  created_utc: number;
  new: boolean;
  was_comment: boolean;
  parent_id: string | null;
  context: string;
  distinguished: string | null;
}

// ─── Union Type ──────────────────────────────────────────────────────

/** Any Reddit data object. */
export type RedditThing =
  | RedditPost
  | RedditComment
  | RedditSubreddit
  | RedditUser
  | RedditMessage;

// ─── Post Type Detection ─────────────────────────────────────────────

/** Possible post types as determined by field inspection. */
export type PostType = "self" | "link" | "image" | "video" | "gallery" | "poll" | "crosspost";

/**
 * Detect the type of a Reddit post from its data fields.
 * Order matters: crosspost and gallery checks come first as they override other indicators.
 */
export function detectPostType(post: RedditPost): PostType {
  if (post.crosspost_parent) return "crosspost";
  if (post.is_gallery) return "gallery";
  if (post.poll_data) return "poll";
  if (post.is_video || post.media?.reddit_video) return "video";
  if (post.post_hint === "image" || post.preview?.images?.length) return "image";
  if (post.is_self) return "self";
  return "link";
}

/** Check if the post is a gallery. */
export function isGallery(post: RedditPost): boolean {
  return post.is_gallery === true;
}

/** Check if the post is a poll. */
export function isPoll(post: RedditPost): boolean {
  return post.poll_data !== undefined;
}

/** Check if the post is a video. */
export function isVideo(post: RedditPost): boolean {
  return post.is_video === true || post.media?.reddit_video !== undefined;
}

/** Check if the post is a crosspost. */
export function isCrosspost(post: RedditPost): boolean {
  return post.crosspost_parent !== undefined;
}
