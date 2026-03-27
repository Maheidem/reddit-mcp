# E07-T04: Prompt -- `reddit_research`

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **Epic**         | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status**       | Done                                        |
| **Size**         | M                                           |
| **Dependencies** | E04                                         |

## Description

Template for deep-dive research across subreddits. Params: `topic`, `subreddits` (optional list), `time_range`. Generates a structured prompt guiding the LLM to use search and read tools systematically.

## Acceptance Criteria

1. Prompt registered with `server.prompt()`
2. Parameters validated by Zod schema
3. Generated prompt text references available tools by name
4. MCP Inspector shows prompt with params

## Definition of Ready

- [ ] E04 (Phase 1 Read Tools) is Done -- prompt references `search_reddit`, `get_post`, `get_comments` by name
- [ ] MCP SDK prompt registration pattern understood (`server.prompt()` with argument schemas)
- [ ] FINAL section 12.2 read: `reddit_research` prompt parameters (`topic`, `subreddits[]`, `time_range`)
- [ ] research/06-oauth-and-mcp-architecture.md prompts section read
- [ ] Zod v4 schema validation for prompt parameters understood
- [ ] Understand that prompts are templates (not auto-executing workflows) -- they guide LLM tool usage

## Definition of Done

- [ ] `reddit_research` prompt registered with `server.prompt()` and visible in MCP Inspector
- [ ] Prompt parameters validated by Zod schema: `topic` (required string), `subreddits` (optional string array), `time_range` (optional enum)
- [ ] Generated prompt text references available read tools by exact name: `search_reddit`, `get_post`, `get_comments`
- [ ] Prompt includes structured research workflow guidance (search strategy, cross-referencing, narrowing down)
- [ ] `time_range` parameter maps to Reddit sort parameters (e.g., "past week" suggests `t=week`)
- [ ] Unit tests verify: parameter validation (valid, missing required, invalid time_range), template renders with all param combinations
- [ ] Prompt exported from `src/prompts/index.ts` barrel file
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope

Auto-executing tools (prompts are templates, not workflows).

## Implementation Notes

- This is a workflow template -- it tells the LLM how to use the tools together
- The prompt should reference specific tool names: `search_reddit`, `get_post`, `get_comments`, etc.
- Include guidance on search strategies: start broad, narrow down, cross-reference subreddits
- `time_range` should suggest appropriate sort parameters (e.g., "past week" -> `t=week`)

## Files to Create/Modify

- `src/prompts/research.ts` -- research prompt implementation
