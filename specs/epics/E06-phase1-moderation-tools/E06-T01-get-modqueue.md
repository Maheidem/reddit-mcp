# E06-T01: `get_modqueue` Tool

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
List items needing mod review (reported + spam-filtered). Params: `subreddit`, `type` (links/comments/all), `limit`, `after`. Uses `GET /r/{sub}/about/modqueue`.

## Acceptance Criteria
1. Returns list of items pending review with report reasons
2. Filters by type (links vs comments vs all)
3. Pagination via `after` cursor works
4. Requires `modposts` + `read` scopes
5. Clear error when user is not a mod of the subreddit

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
Batch actions on modqueue items.

## Implementation Notes
- Non-mods get 403 -- detect and return a clear "you are not a moderator of this subreddit" error
- Items include both reported and auto-filtered content
- Response is a standard Reddit listing with `data.children[]`
- Each item includes `num_reports`, `report_reasons`, `mod_reports`, `user_reports`

## Files to Create/Modify
- `src/tools/mod/get-modqueue.ts` -- tool implementation
