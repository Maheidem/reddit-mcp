# E02-T04: Reddit Thing Types and Response Types

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02-T01 |

## Description
Build `src/reddit/types.ts`: TypeScript types for Thing (t1-t6), Listing, Post, Comment, Subreddit, User, Message. Handle documented quirks.

## Acceptance Criteria
1. Types for Post, Comment, Subreddit, User, Message, Listing defined
2. `replies` field typed as `Listing | ""`
3. `edited` field typed as `boolean | number`
4. Post type detection helpers: `isGallery()`, `isPoll()`, `isVideo()`, `isCrosspost()`

## Definition of Ready
- [ ] Dependency: E02-T01 (Reddit HTTP Client Foundation) is Done -- types need client context for how responses are shaped
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 2.3 -- Thing Types (t1=Comment, t2=Account, t3=Link/Post, t4=Message, t5=Subreddit, t6=Award; fullname format `tX_{id36}`)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 2.2 -- Endpoint Catalog (understand which data shapes come from which endpoints)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 8.1 -- Post Types and Detection (no single field determines post type; detection logic table)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.4 -- The `replies` Field Problem (`""` empty string, not null, when no replies)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.5 -- Null vs Missing vs Empty String (`edited` is `false` or float timestamp, `author` is `"[deleted]"` string)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.7 -- Field Naming Inconsistencies (`over_18` on posts vs `over18` on subreddits)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3.1 -- Response Format Inconsistencies (post type detection, field naming, `replies` field)
- [ ] Understand: Listings wrap arrays of Things with pagination cursors (`before`/`after`) and hard limit of ~1000 items
- [ ] ACs reviewed: 4 acceptance criteria covering types, replies quirk, edited quirk, and post type detection helpers

## Definition of Done
- [ ] AC1: TypeScript types defined for Post, Comment, Subreddit, User, Message, Listing with proper kind prefixes
- [ ] AC2: `replies` field typed as `Listing | ""` (empty string, not null/undefined)
- [ ] AC3: `edited` field typed as `boolean | number` (false when never edited, Unix timestamp when edited)
- [ ] AC4: Post type detection helpers implemented: `isGallery()`, `isPoll()`, `isVideo()`, `isCrosspost()` using correct field checks
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: type guard return values for each post type, edge cases (missing fields, empty strings)
- [ ] `over_18` used on Post types, `over18` used on Subreddit types (matching Reddit's inconsistent naming)
- [ ] Exported from `src/reddit/index.ts` barrel file
- [ ] TSDoc on all public types and type guard functions
- [ ] No lint warnings introduced

## Out of Scope
Runtime validation (Zod schemas are per-tool).

## Implementation Notes
- `over_18` on posts vs `over18` on subreddits (inconsistent naming from Reddit!)
- Thing types: t1 = Comment, t2 = Account, t3 = Link/Post, t4 = Message, t5 = Subreddit, t6 = Award
- `replies` is `""` (empty string) when there are no replies, not null/undefined
- `edited` is `false` when never edited, or a Unix timestamp number when edited
- Post type detection is based on presence of fields like `is_gallery`, `poll_data`, `is_video`, `crosspost_parent`

## Files to Create/Modify
- `src/reddit/types.ts` — all Thing types and type guards
- `src/reddit/index.ts` — export types
- `src/__tests__/reddit/types.test.ts` — tests for type detection helpers
