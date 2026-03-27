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
- [ ] E05-T03 (`create_post`) is Done
- [ ] E05-T04 (`create_comment` and `reply_message`) is Done
- [ ] E05-T05 (`edit_text` and `delete_content`) is Done
- [ ] E05-T06 (`vote` and `send_message`) is Done
- [ ] Research read: research/09-typescript-mcp-sdk-deep-dive.md (McpServer tool registration, Zod v4 schemas, tool naming conventions)
- [ ] Research read: research/10-tool-inventory.md Phase 1 Write Tools (7 tools: create_post, create_comment, edit_text, delete_content, vote, send_message, reply_message)
- [ ] Understand registration pattern established in E04-T08 (read tools registration) -- mirror the same approach
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All 7 write tools registered and listed by MCP Inspector: create_post, create_comment, edit_text, delete_content, vote, send_message, reply_message
- [ ] Tool count matches spec: exactly 7 write tools registered
- [ ] Auth guard rejects all 7 write tools when auth tier is anon or app-only (requires Tier 3 user OAuth)
- [ ] Integration test proves validation pipeline: content validation -> auth guard check -> API call -> response
- [ ] Zod schemas have descriptions for all parameters on all 7 tools
- [ ] Tool descriptions clearly distinguish write tools from read tools
- [ ] Barrel file `src/tools/write/index.ts` exports all write tools
- [ ] Server wiring in `src/server.ts` registers write tools
- [ ] `tsc --noEmit` passes
- [ ] No lint warnings introduced

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
