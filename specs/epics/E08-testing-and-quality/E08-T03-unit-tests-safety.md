# E08-T03: Unit Tests -- Safety Layer

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E05-T01, E05-T02 |

## Description
Test content validation (length limits, Unicode), bot disclosure, duplicate detection.

## Acceptance Criteria
1. Boundary tests at exactly 300/40000/10000 chars (pass) and 301/40001/10001 (fail)
2. Unicode emoji counted as 1 character
3. Bot footer append tested (present, correct format)
4. Duplicate detection hash match tested

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
Snudown rendering tests.

## Implementation Notes
- Use known Unicode strings for character counting tests (e.g., single emoji, ZWJ sequences, CJK characters)
- Test the exact boundary: 300 chars should pass, 301 should fail
- Bot footer test: verify the default footer text and custom footer via env var
- Duplicate detection: submit same title+subreddit twice within window, verify rejection; verify different title passes

## Files to Create/Modify
- `tests/unit/utils/safety.test.ts` -- safety layer unit tests
