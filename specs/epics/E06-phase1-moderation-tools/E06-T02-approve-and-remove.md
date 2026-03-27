# E06-T02: `approve` and `remove` Tools

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Approve item from modqueue. Remove item with optional `spam` flag. Uses `POST /api/approve` and `POST /api/remove`.

## Acceptance Criteria
1. Approve accepts fullname (t1_xxx or t3_xxx)
2. Remove accepts fullname with optional `spam: true`
3. Both require `modposts` scope
4. Returns confirmation of action taken
5. Handles "already approved/removed" gracefully (not crash)

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
Removal reasons (Phase 3).

## Implementation Notes
- Both return empty `{}` on success
- `spam: true` on remove trains Reddit's spam filter for that subreddit
- Approving an already-approved item is a no-op (not an error)
- Removing an already-removed item is also a no-op

## Files to Create/Modify
- `src/tools/mod/approve.ts` -- approve tool implementation
- `src/tools/mod/remove.ts` -- remove tool implementation
