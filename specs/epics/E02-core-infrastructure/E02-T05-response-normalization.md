# E02-T05: Response Normalization Utilities

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02-T04 |

## Description
Build `src/utils/normalize.ts`: decode HTML-encoded URLs, normalize deleted content detection, detect post type from raw response, handle listing pagination.

## Acceptance Criteria
1. `decodeRedditUrl()` handles `&amp;` to `&`
2. `isDeleted()` / `isRemoved()` correctly identify content state
3. `detectPostType()` returns enum from raw post data
4. `extractPagination()` returns `{after, before, count}`

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: research/07-api-edge-cases-and-gotchas.md (URL encoding, deleted content detection)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Full response transformation (tools do their own formatting).

## Implementation Notes
- Deleted = author is `[deleted]` AND body is `[deleted]`
- Removed = body is `[removed]`
- Reddit HTML-encodes URLs in JSON responses; `raw_json=1` mitigates this but some fields still need decoding
- Pagination uses cursor-based `after`/`before` tokens with optional `count`

## Files to Create/Modify
- `src/utils/normalize.ts` — normalization utility functions
- `src/utils/index.ts` — export utilities
- `src/__tests__/utils/normalize.test.ts` — unit tests for all helpers
