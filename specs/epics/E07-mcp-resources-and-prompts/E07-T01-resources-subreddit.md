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
- [ ] E04-T03 (get_subreddit tool) is Done and its API call logic is reusable
- [ ] MCP SDK resource registration pattern understood (`server.resource()` with URI templates)
- [ ] FINAL section 12.1 read: URI schemes `reddit://subreddit/{name}/info` and `reddit://subreddit/{name}/rules`
- [ ] research/09-typescript-mcp-sdk-deep-dive.md resource registration section read
- [ ] Understand how resources differ from tools (cacheable, read-only, structured data)
- [ ] `src/resources/` directory location and barrel export pattern decided

## Definition of Done
- [ ] `reddit://subreddit/{name}/info` resource registered with `server.resource()` and returns JSON with subscribers, description, creation date
- [ ] `reddit://subreddit/{name}/rules` resource registered and returns structured rules array
- [ ] Both URI templates correctly parameterized with `{name}` placeholder
- [ ] Resources reuse existing Reddit API call logic from E04-T03 (no duplicate HTTP calls)
- [ ] MCP Inspector shows both resources and they return valid JSON responses
- [ ] Unit tests cover both resources: valid subreddit, nonexistent subreddit error
- [ ] Resources exported from `src/resources/index.ts` barrel file
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope
Subreddit settings or mod-only data.

## Implementation Notes
- Resources reuse the same Reddit API calls as the read tools but expose data through the Resource primitive
- `server.resource()` takes a URI template pattern and a handler function
- Resources should return structured JSON, not formatted text
- Consider caching headers -- resources are meant to be cacheable

## Files to Create/Modify
- `src/resources/subreddit.ts` -- subreddit resource implementations
