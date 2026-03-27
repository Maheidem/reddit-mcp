# E04-T04: Get Subreddit Posts Tool

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
List posts from a subreddit feed. Params: `subreddit`, `sort` (hot/new/top/rising/controversial), `time` (for top/controversial), `limit`, `after`. Uses `GET /r/{sub}/{sort}`.

## Acceptance Criteria
1. All 5 sort modes work
2. Time filter applies to top/controversial only
3. Returns normalized post list with pagination cursor
4. Post type detected (text/link/image/video/gallery/poll)

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 8; research/01-reddit-official-api.md (listing endpoints); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Frontpage (r/all, r/popular) -- can be added if needed.

## Implementation Notes
- `rising` has no time filter
- Default limit is 25, max 100
- Time filter values: hour, day, week, month, year, all
- Time filter only applies when sort is `top` or `controversial`; ignore it for other sorts
- Post type detection uses helpers from E02-T04

## Files to Create/Modify
- `src/tools/read/get-subreddit-posts.ts` — subreddit posts listing tool
- `src/tools/read/index.ts` — export tool
- `src/__tests__/tools/read/get-subreddit-posts.test.ts` — tests for all sort modes
