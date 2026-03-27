# E07-T01: Resources -- Subreddit Info and Rules

| Field | Value |
|-------|-------|
| **Epic** | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E04-T03 |

## Description
Implement `reddit://subreddit/{name}/info` and `reddit://subreddit/{name}/rules` as MCP resource templates. Expose subreddit metadata and rules as structured, cacheable data.

## Acceptance Criteria
1. Resource URI pattern `reddit://subreddit/{name}/info` works
2. Resource URI pattern `reddit://subreddit/{name}/rules` works
3. Returns JSON with subscribers, description, rules as appropriate
4. Resource templates registered with `server.resource()`
5. MCP Inspector shows both resources

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
Subreddit settings or mod-only data.

## Implementation Notes
- Resources reuse the same Reddit API calls as the read tools but expose data through the Resource primitive
- `server.resource()` takes a URI template pattern and a handler function
- Resources should return structured JSON, not formatted text
- Consider caching headers -- resources are meant to be cacheable

## Files to Create/Modify
- `src/resources/subreddit.ts` -- subreddit resource implementations
