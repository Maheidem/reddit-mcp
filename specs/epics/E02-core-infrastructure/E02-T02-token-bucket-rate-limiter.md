# E02-T02: Token Bucket Rate Limiter

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E01-T05 |

## Description
Build `src/reddit/rate-limiter.ts`: token bucket with 100 QPM capacity, refill rate of 100/600 tokens/sec (10-min rolling window). Read and respect `X-Ratelimit-*` headers. Emit warning when under 10 tokens.

## Acceptance Criteria
1. `acquire()` blocks when tokens exhausted, resolves when refilled
2. `updateFromHeaders()` syncs state to Reddit's rate limit headers
3. Unit test verifies blocking behavior with mocked time
4. Special 30 QPM limit configurable for mod notes endpoint

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 4; research/07-api-edge-cases-and-gotchas.md (rate limiting)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Integration with HTTP client (E02-T06).

## Implementation Notes
- Three Reddit headers: `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`
- Token bucket algorithm: tokens refill at a constant rate, requests consume tokens
- When `remaining < 10`, emit a warning string that can be surfaced in tool results
- Mod notes endpoint has a separate 30 QPM limit; make the capacity configurable per-endpoint

## Files to Create/Modify
- `src/reddit/rate-limiter.ts` — TokenBucketRateLimiter class
- `src/reddit/index.ts` — export rate limiter
- `src/__tests__/reddit/rate-limiter.test.ts` — tests with mocked time
