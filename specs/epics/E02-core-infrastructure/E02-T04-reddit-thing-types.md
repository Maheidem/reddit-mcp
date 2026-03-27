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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 2; research/01-reddit-official-api.md (Thing types); research/07-api-edge-cases-and-gotchas.md (quirks)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
