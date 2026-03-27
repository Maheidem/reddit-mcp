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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 10; research/01-reddit-official-api.md (user endpoints); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
