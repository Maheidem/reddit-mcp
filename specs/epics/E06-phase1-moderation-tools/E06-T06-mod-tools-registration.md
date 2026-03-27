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
- [ ] E06-T01 (`get_modqueue`) is Done
- [ ] E06-T02 (`approve` and `remove`) is Done
- [ ] E06-T03 (`ban_user`) is Done
- [ ] E06-T04 (`get_mod_log`) is Done
- [ ] E06-T05 (`get_mod_notes`) is Done
- [ ] Research read: research/09-typescript-mcp-sdk-deep-dive.md (McpServer tool registration, Zod v4 schemas, tool naming conventions)
- [ ] Research read: research/10-tool-inventory.md Phase 1 Moderation Tools (6 tools: get_modqueue, approve, remove, ban_user, get_mod_log, get_mod_notes)
- [ ] Understand registration pattern established in E04-T08 and E05-T07 -- mirror the same approach

## Definition of Done
- [ ] All 6 mod tools registered and listed by MCP Inspector: get_modqueue, approve, remove, ban_user, get_mod_log, get_mod_notes
- [ ] Tool count matches spec: exactly 6 mod tools registered
- [ ] Auth guard rejects all 6 mod tools when auth tier is not Tier 3 (user OAuth)
- [ ] Scope errors are specific per tool (e.g., "requires modposts scope", "requires modcontributors scope", "requires modlog scope", "requires modnote scope")
- [ ] Tool descriptions explicitly mention mod-only access in every tool's MCP description
- [ ] Integration test verifies scope checking for each distinct required scope (modposts, modcontributors, modlog, modnote)
- [ ] Barrel file `src/tools/mod/index.ts` exports all mod tools
- [ ] Server wiring in `src/server.ts` registers mod tools
- [ ] `tsc --noEmit` passes
- [ ] No lint warnings introduced

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
