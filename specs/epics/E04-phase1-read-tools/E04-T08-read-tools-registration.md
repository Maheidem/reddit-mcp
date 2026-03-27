# E04-T08: Read Tools Registration and Barrel Export

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E04-T01, E04-T02, E04-T03, E04-T04, E04-T05, E04-T06, E04-T07 |

## Description
Register all 12 read tools in `src/tools/read/index.ts`. Wire into `server.ts`. Verify all appear in MCP Inspector.

## Acceptance Criteria
1. All 12 tools listed by MCP Inspector
2. Tool descriptions are clear and concise (under 200 chars)
3. Zod schemas have proper descriptions for all parameters
4. No duplicate tool names

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (tool registration); research/10-tool-inventory.md (tool names and descriptions)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Write or mod tool registration.

## Implementation Notes
- Tool descriptions are what the LLM reads to decide which tool to use -- make them count
- The 12 tools across T01-T07: search, get_post, get_comments, get_subreddit, get_subreddit_rules, get_subreddit_posts, get_user, get_user_posts, get_user_comments, get_trending, get_wiki_page, get_me
- Registration should use `McpServer.tool()` method
- Consider a `registerReadTools(server)` function that registers all 12 at once

## Files to Create/Modify
- `src/tools/read/index.ts` — barrel export and registerReadTools function
- `src/server.ts` — wire registerReadTools into server setup
- `src/__tests__/tools/read/registration.test.ts` — verify all 12 tools are registered
