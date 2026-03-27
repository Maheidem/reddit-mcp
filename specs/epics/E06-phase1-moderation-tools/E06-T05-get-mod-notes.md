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
- [ ] E02 (Core Infrastructure) is Done -- HTTP client and rate limiter available (rate limiter must support per-endpoint overrides)
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard with scope checking available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 9.3 (Mod Notes Detail -- `GET /api/mod/notes`, 30 QPM special rate limit, 250 char max, 8 label types)
- [ ] Research read: research/05-reddit-moderation-apis.md section 10 (User Notes / Mod Notes -- GET/POST/DELETE endpoints, note labels, constraints: 250 chars, 1000 notes per user per subreddit, 30 QPM)
- [ ] Research read: research/05-reddit-moderation-apis.md section 16 (OAuth Scopes -- `modnote` required, requires "Manage Users" moderator permission)
- [ ] Understand special rate limit: 30 QPM for mod notes endpoint (vs. standard 100 QPM) -- requires per-endpoint limiter configuration in E02-T02
- [ ] Understand note labels enum: BOT_BAN, PERMA_BAN, BAN, ABUSE_WARNING, SPAM_WARNING, SPAM_WATCH, SOLID_CONTRIBUTOR, HELPFUL_USER
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] Returns mod notes for user+subreddit pair with note text, label, timestamp, and linked content
- [ ] Rate limiter enforces 30 QPM for this endpoint (not the standard 100 QPM)
- [ ] Note labels correctly parsed and validated against known enum values (BOT_BAN, PERMA_BAN, BAN, ABUSE_WARNING, SPAM_WARNING, SPAM_WATCH, SOLID_CONTRIBUTOR, HELPFUL_USER)
- [ ] Requires Tier 3 auth with `modnote` scope -- auth guard validates mod scope
- [ ] Pagination supported via `before` cursor
- [ ] Proper error for non-mods: clear message when user lacks moderator permissions or "Manage Users" permission
- [ ] `raw_json=1` parameter included on GET request
- [ ] Zod schema validates params with descriptions: `subreddit`, `user`, `filter`, `before`
- [ ] Per-endpoint rate limit override configured in rate limiter (modify `src/reddit/rate-limiter.ts`)
- [ ] `tsc --noEmit` passes
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
