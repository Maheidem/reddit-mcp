# E02-T02: Token Bucket Rate Limiter

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Epic**         | [E02 — Core Infrastructure](EPIC.md) |
| **Status**       | Done                                 |
| **Size**         | M                                    |
| **Dependencies** | E01-T05                              |

## Description

Build `src/reddit/rate-limiter.ts`: token bucket with 100 QPM capacity, refill rate of 100/600 tokens/sec (10-min rolling window). Read and respect `X-Ratelimit-*` headers. Emit warning when under 10 tokens.

## Acceptance Criteria

1. `acquire()` blocks when tokens exhausted, resolves when refilled
2. `updateFromHeaders()` syncs state to Reddit's rate limit headers
3. Unit test verifies blocking behavior with mocked time
4. Special 30 QPM limit configurable for mod notes endpoint

## Definition of Ready

- [ ] Dependency: E01-T05 (Configure Test Infrastructure) is Done -- vitest must be available for writing rate limiter tests with mocked time
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 4.1 -- Rate Limit Rules (100 QPM per OAuth client ID, 10-min rolling window, 30 QPM for mod notes)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 4.2 -- Rate Limit Headers (`X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 4.3 -- Token Bucket Implementation (reference code with refill rate, acquire method, pre-emptive warning)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 1 -- Rate Limit Clarification (100 QPM is current, 60 RPM is outdated; rolling 10-min window allows bursting)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 6 -- Rate Limiting Propagation (token bucket code, header sync, pre-emptive warning pattern)
- [ ] Understand: Always read `X-Ratelimit-Remaining` from response headers rather than hardcoding assumptions
- [ ] Understand: Mod notes endpoint has a separate 30 QPM limit -- capacity must be configurable per-endpoint
- [ ] Understand: When remaining < 10, emit a warning string that tools can append to MCP responses
- [ ] ACs reviewed: 4 acceptance criteria covering blocking, header sync, mocked-time tests, configurable limit

## Definition of Done

- [ ] AC1: `acquire()` blocks (returns a Promise) when tokens exhausted, resolves when tokens refill
- [ ] AC2: `updateFromHeaders()` syncs internal state to Reddit's `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` headers
- [ ] AC3: Unit test verifies blocking behavior using `vi.useFakeTimers()` / mocked time
- [ ] AC4: Constructor accepts configurable capacity (default 100 QPM, 30 QPM for mod notes)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: token consumption, token refill over time, blocking when exhausted, header-based state sync, pre-emptive warning at < 10 remaining, configurable capacity
- [ ] Exported from `src/reddit/index.ts` barrel file
- [ ] TSDoc on `TokenBucketRateLimiter` class and public methods (`acquire`, `updateFromHeaders`, `remaining`)
- [ ] No lint warnings introduced

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
