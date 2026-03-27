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
- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available; `wikiread` scope needed for wiki endpoint
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.2 (Endpoint Catalog) — Subreddits: 16+ endpoints; Wiki: 10 endpoints
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `get_trending` (auth=anon) and `get_wiki_page` (auth=anon) tool specs
- [ ] Research read: research/01-reddit-official-api.md — `GET /subreddits/popular` and `GET /r/{sub}/wiki/{page}` endpoint details
- [ ] Understand wiki page content is in `data.content_md` field of the response
- [ ] Understand wiki page names are case-sensitive and some subreddits have wiki disabled

## Definition of Done
- [ ] `get_trending` tool registered with `McpServer.tool()` — returns popular subreddits with subscriber counts and descriptions
- [ ] `get_wiki_page` tool registered with `McpServer.tool()` — returns wiki page content as markdown text
- [ ] Wiki page not found returns clear error with `isError: true`
- [ ] Wiki disabled on subreddit handled gracefully with `isError: true`
- [ ] `wikiread` scope used for wiki endpoint when authenticated
- [ ] Trending endpoint returns Listing with pagination support
- [ ] Zod schemas validate all params with LLM-readable descriptions
- [ ] `raw_json=1` included in requests
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: trending list retrieval, wiki page retrieval, wiki not found, wiki disabled on subreddit
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

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
