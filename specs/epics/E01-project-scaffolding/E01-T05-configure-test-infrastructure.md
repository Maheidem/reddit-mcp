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
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (testing section)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
