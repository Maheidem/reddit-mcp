# E06-T01: `get_modqueue` Tool

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Epic**         | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status**       | Done                                       |
| **Size**         | M                                          |
| **Dependencies** | E02, E03                                   |

## Description

List items needing mod review (reported + spam-filtered). Params: `subreddit`, `type` (links/comments/all), `limit`, `after`. Uses `GET /r/{sub}/about/modqueue`.

## Acceptance Criteria

1. Returns list of items pending review with report reasons
2. Filters by type (links vs comments vs all)
3. Pagination via `after` cursor works
4. Requires `modposts` + `read` scopes
5. Clear error when user is not a mod of the subreddit

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done -- HTTP client, rate limiter, and error parser available
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard with scope checking available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 9.2 (Modqueue: `GET /r/{sub}/about/modqueue` -- reported + spam-filtered items)
- [ ] Research read: research/05-reddit-moderation-apis.md section 3 (Mod Queue -- 5 queue endpoints, parameters, response format with `num_reports`, `mod_reports`, `user_reports`)
- [ ] Research read: research/05-reddit-moderation-apis.md section 16 (OAuth Scopes -- `modposts` + `read` required for modqueue)
- [ ] Understand modqueue response format: standard Reddit listing with `data.children[]`, includes report fields
- [ ] Understand non-mod behavior: 403 response when user is not a moderator of the subreddit
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] Returns list of modqueue items with report reasons (`num_reports`, `mod_reports`, `user_reports`)
- [ ] Filters by type: `links` (posts only), `comments` (comments only), or all (default)
- [ ] Pagination via `after` cursor works correctly with standard listing format
- [ ] Requires Tier 3 auth with `modposts` + `read` scopes -- auth guard validates mod scope
- [ ] Clear error message when user is not a moderator: "you are not a moderator of this subreddit" (detected from 403)
- [ ] Zod schema validates params with descriptions: `subreddit`, `type`, `limit`, `after`
- [ ] `raw_json=1` parameter included on GET request
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope

Batch actions on modqueue items.

## Implementation Notes

- Non-mods get 403 -- detect and return a clear "you are not a moderator of this subreddit" error
- Items include both reported and auto-filtered content
- Response is a standard Reddit listing with `data.children[]`
- Each item includes `num_reports`, `report_reasons`, `mod_reports`, `user_reports`

## Files to Create/Modify

- `src/tools/mod/get-modqueue.ts` -- tool implementation
