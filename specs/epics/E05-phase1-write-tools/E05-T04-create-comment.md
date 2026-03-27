# E05-T04: `create_comment` and `reply_message` Tools

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E05-T01, E05-T02, E03 |

## Description
Reply to post or comment. Reply to private message. Both use `POST /api/comment`.

## Acceptance Criteria
1. Comment on post by fullname (t3_xxx)
2. Reply to comment by fullname (t1_xxx)
3. Bot footer appended
4. Content length validated (10K max)
5. `reply_message` uses `privatemessages` scope
6. Returns comment/reply fullname

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 8; research/08-reddit-content-formatting.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Rich text / RTJSON format.

## Implementation Notes
- Both `create_comment` and `reply_message` use the same endpoint (`POST /api/comment`) but different parent types
- Parent fullname determines whether it's a comment on a post (t3_), reply to comment (t1_), or message reply (t4_)
- The 10K limit applies to comment body text (before footer is appended)

## Files to Create/Modify
- `src/tools/write/create-comment.ts` -- comment tool implementation
- `src/tools/write/reply-message.ts` -- message reply tool implementation
