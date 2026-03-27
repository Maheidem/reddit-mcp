# E02-T06: Integrate Rate Limiter into HTTP Client

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Epic**         | [E02 — Core Infrastructure](EPIC.md) |
| **Status**       | Done                                 |
| **Size**         | S                                    |
| **Dependencies** | E02-T01, E02-T02, E02-T03            |

## Description

Wire `RedditRateLimiter` into `RedditClient`. Every request calls `acquire()` before sending and `updateFromHeaders()` after receiving. Surface warnings in responses.

## Acceptance Criteria

1. Client calls `acquire()` before each request
2. Client calls `updateFromHeaders()` after each response
3. When remaining < 10, warning string appended to tool results
4. Integration test with mocked fetch verifies full flow

## Definition of Ready

- [ ] Dependency: E02-T01 (Reddit HTTP Client Foundation) is Done -- `RedditClient` class must exist to wire rate limiter into
- [ ] Dependency: E02-T02 (Token Bucket Rate Limiter) is Done -- `TokenBucketRateLimiter` with `acquire()` and `updateFromHeaders()` must exist
- [ ] Dependency: E02-T03 (Reddit Error Parser) is Done -- `parseRedditResponse()` must exist to run after each response
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 4.3 -- Token Bucket Implementation (full flow: acquire -> fetch -> updateFromHeaders -> parse)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 4.4 -- Safety Layer (pre-emptive warnings at < 10 remaining)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 6 -- Rate Limiting Propagation (communicating rate limits to LLM, pre-emptive warning pattern, header reading)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 10 -- Reddit API Client Skeleton (reference implementation showing full request flow with rate limiter and headers)
- [ ] Understand: The request flow is: `acquire()` -> `fetch()` -> `updateFromHeaders()` -> `parseRedditResponse()` -> return
- [ ] Understand: Warning about low remaining tokens should be a string that tools can append to their MCP response
- [ ] ACs reviewed: 4 acceptance criteria covering acquire before request, updateFromHeaders after response, low-token warning, and integration test

## Definition of Done

- [ ] AC1: Client calls `acquire()` before each HTTP request (blocks if rate limited)
- [ ] AC2: Client calls `updateFromHeaders()` after each response using `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` headers
- [ ] AC3: When remaining < 10, a warning string is available for tools to append to results
- [ ] AC4: Integration test with mocked `fetch` verifies the full flow: acquire -> fetch -> updateFromHeaders -> parseErrors -> return
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Integration test covers: normal request flow, rate limit header propagation, low-token warning generation, error parsing on non-OK responses
- [ ] `RedditClient` public API unchanged (existing tests still pass)
- [ ] No lint warnings introduced

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
