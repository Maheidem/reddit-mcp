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
- [ ] E02 (Core Infrastructure) is Done -- HTTP client and error parser available
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard with scope checking available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 9.4 (Ban/Mute System -- relationship-based `/api/friend`, temp 1-999 days, permanent)
- [ ] Research read: research/05-reddit-moderation-apis.md section 5.1 (Adding Relationships -- `POST /r/{sub}/api/friend` with `type=banned`, parameters: `name`, `duration`, `ban_reason`, `ban_message`, `note`, `ban_context`)
- [ ] Research read: research/05-reddit-moderation-apis.md section 5.3 (Relationship Types -- `banned` type uses `modcontributors` scope)
- [ ] Research read: research/05-reddit-moderation-apis.md section 16 (OAuth Scopes -- `modcontributors` required for ban operations)
- [ ] Understand duration semantics: 0 or omitted = permanent, 1-999 = temporary ban in days
- [ ] Understand field visibility: `ban_reason`/`note` is mod-only, `ban_message` is sent to user via PM

## Definition of Done
- [ ] Temporary ban works with duration 1-999 days
- [ ] Permanent ban works with duration=0 or omitted
- [ ] Ban message sent to user (via `ban_message` parameter)
- [ ] Mod note attached to ban (via `note` parameter, visible only to other mods)
- [ ] Requires Tier 3 auth with `modcontributors` scope -- auth guard validates mod scope
- [ ] Error on invalid duration (negative, >999) with descriptive message
- [ ] Proper error for non-mods or already-banned user
- [ ] Zod schema validates params with descriptions: `subreddit`, `username`, `duration`, `reason`, `message`
- [ ] `api_type=json` included on POST request
- [ ] `tsc --noEmit` passes
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
