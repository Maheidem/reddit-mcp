# E07-T04: Prompt -- `reddit_research`

| Field | Value |
|-------|-------|
| **Epic** | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E04 |

## Description
Template for deep-dive research across subreddits. Params: `topic`, `subreddits` (optional list), `time_range`. Generates a structured prompt guiding the LLM to use search and read tools systematically.

## Acceptance Criteria
1. Prompt registered with `server.prompt()`
2. Parameters validated by Zod schema
3. Generated prompt text references available tools by name
4. MCP Inspector shows prompt with params

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 12; research/06-oauth-and-mcp-architecture.md (prompts section)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Auto-executing tools (prompts are templates, not workflows).

## Implementation Notes
- This is a workflow template -- it tells the LLM how to use the tools together
- The prompt should reference specific tool names: `search_reddit`, `get_post`, `get_comments`, etc.
- Include guidance on search strategies: start broad, narrow down, cross-reference subreddits
- `time_range` should suggest appropriate sort parameters (e.g., "past week" -> `t=week`)

## Files to Create/Modify
- `src/prompts/research.ts` -- research prompt implementation
