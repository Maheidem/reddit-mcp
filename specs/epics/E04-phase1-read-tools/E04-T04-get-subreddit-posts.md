# E04-T04: Get Subreddit Posts Tool

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Epic**         | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status**       | Done                         |
| **Size**         | M                                   |
| **Dependencies** | E02, E03                            |

## Description

List posts from a subreddit feed. Params: `subreddit`, `sort` (hot/new/top/rising/controversial), `time` (for top/controversial), `limit`, `after`. Uses `GET /r/{sub}/{sort}`.

## Acceptance Criteria

1. All 5 sort modes work
2. Time filter applies to top/controversial only
3. Returns normalized post list with pagination cursor
4. Post type detected (text/link/image/video/gallery/poll)

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types (including post type detection from E02-T04) available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available for tier checking
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.3 (Thing Types) — Listings wrap arrays with pagination cursors (`before`/`after`), hard limit ~1000 items
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.1 (Post Types and Detection) — no single field determines post type; detection logic for text/link/image/video/gallery/poll
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `get_subreddit_posts` tool: auth=anon
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.8 (Timing Gotchas) — vote fuzzing: use `upvote_ratio`, not `ups`/`downs`; score hiding during hide period
- [ ] Research read: research/01-reddit-official-api.md — listing endpoint: `GET /r/{sub}/{sort}`
- [ ] Understand time filter only applies to `top` and `controversial` sorts; `rising` has no time filter

## Definition of Done

- [ ] Tool registered with `McpServer.tool()` as `get_subreddit_posts`
- [ ] All 5 sort modes work: hot, new, top, rising, controversial
- [ ] Time filter (hour/day/week/month/year/all) applies only to top and controversial sorts
- [ ] Returns normalized post list with pagination cursor (`after` value for next page)
- [ ] Post type detected for each result (text/link/image/video/gallery/poll) using E02-T04 helpers
- [ ] Zod schema validates all params with LLM-readable descriptions; time filter param describes when it applies
- [ ] Pagination via `after` cursor works correctly
- [ ] Error cases return `isError: true` (invalid subreddit, etc.)
- [ ] `raw_json=1` included in request
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: each sort mode, time filter with top/controversial, time filter ignored for other sorts, pagination, post type detection
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

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
