# E08-T01: Unit Tests -- Reddit Client, Rate Limiter, Error Parser

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E08 -- Testing and Quality](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | M                                     |
| **Dependencies** | E02                                   |

## Description

Full unit test suite for `src/reddit/client.ts`, `rate-limiter.ts`, `errors.ts`. Mock `fetch`. Test all 4 error formats. Test token bucket math.

## Acceptance Criteria

1. Client tests verify headers, URL construction, `raw_json=1` injection
2. Rate limiter tests verify blocking, refill math, header sync
3. Error parser tests cover all 4 Reddit error formats
4. 90%+ branch coverage on these 3 files

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done: `client.ts`, `rate-limiter.ts`, `errors.ts` exist and are stable
- [ ] FINAL section 7.3 read: all 4 Reddit error formats understood (HTTP error, JSON errors, jQuery callback, empty success)
- [ ] FINAL section 7.4 read: testing strategy with vitest + mocked fetch
- [ ] Vitest mocking patterns understood: `vi.fn()` for fetch, `vi.useFakeTimers()` for timing
- [ ] Token bucket rate limiter internals understood: refill rate, burst capacity, header sync with `X-Ratelimit-*`
- [ ] `raw_json=1` GET injection and `api_type=json` POST injection behavior understood

## Definition of Done

- [ ] Client tests verify: correct headers (`User-Agent`, `Authorization`), URL construction, `raw_json=1` injection on GET, `api_type=json` on POST
- [ ] Rate limiter tests verify: token consumption, blocking when exhausted, refill math with fake timers, header sync from Reddit's `X-Ratelimit-*` response headers
- [ ] Error parser tests cover all 4 Reddit error formats: `{"message":"Forbidden","error":403}`, `{"json":{"errors":[...]}}`, jQuery callback format, empty success `{}`
- [ ] 90%+ branch coverage on `client.ts`, `rate-limiter.ts`, and `errors.ts`
- [ ] All mocks are realistic (mock responses match actual Reddit API response shapes)
- [ ] No flaky tests -- timing tests use `vi.useFakeTimers()`, not real delays
- [ ] Tests run in under 5 seconds total
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

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
