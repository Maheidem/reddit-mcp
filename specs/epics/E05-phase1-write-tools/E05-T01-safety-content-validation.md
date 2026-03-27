# E05-T01: Safety Layer -- Content Validation

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | M                                     |
| **Dependencies** | E02                                   |

## Description

Build `src/utils/safety.ts`: validate content lengths (title<=300, body<=40K, comment<=10K, message<=10K). Count Unicode characters not bytes. Validate title non-empty. Check for Snudown-incompatible markdown.

## Acceptance Criteria

1. Rejects title > 300 chars with specific error
2. Rejects body > 40,000 chars with specific error
3. Counts Unicode chars correctly (emoji = 1 char, not 2+ bytes)
4. Returns specific error identifying which limit was exceeded
5. Unit tests cover boundary cases (exactly at limit, 1 over)

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done -- HTTP client and error types available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.3 (Content Length Limits -- title 300, body 40K/80K premium, comment 10K, message 10K, flair 64)
- [ ] Research read: research/08-reddit-content-formatting.md section 4 (Complete Character Limit Reference, API validation behavior, content rendering limits)
- [ ] Research read: research/08-reddit-content-formatting.md section 7.2 (Content Validation Checklist -- pre-submission validation rules)
- [ ] Understand Unicode char counting: `[...str].length` or `Array.from(str).length` vs `str.length` (UTF-16 code units)
- [ ] Understand Reddit API validation behavior: HTTP 200 with JSON error body containing `["TOO_LONG", "this is too long (max: 300)", "title"]`
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] `validateTitle()` rejects titles > 300 chars and empty titles with specific error messages
- [ ] `validateBody()` rejects bodies > 40,000 chars (standard) with specific error; supports optional premium flag for 80K limit
- [ ] `validateComment()` rejects comments > 10,000 chars with specific error
- [ ] `validateMessage()` rejects messages > 10,000 chars with specific error
- [ ] Unicode characters counted correctly: emoji counts as 1 char, not 2+ UTF-16 code units
- [ ] Boundary tests pass: exactly at limit (accepted), 1 over limit (rejected), empty string (handled per field)
- [ ] Error messages identify which field exceeded which limit (e.g., "title exceeds 300 character limit (got 305)")
- [ ] Validation functions are injectable/mockable (pure functions, no side effects)
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from `src/utils/safety.ts` barrel

## Out of Scope

Markdown rendering or preview.

## Implementation Notes

- Premium users get 80K body limit, but validate at 40K (standard) by default
- Use `[...str].length` or `Array.from(str).length` for proper Unicode char counting (not `str.length` which counts UTF-16 code units)
- Provide distinct error messages per field so callers know exactly which limit was exceeded

## Files to Create/Modify

- `src/utils/safety.ts` -- content validation functions
