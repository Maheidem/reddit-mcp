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
- [ ] E02-T06 (Core Infrastructure Integration) is Done — client has rate limiter and error parser wired in
- [ ] E03-T02 (Auth Manager Core) is Done — auth manager provides `getAccessToken()` and tier info
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.4 (Token Management) — understand transparent token refresh before requests
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 7.1 (System Architecture) — understand request flow: getToken() -> acquire() -> fetch(with Bearer header) -> updateFromHeaders() -> parseErrors() -> return
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.1 (Critical Parameters) — `raw_json=1` on GET, `api_type=json` on POST must be added at this layer
- [ ] Research read: research/06-oauth-and-mcp-architecture.md — client wiring pattern, base URL switching by tier
- [ ] Understand anonymous tier uses different base URL (`https://www.reddit.com` with `.json` suffix) vs authenticated (`https://oauth.reddit.com`)

## Definition of Done
- [ ] All outgoing requests include `Authorization: Bearer {token}` header (except anonymous `.json` fallback)
- [ ] Token refresh happens transparently — callers never see expired token errors
- [ ] Auth tier determines base URL: `https://oauth.reddit.com` for authenticated, `https://www.reddit.com` for anonymous fallback
- [ ] Integration test verifies Bearer header injection with mocked auth manager
- [ ] Integration test verifies transparent token refresh mid-session
- [ ] Token values never appear in log output or error messages
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Tests written and passing (integration tests with mocked auth manager)
- [ ] No lint warnings introduced
- [ ] Public API maintained in `src/reddit/index.ts` barrel file

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
