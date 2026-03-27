# E06-T04: `get_mod_log` Tool

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Epic**         | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status**       | Done                                       |
| **Size**         | M                                          |
| **Dependencies** | E02, E03                                   |

## Description

Get moderation action history. Params: `subreddit`, `mod` (filter by moderator), `type` (43 action types), `limit`, `after`. Uses `GET /r/{sub}/about/log`.

## Acceptance Criteria

1. Returns mod actions with timestamps, moderator, target, details
2. Filters by action type (e.g., `banuser`, `removelink`, `approvecomment`)
3. Filters by moderator username
4. Pagination works
5. Requires `modlog` scope

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done -- HTTP client and rate limiter available
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard with scope checking available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 9.2 (Mod Log: `GET /r/{sub}/about/log` -- 43 action types)
- [ ] Research read: research/05-reddit-moderation-apis.md section 9 (Mod Log -- endpoint, filter params, 43+ action types with categories, mod log entry object structure, 90-day data retention)
- [ ] Research read: research/05-reddit-moderation-apis.md section 16 (OAuth Scopes -- `modlog` required)
- [ ] Understand mod log entry fields: `id`, `created_utc`, `mod`, `action`, `target_fullname`, `target_author`, `details`, `description`
- [ ] Understand 43 action type categories: content (15), user management (8), moderator management (5), settings (1), wiki (7), rules (3)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] Returns mod actions with timestamps, moderator username, target, and details
- [ ] Filters by action type (e.g., `banuser`, `removelink`, `approvecomment`) validated against known action types
- [ ] Filters by moderator username via `mod` parameter
- [ ] Pagination works via `after`/`before` cursors with configurable `limit` (max 500)
- [ ] Requires Tier 3 auth with `modlog` scope -- auth guard validates mod scope
- [ ] Proper error for non-mods: clear message when user lacks moderator permissions
- [ ] `raw_json=1` parameter included on GET request
- [ ] Zod schema validates params with descriptions: `subreddit`, `mod`, `type`, `limit`, `after`
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope

Aggregated mod stats.

## Implementation Notes

- 43 action types exist. Common ones: `banuser`, `unbanuser`, `removelink`, `removecomment`, `approvelink`, `approvecomment`, `spamlink`, `spamcomment`
- Response is a standard listing with mod action objects
- Each action includes: `id`, `created_utc`, `mod`, `action`, `target_fullname`, `target_author`, `details`, `description`

## Files to Create/Modify

- `src/tools/mod/get-mod-log.ts` -- tool implementation
