# E05-T03: `create_post` Tool

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | L |
| **Dependencies** | E05-T01, E05-T02, E03 |

## Description
Submit text or link post. Params: `subreddit`, `title`, `text` (self), `url` (link), `flair_id` (optional), `nsfw` (optional), `spoiler` (optional). Uses `POST /api/submit`.

## Acceptance Criteria
1. Text post created with content validation applied
2. Link post created with URL
3. Bot footer appended to text posts
4. Duplicate detection active
5. Returns post fullname and URL on success
6. Handles Reddit errors (rate limit, subreddit restrictions, banned)

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 8; research/08-reddit-content-formatting.md; research/07-api-edge-cases-and-gotchas.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Image/video/gallery/poll posts (Phase 2).

## Implementation Notes
- `kind` param: `self` for text, `link` for URL
- Response is in wrapped JSON format: `{"json": {"data": {...}}}`
- Bot footer should NOT be appended to link posts (no body text)
- Flair requires the subreddit to have flairs enabled

## Files to Create/Modify
- `src/tools/write/create-post.ts` -- tool implementation
