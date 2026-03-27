# E05-T04: `create_comment` and `reply_message` Tools

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | M                                     |
| **Dependencies** | E05-T01, E05-T02, E03                 |

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

- [ ] E05-T01 (Safety Layer -- Content Validation) is Done -- comment body validation (10K limit) available
- [ ] E05-T02 (Safety Layer -- Bot Disclosure) is Done -- bot footer appending available
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.3 (comment limit: 10,000 chars, message limit: 10,000 chars)
- [ ] Research read: research/08-reddit-content-formatting.md section 4.1 (comment char limit, validation behavior)
- [ ] Understand `POST /api/comment` endpoint: parent fullname determines type -- t3* (post), t1* (comment reply), t4\_ (message reply)
- [ ] Understand scopes: `submit` for comments, `privatemessages` for message replies
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] `create_comment` comments on post (t3_xxx parent) and replies to comment (t1_xxx parent)
- [ ] `reply_message` replies to private message (t4_xxx parent) using `privatemessages` scope
- [ ] Safety layer enforced before API call: body validated (<=10K chars)
- [ ] Bot disclosure footer appended to all comment and reply content
- [ ] Requires Tier 3 auth (full user OAuth) -- auth guard rejects anon/app-only
- [ ] Returns comment/reply fullname on success
- [ ] Zod schemas validate all params with descriptions for both tools
- [ ] Handles Reddit API errors: wrapped JSON format, rate limits, archived posts
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope

Rich text / RTJSON format.

## Implementation Notes

- Both `create_comment` and `reply_message` use the same endpoint (`POST /api/comment`) but different parent types
- Parent fullname determines whether it's a comment on a post (t3*), reply to comment (t1*), or message reply (t4\_)
- The 10K limit applies to comment body text (before footer is appended)

## Files to Create/Modify

- `src/tools/write/create-comment.ts` -- comment tool implementation
- `src/tools/write/reply-message.ts` -- message reply tool implementation
