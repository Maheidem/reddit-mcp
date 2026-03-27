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
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (InMemoryTransport section)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
