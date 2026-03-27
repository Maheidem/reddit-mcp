/**
 * Reddit API client barrel.
 * Exports are added as E02 (Core Infrastructure) tasks are completed.
 */
export { RedditClient } from "./client.js";
export type { RedditClientOptions, RedditResponse } from "./client.js";
export { TokenBucketRateLimiter } from "./rate-limiter.js";
export type { RateLimiterOptions } from "./rate-limiter.js";
export { RedditApiError, parseRedditErrors } from "./errors.js";
export {
  detectPostType,
  isGallery,
  isPoll,
  isVideo,
  isCrosspost,
} from "./types.js";
export type {
  ThingKind,
  Listing,
  ListingData,
  Thing,
  RedditPost,
  RedditComment,
  RedditSubreddit,
  RedditUser,
  RedditMessage,
  RedditThing,
  PostType,
  RedditMedia,
  RedditPreview,
  RedditPollData,
  RedditMediaMetadata,
  RedditGalleryData,
  RedditUserSubreddit,
} from "./types.js";
export { loadConfig } from "./config.js";
export type { AuthTier, RedditConfig } from "./config.js";
export { RedditAuthManager } from "./auth.js";
export type { TokenGrant, TokenResponse } from "./auth.js";
export { AnonymousGrant } from "./grants/anonymous.js";
export { AppOnlyGrant } from "./grants/app-only.js";
export { FullOAuthGrant, PHASE1_SCOPES } from "./grants/full-oauth.js";
export { requireAuth, hasScope, AuthGuardError } from "./auth-guard.js";
