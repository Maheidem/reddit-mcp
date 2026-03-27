# E03-T05: Tier 3 Full OAuth (Password Grant)

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03-T02 |

## Description
Implement password grant (all 4 vars). 100 QPM, full read/write/mod. Request all Phase 1 scopes.

## Acceptance Criteria
1. Authenticates with `grant_type=password`
2. Requests all 12 Phase 1 scopes: `read identity submit edit vote privatemessages history wikiread modposts modcontributors modlog modnote`
3. Returns access token that works for write endpoints
4. `getAuthTier()` returns `"user"`
5. Scope list configurable for Phase 2/3 expansion

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3 (Tier 3); research/06-oauth-and-mcp-architecture.md (password grant)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Web app auth code grant (that's Phase 2+ / E09-T05).

## Implementation Notes
- Username + password sent in POST body, not URL
- HTTP Basic Auth with CLIENT_ID:CLIENT_SECRET also required
- Token endpoint: `https://www.reddit.com/api/v1/access_token`
- Scopes are space-separated in the request
- Scope list should be a constant that can be extended for Phase 2/3

## Files to Create/Modify
- `src/reddit/grants/full-oauth.ts` — password grant strategy
- `src/reddit/index.ts` — export grant
- `src/__tests__/reddit/grants/full-oauth.test.ts` — tests for auth flow and scope handling
