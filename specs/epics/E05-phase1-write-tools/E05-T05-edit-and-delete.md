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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 8; research/07-api-edge-cases-and-gotchas.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
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
