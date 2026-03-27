# E02: Core Infrastructure

## Status: Not Started

## Goal
Build the shared foundation all tools depend on: HTTP client with Reddit conventions, rate limiter, error handling, and the Reddit type system.

## Dependencies
- E01 (Project Scaffolding) — must be Done

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 2, 4, 7, 11
- research/01-reddit-official-api.md
- research/07-api-edge-cases-and-gotchas.md

## Tasks

### E02-T01: Reddit HTTP client foundation
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E01-T03
- **Description**: Build `src/reddit/client.ts`: a `RedditClient` class wrapping `fetch`. Every GET includes `raw_json=1`. Every POST includes `api_type=json`. User-Agent follows `platform:app_id:version (by /u/username)` format. Base URL is `https://oauth.reddit.com`.
- **Acceptance Criteria**:
  1. GET requests auto-append `raw_json=1` query parameter
  2. POST requests auto-include `api_type=json` in body
  3. User-Agent header matches Reddit format: `platform:app_id:version (by /u/username)`
  4. Base URL is `https://oauth.reddit.com`
  5. Unit tests verify all 4 behaviors
- **Out of Scope**: Auth header injection (E03), rate limiting integration (E02-T06)
- **Notes**: Use native `fetch` (Node 18+). No axios/got dependency.

### E02-T02: Token bucket rate limiter
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E01-T05
- **Description**: Build `src/reddit/rate-limiter.ts`: token bucket with 100 QPM capacity, refill rate of 100/600 tokens/sec (10-min rolling window). Read and respect `X-Ratelimit-*` headers. Emit warning when under 10 tokens.
- **Acceptance Criteria**:
  1. `acquire()` blocks when tokens exhausted, resolves when refilled
  2. `updateFromHeaders()` syncs state to Reddit's rate limit headers
  3. Unit test verifies blocking behavior with mocked time
  4. Special 30 QPM limit configurable for mod notes endpoint
- **Out of Scope**: Integration with HTTP client (E02-T06)
- **Notes**: Three headers: `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`

### E02-T03: Reddit error parser (4 formats)
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02-T01
- **Description**: Build `src/reddit/errors.ts`: parse all 4 Reddit error formats. Map to unified `RedditApiError` class with `status`, `code`, `message`, `field` properties.
- **Acceptance Criteria**:
  1. Parses standard HTTP: `{"message":"Forbidden","error":403}`
  2. Parses wrapped JSON: `{"json":{"errors":[["BAD_SR_NAME","invalid","sr"]]}}`
  3. Handles empty `{}` as success (not error)
  4. Detects jQuery format and throws descriptive error
  5. All 4 formats have dedicated unit tests
- **Out of Scope**: MCP-level error mapping (that's in individual tools)
- **Notes**: Format 3 (jQuery) only happens without `api_type=json`, so it's a safety net

### E02-T04: Reddit Thing types and response types
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02-T01
- **Description**: Build `src/reddit/types.ts`: TypeScript types for Thing (t1-t6), Listing, Post, Comment, Subreddit, User, Message. Handle documented quirks.
- **Acceptance Criteria**:
  1. Types for Post, Comment, Subreddit, User, Message, Listing defined
  2. `replies` field typed as `Listing | ""`
  3. `edited` field typed as `boolean | number`
  4. Post type detection helpers: `isGallery()`, `isPoll()`, `isVideo()`, `isCrosspost()`
- **Out of Scope**: Runtime validation (Zod schemas are per-tool)
- **Notes**: `over_18` on posts vs `over18` on subreddits (inconsistent naming!)

### E02-T05: Response normalization utilities
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02-T04
- **Description**: Build `src/utils/normalize.ts`: decode HTML-encoded URLs, normalize deleted content detection, detect post type from raw response, handle listing pagination.
- **Acceptance Criteria**:
  1. `decodeRedditUrl()` handles `&amp;` → `&`
  2. `isDeleted()` / `isRemoved()` correctly identify content state
  3. `detectPostType()` returns enum from raw post data
  4. `extractPagination()` returns `{after, before, count}`
- **Out of Scope**: Full response transformation (tools do their own formatting)
- **Notes**: Deleted = author is `[deleted]` AND body is `[deleted]`. Removed = body is `[removed]`.

### E02-T06: Integrate rate limiter into HTTP client
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02-T01, E02-T02, E02-T03
- **Description**: Wire `RedditRateLimiter` into `RedditClient`. Every request calls `acquire()` before sending and `updateFromHeaders()` after receiving. Surface warnings in responses.
- **Acceptance Criteria**:
  1. Client calls `acquire()` before each request
  2. Client calls `updateFromHeaders()` after each response
  3. When remaining < 10, warning string appended to tool results
  4. Integration test with mocked fetch verifies full flow
- **Out of Scope**: Auth header injection (E03-T07)
- **Notes**: Error parsing (E02-T03) also runs after each response
