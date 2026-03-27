# E04-T05: Get User, Posts, and Comments Tools

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Get user profile, posts, and comments. Uses `GET /user/{username}/about`, `/submitted`, `/comments`.

## Acceptance Criteria
1. Profile includes karma breakdown, cake day, account age
2. Posts and comments support sort (hot/new/top) and pagination
3. Suspended/deleted users handled gracefully
4. `history` scope used for posts/comments endpoints

## Definition of Ready
- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available; `history` scope needed for posts/comments endpoints
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.2 (Endpoint Catalog) — Users: 12+ endpoints including profile, history, trophies
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.3 (Thing Types) — t2 (Account) fullname format
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `get_user`, `get_user_posts`, `get_user_comments` tools: auth=anon
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.9 (Deleted Content Detection) — `author="[deleted]"` for user-deleted content
- [ ] Research read: research/01-reddit-official-api.md — `GET /user/{username}/about`, `/submitted`, `/comments` endpoint details
- [ ] Understand suspended users return minimal data with `is_suspended: true`; shadow-banned and deleted users return 404

## Definition of Done
- [ ] `get_user` tool registered with `McpServer.tool()` — returns karma breakdown, cake day, account age
- [ ] `get_user_posts` tool registered with `McpServer.tool()` — lists user's submitted posts with sort and pagination
- [ ] `get_user_comments` tool registered with `McpServer.tool()` — lists user's comments with sort and pagination
- [ ] Posts and comments support sort (hot/new/top) and `after` cursor pagination
- [ ] Suspended users handled gracefully — returns `is_suspended` status, not a crash
- [ ] Deleted/shadow-banned users (404 response) return clear error with `isError: true`
- [ ] `history` scope used when making authenticated requests to posts/comments endpoints
- [ ] Zod schemas validate all params with LLM-readable descriptions
- [ ] `raw_json=1` included in requests
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: normal user profile, suspended user, deleted user (404), user posts with pagination, user comments
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

## Out of Scope
User's saved/hidden/upvoted content (requires target user's auth).

## Implementation Notes
- Suspended users return minimal data with `is_suspended: true`
- Shadow-banned users return 404
- Deleted users return 404 or minimal data
- Consider three separate MCP tools: `get_user`, `get_user_posts`, `get_user_comments`
- Karma breakdown includes `link_karma` and `comment_karma`

## Files to Create/Modify
- `src/tools/read/get-user.ts` — user profile tool
- `src/tools/read/get-user-posts.ts` — user posts tool
- `src/tools/read/get-user-comments.ts` — user comments tool
- `src/tools/read/index.ts` — export all three tools
- `src/__tests__/tools/read/get-user.test.ts` — tests including suspended/deleted edge cases
