# E04-T01: Search Tool

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Epic**         | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status**       | Done                         |
| **Size**         | M                                   |
| **Dependencies** | E02, E03                            |

## Description

Search posts across Reddit or within a subreddit. Params: `q`, `subreddit` (optional), `sort` (relevance/hot/top/new), `time` (hour/day/week/month/year/all), `limit`, `after`. Uses `GET /search` or `GET /r/{sub}/search`.

## Acceptance Criteria

1. Returns posts matching query with title, score, author, url, subreddit
2. Subreddit-scoped search works
3. Sort and time filters apply correctly
4. Pagination via `after` cursor works
5. Zod schema validates all params with descriptions

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available for tier checking
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.2 (Endpoint Catalog) — Search category: 4 endpoints
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `search` tool: auth=anon, description format
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.1 (Critical Parameters) — `raw_json=1` on all GET requests
- [ ] Research read: research/01-reddit-official-api.md — `GET /search` and `GET /r/{sub}/search` endpoint details, query params
- [ ] Research read: research/10-tool-inventory.md — tool naming convention and description guidelines
- [ ] Understand the specific Reddit API endpoint: `GET /search` (global) and `GET /r/{subreddit}/search` (scoped, with `restrict_sr=true`)
- [ ] Understand Listing response format: pagination via `before`/`after` cursors, max 100 per request, default 25

## Definition of Done

- [ ] Tool registered with `McpServer.tool()` as `search`
- [ ] Returns posts matching query with title, score, author, url, subreddit fields
- [ ] Subreddit-scoped search works with `restrict_sr=true` when subreddit param provided
- [ ] Sort (relevance/hot/top/new) and time (hour/day/week/month/year/all) filters apply correctly
- [ ] Pagination via `after` cursor returns next page of results
- [ ] Zod schema validates all params with LLM-readable descriptions
- [ ] Error cases return `isError: true` with descriptive message (e.g., invalid subreddit)
- [ ] `raw_json=1` included in request
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests with mocked Reddit responses cover: basic search, subreddit-scoped search, pagination, sort/time filters
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

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
