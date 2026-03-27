# E08-T01: Unit Tests -- Reddit Client, Rate Limiter, Error Parser

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02 |

## Description
Full unit test suite for `src/reddit/client.ts`, `rate-limiter.ts`, `errors.ts`. Mock `fetch`. Test all 4 error formats. Test token bucket math.

## Acceptance Criteria
1. Client tests verify headers, URL construction, `raw_json=1` injection
2. Rate limiter tests verify blocking, refill math, header sync
3. Error parser tests cover all 4 Reddit error formats
4. 90%+ branch coverage on these 3 files

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 7.4; research/09-typescript-mcp-sdk-deep-dive.md (testing)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Integration-level testing (E08-T04).

## Implementation Notes
- Use `vi.useFakeTimers()` for rate limiter timing tests
- Mock `fetch` with `vi.fn()` for client tests
- The 4 Reddit error formats to test: JSON body errors, HTTP status errors, API errors in `json.errors`, and rate limit errors with `Retry-After` header
- Token bucket math: verify refill rate, burst capacity, and blocking behavior

## Files to Create/Modify
- `tests/unit/reddit/client.test.ts` -- client unit tests
- `tests/unit/reddit/rate-limiter.test.ts` -- rate limiter unit tests
- `tests/unit/reddit/errors.test.ts` -- error parser unit tests
