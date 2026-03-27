# E05-T07: Write Tools Registration and Integration Test

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E05-T03, E05-T04, E05-T05, E05-T06 |

## Description
Register all 7 write tools. Wire into server. Integration test verifying validation -> auth guard -> API call -> response.

## Acceptance Criteria
1. All 7 tools listed by MCP Inspector
2. Auth guard rejects all write tools when tier is anon/app-only
3. Integration test proves content validation runs before API call
4. Zod schemas have descriptions for all params

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (tool registration)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
E2E testing (E08).

## Implementation Notes
- Write tools should be clearly distinguishable from read tools in descriptions
- Registration pattern should mirror whatever was established in E04 for read tools
- Auth guard should check for Tier 3 (user OAuth) before allowing any write operation
- Integration test should mock the Reddit API but exercise the full validation -> auth -> call chain

## Files to Create/Modify
- `src/tools/write/index.ts` -- barrel file registering all write tools
- `src/server.ts` -- wire write tools into server (modify existing)
