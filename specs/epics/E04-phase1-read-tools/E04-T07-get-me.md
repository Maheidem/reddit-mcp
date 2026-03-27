# E04-T07: Get Me Tool

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02, E03 |

## Description
Get authenticated user's own profile. Requires Tier 3 auth. Uses `GET /api/v1/me`.

## Acceptance Criteria
1. Returns current user's profile data (username, karma, preferences)
2. Auth guard enforces `user` tier
3. Returns helpful error when called without user auth
4. `identity` scope used

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 10; research/01-reddit-official-api.md (me endpoint); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
