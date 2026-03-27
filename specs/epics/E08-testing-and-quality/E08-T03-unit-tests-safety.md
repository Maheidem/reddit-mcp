# E08-T03: Unit Tests -- Safety Layer

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E08 -- Testing and Quality](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | S                                     |
| **Dependencies** | E05-T01, E05-T02                      |

## Description

Test content validation (length limits, Unicode), bot disclosure, duplicate detection.

## Acceptance Criteria

1. Boundary tests at exactly 300/40000/10000 chars (pass) and 301/40001/10001 (fail)
2. Unicode emoji counted as 1 character
3. Bot footer append tested (present, correct format)
4. Duplicate detection hash match tested

## Definition of Ready

- [ ] E05-T01 (content validation) and E05-T02 (bot disclosure + duplicate detection) are Done and stable
- [ ] FINAL section 8 read: content length limits (title 300, selftext 40000, comment 10000)
- [ ] research/08-reddit-content-formatting.md read: Unicode handling, Snudown markdown specifics
- [ ] Vitest testing patterns for boundary-value testing understood
- [ ] Bot footer format and custom footer via env var behavior understood

## Definition of Done

- [ ] Boundary tests at exact character limits: 300/40000/10000 chars pass, 301/40001/10001 chars fail
- [ ] Unicode emoji counted correctly as 1 character (test with single emoji, ZWJ sequences, CJK characters)
- [ ] Bot footer tests: default footer text appended, custom footer via env var, footer format correct
- [ ] Duplicate detection tests: same title+subreddit within window rejected, different title passes, expired window allows resubmission
- [ ] Edge cases covered: empty strings, whitespace-only content, null/undefined inputs
- [ ] No flaky tests -- deterministic inputs, no timing dependencies
- [ ] Tests run in under 5 seconds total
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope

Snudown rendering tests.

## Implementation Notes

- Use known Unicode strings for character counting tests (e.g., single emoji, ZWJ sequences, CJK characters)
- Test the exact boundary: 300 chars should pass, 301 should fail
- Bot footer test: verify the default footer text and custom footer via env var
- Duplicate detection: submit same title+subreddit twice within window, verify rejection; verify different title passes

## Files to Create/Modify

- `tests/unit/utils/safety.test.ts` -- safety layer unit tests
