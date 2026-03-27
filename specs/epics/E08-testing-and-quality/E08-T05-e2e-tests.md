# E08-T05: E2E Tests -- Subprocess Transport

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | L |
| **Dependencies** | E08-T04 |

## Description
Spawn server as subprocess, connect via STDIO, call 3 tools (1 read, 1 write, 1 mod), verify responses. Uses mocked Reddit API (env var to enable test mode).

## Acceptance Criteria
1. Server starts as subprocess via `node dist/index.js`
2. MCP client connects via STDIO transport
3. Tool calls succeed and return expected data
4. Server shuts down cleanly (no zombie processes)
5. Runs in CI without real Reddit credentials

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (subprocess transport)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Real Reddit API calls, performance testing.

## Implementation Notes
- Use `SubprocessTransport` or spawn directly with `child_process`
- Set env var (e.g., `REDDIT_MCP_TEST_MODE=true`) to enable mock responses
- Test the full lifecycle: spawn -> initialize -> list_tools -> call_tool -> shutdown
- Ensure subprocess cleanup in test teardown (kill on timeout, handle SIGTERM)
- Build step (`tsc`) must run before E2E tests since they use `dist/`

## Files to Create/Modify
- `tests/e2e/subprocess.test.ts` -- E2E subprocess tests
- `src/test-mode.ts` -- test mode detection and mock response injection (if not already exists)
