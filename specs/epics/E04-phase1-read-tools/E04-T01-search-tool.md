# E04-T01: Search Tool

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Search posts across Reddit or within a subreddit. Params: `q`, `subreddit` (optional), `sort` (relevance/hot/top/new), `time` (hour/day/week/month/year/all), `limit`, `after`. Uses `GET /search` or `GET /r/{sub}/search`.

## Acceptance Criteria
1. Returns posts matching query with title, score, author, url, subreddit
2. Subreddit-scoped search works
3. Sort and time filters apply correctly
4. Pagination via `after` cursor works
5. Zod schema validates all params with descriptions

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 8; research/01-reddit-official-api.md (search endpoint); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Comment search (Reddit doesn't support it via API).

## Implementation Notes
- `restrict_sr=true` needed for subreddit-scoped search
- Default sort is `relevance`, default time is `all`
- Max limit is 100, default is 25
- The search endpoint returns a Listing of posts (t3 Things)
- Zod parameter descriptions are what the LLM sees to understand what each param does

## Files to Create/Modify
- `src/tools/read/search.ts` — search tool implementation
- `src/tools/read/index.ts` — export search tool
- `src/__tests__/tools/read/search.test.ts` — tests with mocked Reddit responses
