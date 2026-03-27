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
- [ ] Dependency: E02-T04 (Reddit Thing Types) is Done -- normalization utilities depend on the Thing types for post type detection and pagination
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3.2 -- The `raw_json=1` parameter (some fields still need decoding even with `raw_json=1`)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3.6 -- Deleted/Removed Content (author `"[deleted]"`, body `"[deleted]"` vs `"[removed]"`)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 7.4 -- Field Encoding Gotchas (image URLs contain `&amp;` in `preview`, `media_metadata`, gallery data)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.9 -- Deleted Content Detection (user deleted vs mod removed vs suspended account)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.10 -- Image URL Encoding (`&amp;` to `&` decoding)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 8.1 -- Post Types and Detection (detection logic for post type enum)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 2.3 -- Listings wrap with pagination cursors (`before`/`after`/`count`)
- [ ] Understand: Deleted = author is `"[deleted]"` AND body/selftext is `"[deleted]"`; Removed = body is `"[removed]"`
- [ ] ACs reviewed: 4 acceptance criteria covering URL decode, deleted detection, post type enum, pagination extraction

## Definition of Done
- [ ] AC1: `decodeRedditUrl()` decodes `&amp;` to `&` (and any other HTML entities in URLs)
- [ ] AC2: `isDeleted()` returns true when author is `"[deleted]"` AND body is `"[deleted]"`; `isRemoved()` returns true when body is `"[removed]"`
- [ ] AC3: `detectPostType()` returns a PostType enum value based on raw post data fields (`is_self`, `is_gallery`, `poll_data`, `is_video`, `crosspost_parent`)
- [ ] AC4: `extractPagination()` returns `{after, before, count}` from a Listing response
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: URL decoding with multiple `&amp;` instances, deleted vs removed vs normal content, all post type detection paths, pagination extraction with missing fields
- [ ] Exported from `src/utils/index.ts` barrel file
- [ ] TSDoc on all public utility functions
- [ ] No lint warnings introduced

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
