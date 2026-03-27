# E05-T06: `vote` and `send_message` Tools

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | M                                     |
| **Dependencies** | E03                                   |

## Description

Vote (up/down/clear) on post/comment (`POST /api/vote`). Send private message (`POST /api/compose`).

## Acceptance Criteria

1. Vote accepts `dir` as 1, -1, or 0
2. Vote accepts fullname (t1_xxx or t3_xxx)
3. Message validates recipient username exists
4. Message validates subject + body length
5. `vote` scope for voting, `privatemessages` for messaging

## Definition of Ready

- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.3 (message body limit: 10,000 chars)
- [ ] Research read: research/10-tool-inventory.md Phase 1 Write Tools (#17 `vote` -- `vote` scope, #18 `send_message` -- `privatemessages` scope)
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.8 (vote fuzzing behavior -- `ups`/`downs` never exact)
- [ ] Understand `POST /api/vote` endpoint: `dir` = 1 (up), -1 (down), 0 (clear); returns empty `{}` on success; requires `vote` scope
- [ ] Understand `POST /api/compose` endpoint: sends PM; requires `privatemessages` scope; subject max 100 chars, body max 10K chars
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] `vote` accepts `dir` as 1, -1, or 0 and a fullname (t1_xxx or t3_xxx)
- [ ] `send_message` validates recipient username format, subject (<=100 chars), and body (<=10K chars)
- [ ] Safety layer enforced on `send_message`: body content validated, bot footer appended
- [ ] Both require Tier 3 auth (full user OAuth) -- `vote` scope for voting, `privatemessages` scope for messaging
- [ ] Auth guard rejects anon/app-only for both tools
- [ ] Zod schemas validate all params with descriptions for both tools
- [ ] Handles Reddit API errors: rate limits, invalid fullname, user not found, blocked user
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope

Bulk voting, message threads.

## Implementation Notes

- Vote response is empty `{}` on success
- `dir` values: 1 = upvote, -1 = downvote, 0 = clear vote
- Message subject max length: 100 chars
- Message body max length: 10K chars
- Recipient validation: check if username is valid format before sending

## Files to Create/Modify

- `src/tools/write/vote.ts` -- vote tool implementation
- `src/tools/write/send-message.ts` -- send message tool implementation
