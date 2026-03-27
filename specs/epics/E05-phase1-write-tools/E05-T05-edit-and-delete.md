# E05-T05: `edit_text` and `delete_content` Tools

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03 |

## Description
Edit self-post body or comment text (`POST /api/editusertext`). Delete own post or comment (`POST /api/del`).

## Acceptance Criteria
1. Edit replaces body text with content validation
2. Edit preserves bot footer
3. Delete removes own content
4. Both require `edit` scope
5. Error on attempting to edit/delete others' content

## Definition of Ready
- [ ] E03 (Authentication System) is Done -- Tier 3 auth guard available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.3 (body 40K limit for self-posts, 10K for comments)
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.2 (response format inconsistencies: `{"json": {"data": {...}}}`)
- [ ] Research read: research/07-api-edge-cases-and-gotchas.md section 3 (HTTP status surprises, error format variations)
- [ ] Understand `POST /api/editusertext` endpoint: requires `edit` OAuth scope, edits body of self-posts and comments
- [ ] Understand `POST /api/del` endpoint: requires `edit` scope, permanent deletion, cannot be undone
- [ ] Understand that Reddit API does not distinguish "not your content" from other errors -- returns generic error
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] `edit_text` replaces body text with content validation applied (<=40K for posts, <=10K for comments)
- [ ] `edit_text` re-appends bot footer after the new body text (preserves bot disclosure)
- [ ] `delete_content` permanently removes own post or comment
- [ ] Both require Tier 3 auth (full user OAuth) with `edit` scope -- auth guard rejects anon/app-only
- [ ] Graceful error on attempting to edit/delete others' content
- [ ] Safety layer enforced before API call on edit operations
- [ ] Zod schemas validate params with descriptions: fullname (t1_/t3_ prefix), new body text
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope
Editing titles (Reddit doesn't allow this).

## Implementation Notes
- Reddit returns `{"json": {"data": {...}}}` on success
- "Preserves bot footer" means: when editing, re-append the footer after the new body text
- Reddit API does not tell you if content belongs to someone else -- you'll get a generic error
- Delete is permanent and cannot be undone

## Files to Create/Modify
- `src/tools/write/edit-text.ts` -- edit tool implementation
- `src/tools/write/delete-content.ts` -- delete tool implementation
