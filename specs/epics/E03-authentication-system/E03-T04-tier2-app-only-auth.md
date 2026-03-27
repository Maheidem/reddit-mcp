# E03-T04: Tier 2 App-Only Auth (Client Credentials)

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E03 — Authentication System](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | S                                      |
| **Dependencies** | E03-T02                                |

## Description

Implement `client_credentials` grant for script apps (CLIENT_ID + CLIENT_SECRET). 100 QPM, read-only.

## Acceptance Criteria

1. Authenticates with `grant_type=client_credentials`
2. Uses HTTP Basic Auth with CLIENT_ID:CLIENT_SECRET
3. Returns usable access token
4. Auto-refreshes before expiry

## Definition of Ready

- [ ] E03-T02 (Auth Manager Core) is Done — app-only grant implements the `TokenGrant` interface
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — Tier 2 details: 100 QPM, read-only, CLIENT_ID + CLIENT_SECRET
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.2 (OAuth2 App Types) — script app type with client_credentials grant
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.4 (Token Management) — token endpoint URL, refresh behavior
- [ ] Research read: research/01-reddit-official-api.md — client_credentials grant specifics
- [ ] Understand Reddit's client_credentials OAuth2 flow: HTTP Basic Auth with base64-encoded `CLIENT_ID:CLIENT_SECRET` to `https://www.reddit.com/api/v1/access_token`
- [ ] Understand this tier gets 100 QPM but no user context (cannot post, comment, or moderate)

## Definition of Done

- [ ] Authenticates with `grant_type=client_credentials` to Reddit's token endpoint
- [ ] Uses HTTP Basic Auth header with base64-encoded `CLIENT_ID:CLIENT_SECRET`
- [ ] Returns usable access token for read-only API calls to `https://oauth.reddit.com`
- [ ] Auto-refreshes before 50-minute expiry via auth manager integration
- [ ] Implements `TokenGrant` interface from E03-T02
- [ ] CLIENT_ID and CLIENT_SECRET never logged or included in error messages
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: successful authentication, token response parsing, HTTP Basic Auth header format
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

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
