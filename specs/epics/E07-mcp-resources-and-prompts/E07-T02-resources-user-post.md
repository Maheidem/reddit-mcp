# E07-T02: Resources -- User Profile and Post Details

| Field | Value |
|-------|-------|
| **Epic** | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E04-T05, E04-T02 |

## Description
Implement `reddit://user/{username}/about` and `reddit://post/{id}`. Expose user profiles and post details as MCP resources.

## Acceptance Criteria
1. User resource returns profile summary (karma, age, etc.)
2. Post resource returns full post details
3. Both reuse existing read tool logic internally
4. URI templates correctly parameterized

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 12; research/09-typescript-mcp-sdk-deep-dive.md (resource registration)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
User's post history as a resource.

## Implementation Notes
- Post ID in URI should accept bare ID or fullname (strip `t3_` prefix if present)
- Reuse the same API call logic from E04-T05 (get_user) and E04-T02 (get_post)
- Return structured JSON matching what the read tools return

## Files to Create/Modify
- `src/resources/user.ts` -- user resource implementation
- `src/resources/post.ts` -- post resource implementation
