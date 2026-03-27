# E07-T03: Resources -- Wiki Page and Authenticated User

| Field | Value |
|-------|-------|
| **Epic** | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E04-T06, E04-T07 |

## Description
Implement `reddit://subreddit/{name}/wiki/{page}` and `reddit://me`. Wiki content and authenticated user profile as resources.

## Acceptance Criteria
1. Wiki resource returns page content as text
2. `reddit://me` requires auth and returns authenticated user profile
3. Auth-gated resource returns clear error when unauthenticated
4. Both registered as resource templates

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
Wiki revision history.

## Implementation Notes
- `reddit://me` is unique -- it's the only resource that requires user auth (Tier 3)
- When unauthenticated, return a clear error message, not a crash
- Wiki content is markdown text -- return as-is, don't transform
- Reuse API call logic from E04-T06 (wiki) and E04-T07 (me)

## Files to Create/Modify
- `src/resources/wiki.ts` -- wiki resource implementation
- `src/resources/me.ts` -- authenticated user resource implementation
