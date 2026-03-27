# E04-T07: Get Me Tool

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Epic**         | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status**       | Done                         |
| **Size**         | S                                   |
| **Dependencies** | E02, E03                            |

## Description

Get authenticated user's own profile. Requires Tier 3 auth. Uses `GET /api/v1/me`.

## Acceptance Criteria

1. Returns current user's profile data (username, karma, preferences)
2. Auth guard enforces `user` tier
3. Returns helpful error when called without user auth
4. `identity` scope used

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available; this tool requires Tier 3 (user) auth
- [ ] E03-T06 (Auth Guard) is Done — `requireAuth("user")` needed to enforce Tier 3 requirement
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.2 (Endpoint Catalog) — Account: 6 endpoints including identity, preferences
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.3 (OAuth Scopes) — `identity` scope required for `/api/v1/me`
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `get_me` tool: auth=user (only Phase 1 read tool requiring user auth)
- [ ] Research read: research/01-reddit-official-api.md — `GET /api/v1/me` endpoint details and response format
- [ ] Understand `/api/v1/me` returns a different format than `/user/{name}/about` — includes inbox_count, has_mail, preferences

## Definition of Done

- [ ] Tool registered with `McpServer.tool()` as `get_me`
- [ ] Returns current user's profile data: username, karma, preferences, inbox count
- [ ] Auth guard enforces `user` tier — calls `requireAuth("user")` before API request
- [ ] Returns helpful `isError: true` error when called without user auth: "This tool requires user authentication. Set REDDIT_USERNAME and REDDIT_PASSWORD."
- [ ] `identity` scope used in the authenticated request
- [ ] Zod schema validates params (minimal — this tool takes no required params) with LLM-readable description
- [ ] `raw_json=1` included in request
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: successful profile retrieval, auth guard rejection at anon tier, auth guard rejection at app-only tier
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

## Out of Scope

Updating preferences.

## Implementation Notes

- This is the only Phase 1 read tool that requires user auth (Tier 3)
- The `/api/v1/me` endpoint returns a different format than `/user/{name}/about`
- Auth guard should produce message like: "This tool requires user authentication. Set REDDIT_USERNAME and REDDIT_PASSWORD."
- Response includes inbox count, has_mail, preferences, and other user-specific data

## Files to Create/Modify

- `src/tools/read/get-me.ts` — get me tool implementation
- `src/tools/read/index.ts` — export tool
- `src/__tests__/tools/read/get-me.test.ts` — tests including auth guard rejection
