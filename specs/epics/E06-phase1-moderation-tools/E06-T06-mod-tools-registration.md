# E06-T06: Mod Tools Registration and Integration

| Field | Value |
|-------|-------|
| **Epic** | [E06 -- Phase 1 Moderation Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E06-T01, E06-T02, E06-T03, E06-T04, E06-T05 |

## Description
Register all 6 mod tools. Wire auth guards requiring `user` tier. Integration tests verifying scope requirements.

## Acceptance Criteria
1. All 6 tools listed by MCP Inspector
2. Auth guard rejects all when not Tier 3
3. Scope errors are specific ("requires modposts scope")
4. Tool descriptions explicitly mention mod-only access

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
Phase 2/3 mod tools.

## Implementation Notes
- These 6 tools are our biggest competitive advantage -- zero other MCP servers have them
- Tool descriptions should make it clear these require moderator permissions
- Auth guard pattern should mirror whatever was established in E05-T07 for write tools
- Each tool should declare its required scopes so the auth guard can check them

## Files to Create/Modify
- `src/tools/mod/index.ts` -- barrel file registering all mod tools
- `src/server.ts` -- wire mod tools into server (modify existing)
