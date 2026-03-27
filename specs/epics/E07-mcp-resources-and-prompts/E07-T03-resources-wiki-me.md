# E07-T03: Resources -- Wiki Page and Authenticated User

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **Epic**         | [E07 -- MCP Resources and Prompts](EPIC.md) |
| **Status**       | Done                                        |
| **Size**         | S                                           |
| **Dependencies** | E04-T06, E04-T07                            |

## Description

Implement `reddit://subreddit/{name}/wiki/{page}` and `reddit://me`. Wiki content and authenticated user profile as resources.

## Acceptance Criteria

1. Wiki resource returns page content as text
2. `reddit://me` requires auth and returns authenticated user profile
3. Auth-gated resource returns clear error when unauthenticated
4. Both registered as resource templates

## Definition of Ready

- [ ] E04-T06 (get_wiki_page tool) is Done and its API call logic is reusable
- [ ] E04-T07 (get_me tool) is Done and its API call logic is reusable
- [ ] MCP SDK resource registration pattern understood (`server.resource()` with URI templates)
- [ ] FINAL section 12.1 read: URI schemes `reddit://subreddit/{name}/wiki/{page}` and `reddit://me`
- [ ] Auth-gating pattern understood: `reddit://me` requires Tier 3 auth, must return clear error when unauthenticated
- [ ] research/06-oauth-and-mcp-architecture.md auth tiers section read

## Definition of Done

- [ ] `reddit://subreddit/{name}/wiki/{page}` resource registered and returns wiki page content as markdown text
- [ ] `reddit://me` resource registered and returns authenticated user's profile as structured JSON
- [ ] `reddit://me` returns a clear, descriptive error message (not a crash) when user is unauthenticated
- [ ] Wiki resource reuses E04-T06 API call logic; me resource reuses E04-T07 logic
- [ ] URI templates correctly parameterized (`{name}`, `{page}` for wiki; no params for me)
- [ ] MCP Inspector shows both resources and they return expected data
- [ ] Unit tests cover: valid wiki page, nonexistent wiki page, authenticated me, unauthenticated me error path
- [ ] Resources exported from `src/resources/index.ts` barrel file
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

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
