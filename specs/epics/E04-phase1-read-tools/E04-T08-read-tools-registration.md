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
- [ ] E04-T01 (Search Tool) is Done
- [ ] E04-T02 (Get Post and Comments Tools) is Done
- [ ] E04-T03 (Get Subreddit and Rules Tools) is Done
- [ ] E04-T04 (Get Subreddit Posts Tool) is Done
- [ ] E04-T05 (Get User, Posts, and Comments Tools) is Done
- [ ] E04-T06 (Get Trending and Wiki Page Tools) is Done
- [ ] E04-T07 (Get Me Tool) is Done
- [ ] Research read: research/09-typescript-mcp-sdk-deep-dive.md — `McpServer.tool()` registration API, tool listing, high-level vs low-level API
- [ ] Research read: research/10-tool-inventory.md — all 12 tool names, descriptions, and auth levels
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.5 (Naming Convention) — `{action}_{resource}` pattern
- [ ] Understand the full list of 12 tools: search, get_post, get_comments, get_subreddit, get_subreddit_rules, get_subreddit_posts, get_user, get_user_posts, get_user_comments, get_trending, get_wiki_page, get_me

## Definition of Done
- [ ] All 12 read tools listed by MCP Inspector when server starts
- [ ] Tool descriptions are clear, concise, and under 200 characters each
- [ ] Zod schemas have proper descriptions for all parameters across all 12 tools
- [ ] No duplicate tool names in the registry
- [ ] `registerReadTools(server)` function wires all 12 tools into McpServer
- [ ] `server.ts` calls `registerReadTools()` during server setup
- [ ] No tools from write or mod categories included
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Registration test verifies all 12 tools are registered with correct names
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

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
