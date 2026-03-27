# E02-T06: Integrate Rate Limiter into HTTP Client

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02-T01, E02-T02, E02-T03 |

## Description
Wire `RedditRateLimiter` into `RedditClient`. Every request calls `acquire()` before sending and `updateFromHeaders()` after receiving. Surface warnings in responses.

## Acceptance Criteria
1. Client calls `acquire()` before each request
2. Client calls `updateFromHeaders()` after each response
3. When remaining < 10, warning string appended to tool results
4. Integration test with mocked fetch verifies full flow

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 4 (rate limiting strategy)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Auth header injection (E03-T07).

## Implementation Notes
- Error parsing (E02-T03) also runs after each response
- The flow is: acquire() -> fetch() -> updateFromHeaders() -> parseErrors() -> return
- Warning about low remaining tokens should be a string that tools can append to their MCP response
- This is the integration point that ties T01, T02, and T03 together

## Files to Create/Modify
- `src/reddit/client.ts` — modify to integrate rate limiter and error parser
- `src/__tests__/reddit/client-integration.test.ts` — integration test with mocked fetch
