# E03-T04: Tier 2 App-Only Auth (Client Credentials)

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E03-T02 |

## Description
Implement `client_credentials` grant for script apps (CLIENT_ID + CLIENT_SECRET). 100 QPM, read-only.

## Acceptance Criteria
1. Authenticates with `grant_type=client_credentials`
2. Uses HTTP Basic Auth with CLIENT_ID:CLIENT_SECRET
3. Returns usable access token
4. Auto-refreshes before expiry

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3 (Tier 2); research/01-reddit-official-api.md (client credentials)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
User-context operations. Cannot upload media at this tier.

## Implementation Notes
- HTTP Basic Auth: base64 encode `CLIENT_ID:CLIENT_SECRET` in Authorization header
- Token endpoint: `https://www.reddit.com/api/v1/access_token`
- This tier gets full 100 QPM rate limit but no user context
- Grant type is `client_credentials` with no additional parameters

## Files to Create/Modify
- `src/reddit/grants/app-only.ts` — client credentials grant strategy
- `src/reddit/index.ts` — export grant
- `src/__tests__/reddit/grants/app-only.test.ts` — tests for auth flow
