# E06-T05: `get_mod_notes` Tool

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Read moderator notes for a user in a subreddit. Handle special 30 QPM rate limit. Params: `subreddit`, `user`. Uses `GET /api/mod/notes`.

## Acceptance Criteria
1. Returns mod notes for user+subreddit pair
2. Rate limiter enforces 30 QPM for this endpoint (not 100)
3. Note labels correctly parsed (BOT_BAN, PERMA_BAN, BAN, ABUSE_WARNING, SPAM_WARNING, SPAM_WATCH, SOLID_CONTRIBUTOR, HELPFUL_USER)
4. Requires `modnote` scope
5. Pagination supported

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 9; research/05-reddit-moderation-apis.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Creating/deleting mod notes (Phase 3).

## Implementation Notes
- Max 250 chars per note
- Special rate limit requires per-endpoint limiter configuration -- this is the only endpoint with a different QPM than the standard 100
- The 30 QPM limit means the rate limiter needs to support endpoint-specific overrides
- Labels are an enum -- validate against known values

## Files to Create/Modify
- `src/tools/mod/get-mod-notes.ts` -- tool implementation
- `src/reddit/rate-limiter.ts` -- add per-endpoint rate limit support (modify existing)
