# E04-T06: Get Trending and Wiki Page Tools

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02, E03 |

## Description
Get popular subreddits and read wiki pages. Uses `GET /subreddits/popular` and `GET /r/{sub}/wiki/{page}`.

## Acceptance Criteria
1. Trending returns list with subscriber counts and descriptions
2. Wiki page content returned as markdown text
3. Wiki page not found returns clear error
4. `wikiread` scope used for wiki endpoint

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 10; research/01-reddit-official-api.md (subreddit listing, wiki endpoints); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Wiki editing (Phase 3), subreddit discovery/search.

## Implementation Notes
- Wiki page names are case-sensitive
- Some subreddits have wiki disabled -- handle this gracefully
- Popular subreddits endpoint returns a Listing of subreddit Things
- Wiki content is in `data.content_md` field of the response

## Files to Create/Modify
- `src/tools/read/get-trending.ts` — popular subreddits tool
- `src/tools/read/get-wiki-page.ts` — wiki page reader tool
- `src/tools/read/index.ts` — export both tools
- `src/__tests__/tools/read/get-trending.test.ts` — tests for trending
- `src/__tests__/tools/read/get-wiki-page.test.ts` — tests including disabled wiki case
