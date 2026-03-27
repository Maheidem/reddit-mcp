# E06-T02: `approve` and `remove` Tools

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Epic**         | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status**       | Done                                       |
| **Size**         | M                                          |
| **Dependencies** | E02, E03                                   |

## Description

Approve item from modqueue. Remove item with optional `spam` flag. Uses `POST /api/approve` and `POST /api/remove`.

## Acceptance Criteria

1. Approve accepts fullname (t1_xxx or t3_xxx)
2. Remove accepts fullname with optional `spam: true`
3. Both require `modposts` scope
4. Returns confirmation of action taken
5. Handles "already approved/removed" gracefully (not crash)

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done -- HTTP client and error parser available
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard with scope checking available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 9.2 (Approve/Remove: `POST /api/approve`, `POST /api/remove` with spam flag)
- [ ] Research read: research/05-reddit-moderation-apis.md section 1.1 (Core Content Actions -- approve/remove endpoints, parameters, scope `modposts`)
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.2 (response format: both return empty `{}` on success)
- [ ] Understand idempotent behavior: approving already-approved or removing already-removed items is a no-op (not an error)
- [ ] Understand `spam=true` on remove trains Reddit's spam filter for that subreddit
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] `approve` accepts fullname (t1_xxx or t3_xxx) and approves the item from modqueue
- [ ] `remove` accepts fullname with optional `spam: true` flag to train spam filter
- [ ] Both require Tier 3 auth with `modposts` scope -- auth guard validates mod scope
- [ ] Returns confirmation of action taken (success message even though API returns empty `{}`)
- [ ] Handles "already approved/removed" gracefully -- no crash, returns success
- [ ] Proper error for non-mods: clear message when user lacks moderator permissions
- [ ] `api_type=json` included on POST requests
- [ ] Zod schemas validate params with descriptions for both tools
- [ ] `tsc --noEmit` passes
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
