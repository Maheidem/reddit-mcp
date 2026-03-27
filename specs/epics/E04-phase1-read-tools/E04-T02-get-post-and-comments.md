# E04-T02: Get Post and Comments Tools

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | L |
| **Dependencies** | E02, E03 |

## Description
Get post by ID with full details. Get comment tree with sort and depth control. Handle the `replies` field quirk. Uses `GET /r/{sub}/comments/{id}`.

## Acceptance Criteria
1. Post retrieved by fullname (`t3_xxx`) or bare ID
2. Comments sorted by best/top/new/controversial/old
3. Depth parameter respected
4. `replies: ""` handled without crash
5. "More" comment stubs indicated in response

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 11; research/07-api-edge-cases-and-gotchas.md (comment tree quirks); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Expanding "more comments" (that's a separate API call, potentially Phase 2).

## Implementation Notes
- API returns a 2-element array: `[post_listing, comment_listing]`
- Comment `replies` field is `""` (empty string) when there are no replies, not null/undefined
- "More" objects have `kind: "more"` and contain a list of comment IDs that weren't fetched
- This is the largest task because it handles the most complex Reddit data structure (nested comment trees)
- Consider separate `get_post` and `get_comments` MCP tools, or a combined tool with options

## Files to Create/Modify
- `src/tools/read/get-post.ts` — get post tool
- `src/tools/read/get-comments.ts` — get comments tool
- `src/tools/read/index.ts` — export both tools
- `src/__tests__/tools/read/get-post.test.ts` — tests with mocked responses
- `src/__tests__/tools/read/get-comments.test.ts` — tests including replies="" edge case
