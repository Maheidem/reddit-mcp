# E05-T01: Safety Layer -- Content Validation

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02 |

## Description
Build `src/utils/safety.ts`: validate content lengths (title<=300, body<=40K, comment<=10K, message<=10K). Count Unicode characters not bytes. Validate title non-empty. Check for Snudown-incompatible markdown.

## Acceptance Criteria
1. Rejects title > 300 chars with specific error
2. Rejects body > 40,000 chars with specific error
3. Counts Unicode chars correctly (emoji = 1 char, not 2+ bytes)
4. Returns specific error identifying which limit was exceeded
5. Unit tests cover boundary cases (exactly at limit, 1 over)

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL sections 8, 4.4; research/08-reddit-content-formatting.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Markdown rendering or preview.

## Implementation Notes
- Premium users get 80K body limit, but validate at 40K (standard) by default
- Use `[...str].length` or `Array.from(str).length` for proper Unicode char counting (not `str.length` which counts UTF-16 code units)
- Provide distinct error messages per field so callers know exactly which limit was exceeded

## Files to Create/Modify
- `src/utils/safety.ts` -- content validation functions
