# E06-T04: `get_mod_log` Tool

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Get moderation action history. Params: `subreddit`, `mod` (filter by moderator), `type` (43 action types), `limit`, `after`. Uses `GET /r/{sub}/about/log`.

## Acceptance Criteria
1. Returns mod actions with timestamps, moderator, target, details
2. Filters by action type (e.g., `banuser`, `removelink`, `approvecomment`)
3. Filters by moderator username
4. Pagination works
5. Requires `modlog` scope

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
Aggregated mod stats.

## Implementation Notes
- 43 action types exist. Common ones: `banuser`, `unbanuser`, `removelink`, `removecomment`, `approvelink`, `approvecomment`, `spamlink`, `spamcomment`
- Response is a standard listing with mod action objects
- Each action includes: `id`, `created_utc`, `mod`, `action`, `target_fullname`, `target_author`, `details`, `description`

## Files to Create/Modify
- `src/tools/mod/get-mod-log.ts` -- tool implementation
