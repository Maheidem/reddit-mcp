# E05-T06: `vote` and `send_message` Tools

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03 |

## Description
Vote (up/down/clear) on post/comment (`POST /api/vote`). Send private message (`POST /api/compose`).

## Acceptance Criteria
1. Vote accepts `dir` as 1, -1, or 0
2. Vote accepts fullname (t1_xxx or t3_xxx)
3. Message validates recipient username exists
4. Message validates subject + body length
5. `vote` scope for voting, `privatemessages` for messaging

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 8; research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
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
