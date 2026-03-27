# E03-T07: Wire Auth into HTTP Client

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02-T06, E03-T02 |

## Description
Integrate `RedditAuthManager` into `RedditClient`. Every request gets `Authorization: Bearer {token}` header. Token refresh is transparent.

## Acceptance Criteria
1. All requests include Bearer token header
2. Token refresh happens transparently mid-session
3. Auth tier determines callable endpoints
4. Integration test verifies header injection with mocked auth

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3 (auth integration); research/06-oauth-and-mcp-architecture.md (client wiring)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Tier-specific endpoint routing.

## Implementation Notes
- Anonymous tier may use different base URL (`https://www.reddit.com` with `.json` suffix)
- Token refresh should be transparent: if a token is about to expire, refresh it before the request
- This is the final integration that makes RedditClient fully functional with auth + rate limiting + error parsing
- The client request flow becomes: getToken() -> acquire() -> fetch(with Bearer header) -> updateFromHeaders() -> parseErrors() -> return

## Files to Create/Modify
- `src/reddit/client.ts` — modify to accept and use RedditAuthManager
- `src/__tests__/reddit/client-auth-integration.test.ts` — integration test with mocked auth
