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
- [ ] E03-T02 (Auth Manager Core) is Done — full OAuth grant implements the `TokenGrant` interface
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — Tier 3 details: 100 QPM, full read/write/mod, all 22 scopes available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.2 (OAuth2 App Types) — script app type with password grant (resource owner)
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.3 (OAuth Scopes) — 12 Phase 1 scopes: `read identity submit edit vote privatemessages history wikiread modposts modcontributors modlog modnote`
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.4 (Token Management) — refresh tokens are permanent for script apps
- [ ] Research read: research/06-oauth-and-mcp-architecture.md — password grant flow details
- [ ] Understand password grant requires: HTTP Basic Auth (CLIENT_ID:CLIENT_SECRET) + POST body with `grant_type=password`, `username`, `password`, and `scope`

## Definition of Done
- [ ] Authenticates with `grant_type=password` to `https://www.reddit.com/api/v1/access_token`
- [ ] Requests all 12 Phase 1 scopes as space-separated string in request body
- [ ] Uses HTTP Basic Auth header with base64-encoded `CLIENT_ID:CLIENT_SECRET`
- [ ] Username and password sent in POST body (not URL params)
- [ ] Returns access token that enables write and moderation endpoints
- [ ] `getAuthTier()` returns `"user"` for this grant type
- [ ] Scope list defined as extensible constant for Phase 2/3 expansion
- [ ] Implements `TokenGrant` interface from E03-T02
- [ ] Credentials (username, password, client secret) never logged or exposed in error messages
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: successful auth, scope string formatting, tier identification, credential handling in request body
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

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
