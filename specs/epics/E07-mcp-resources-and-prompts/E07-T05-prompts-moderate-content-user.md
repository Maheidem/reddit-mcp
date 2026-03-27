# E07-T05: Prompts -- moderate, content_plan, user_analysis

| Field | Value |
|-------|-------|
| **Epic** | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E04, E05, E06 |

## Description
Three workflow prompts: `reddit_moderate` (review modqueue), `reddit_content_plan` (content strategy), `reddit_user_analysis` (user history analysis).

## Acceptance Criteria
1. All 3 prompts registered and visible in MCP Inspector
2. Each has relevant parameters with Zod validation
3. Prompt text is actionable and references correct tools
4. `reddit_moderate` references mod tools (approve, remove, ban_user)
5. `reddit_user_analysis` references get_user, get_user_posts, get_user_comments

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
Complex multi-step workflows.

## Implementation Notes
- Prompts are our differentiator -- only 1 of 39 competitors uses prompts at all
- `reddit_moderate`: params `subreddit`, guides through modqueue review workflow using get_modqueue -> approve/remove/ban_user
- `reddit_content_plan`: params `subreddit`, `goal`, guides research -> analysis -> content creation
- `reddit_user_analysis`: params `username`, guides profile lookup -> post/comment history -> pattern analysis
- Each prompt should be genuinely useful, not just a wrapper around a single tool call

## Files to Create/Modify
- `src/prompts/moderate.ts` -- moderation prompt implementation
- `src/prompts/content-plan.ts` -- content planning prompt implementation
- `src/prompts/user-analysis.ts` -- user analysis prompt implementation
