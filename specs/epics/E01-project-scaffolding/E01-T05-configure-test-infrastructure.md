# E01-T05: Configure Test Infrastructure

| Field | Value |
|-------|-------|
| **Epic** | [E01 — Project Scaffolding](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E01-T03 |

## Description
Set up vitest with TypeScript support. Create first test using `InMemoryTransport` to call the `reddit_ping` tool.

## Acceptance Criteria
1. `npm test` runs and passes
2. Test creates an in-memory MCP client, connects, calls `reddit_ping`, asserts on the response
3. Test uses vitest `describe`/`it`/`expect`

## Definition of Ready
- [ ] Dependency: E01-T03 (Wire STDIO Transport) is Done -- `McpServer` with `reddit_ping` tool must exist to write a test against
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 7 -- Testing Patterns (testing pyramid, `InMemoryTransport` pattern, mocking, CLI testing)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 2 -- Server Construction Patterns (understand `McpServer` API used in test setup)
- [ ] Understand: `InMemoryTransport` from `@modelcontextprotocol/sdk/inMemory.js` creates linked client/server pair for in-process testing
- [ ] Understand: `Client` from `@modelcontextprotocol/sdk/client/index.js` is used to call tools in tests
- [ ] Understand: This test pattern (InMemoryTransport + Client) becomes the template for all future tool tests
- [ ] ACs reviewed: 3 acceptance criteria covering npm test, in-memory client test, vitest usage

## Definition of Done
- [ ] AC1: `npm test` runs vitest and passes
- [ ] AC2: Test creates an in-memory MCP client via `InMemoryTransport.createLinkedPair()`, connects, calls `reddit_ping`, asserts on the response
- [ ] AC3: Test uses vitest `describe`/`it`/`expect` pattern
- [ ] `vitest.config.ts` created with TypeScript support enabled
- [ ] `package.json` has `"test"` script pointing to vitest
- [ ] Test file located at `src/__tests__/server.test.ts`
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No lint warnings introduced
- [ ] Test establishes the reusable pattern for all future MCP tool tests

## Out of Scope
Integration or E2E test patterns (those come in E08).

## Implementation Notes
- `InMemoryTransport` from `@modelcontextprotocol/sdk/inMemory.js`
- This establishes the test pattern all future tool tests will follow
- vitest config should support TypeScript natively (no separate ts-jest needed)

## Files to Create/Modify
- `vitest.config.ts` — vitest configuration
- `src/__tests__/server.test.ts` — first test using InMemoryTransport
- `package.json` — add `test` script
