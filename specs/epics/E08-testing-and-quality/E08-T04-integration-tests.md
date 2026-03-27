# E08-T04: Integration Tests -- Tool Round-Trips via InMemoryTransport

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | L |
| **Dependencies** | E04, E05, E06 |

## Description
For each tool category (read, write, mod), create integration tests using real `McpServer` with `InMemoryTransport` and mocked `RedditClient`. Verify full flow: tool call -> validation -> API call -> response formatting.

## Acceptance Criteria
1. At least 1 integration test per tool (25 minimum)
2. Tests use `InMemoryTransport` (no network)
3. Tests verify Zod schema validation rejects bad inputs
4. Tests verify error responses use `isError: true`

## Definition of Ready
- [ ] E04 (Read Tools), E05 (Write Tools), and E06 (Mod Tools) are all Done -- all 25 tools implemented
- [ ] research/09-typescript-mcp-sdk-deep-dive.md InMemoryTransport section read: setup pattern for McpServer + InMemoryTransport
- [ ] FINAL section 7.4 read: testing strategy with InMemoryTransport for CI-friendly integration tests
- [ ] Understand test helper pattern: shared setup of McpServer + InMemoryTransport + mocked RedditClient
- [ ] Zod schema validation error format understood (for testing invalid input rejection)
- [ ] MCP `isError: true` error response format understood (FINAL section 7.3)

## Definition of Done
- [ ] At least 1 integration test per tool (25 minimum across read, write, and mod categories)
- [ ] All tests use `InMemoryTransport` -- zero network calls, no real Reddit API interaction
- [ ] Shared test helper (`tests/helpers/test-server.ts`) sets up McpServer + InMemoryTransport + mocked client
- [ ] Tests verify full tool round-trip: construct args -> send via transport -> validate response shape
- [ ] Tests verify Zod schema validation rejects bad inputs with meaningful error messages
- [ ] Tests verify error responses use `isError: true` for recoverable errors
- [ ] Both success and error paths tested for each tool category
- [ ] Mock Reddit API responses are realistic (match actual Reddit response shapes)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope
Real Reddit API calls.

## Implementation Notes
- Create a test helper that sets up `McpServer` + `InMemoryTransport` + mocked client
- The helper should be reusable across all integration test files
- Each test: construct tool call args -> send via transport -> verify response shape
- Test both success and error paths for each tool
- Zod validation tests: send invalid params and verify the error message

## Files to Create/Modify
- `tests/helpers/test-server.ts` -- shared test helper for McpServer + InMemoryTransport setup
- `tests/integration/read-tools.test.ts` -- read tool integration tests
- `tests/integration/write-tools.test.ts` -- write tool integration tests
- `tests/integration/mod-tools.test.ts` -- mod tool integration tests
