# E06-T03: `ban_user` Tool

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Ban user from subreddit. Params: `subreddit`, `username`, `duration` (days, 0=permanent), `reason` (mod note), `message` (sent to user). Uses `POST /r/{sub}/api/friend` with `type=banned`.

## Acceptance Criteria
1. Temporary ban with duration (1-999 days)
2. Permanent ban (duration=0 or omitted)
3. Ban message sent to user
4. Mod note attached to ban
5. Requires `modcontributors` scope
6. Error on invalid duration or already-banned user

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
Unban (Phase 3), mute (Phase 3).

## Implementation Notes
- Reddit's relationship API (`/api/friend`) is used for bans, mutes, contributors -- `type` parameter distinguishes them
- Duration of 0 or omitted means permanent ban
- Duration must be 1-999 for temporary bans
- The `note` field (mod note) is only visible to other mods
- The `ban_message` field is sent to the banned user via PM

## Files to Create/Modify
- `src/tools/mod/ban-user.ts` -- tool implementation
