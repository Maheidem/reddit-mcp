# E03-T02: Auth Manager Core with Token Lifecycle

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03-T01 |

## Description
Build `src/reddit/auth.ts`: `RedditAuthManager` class with `getAccessToken()`. Cached tokens. Refresh at 50 min (not 60). In-memory only.

## Acceptance Criteria
1. `getAccessToken()` returns cached token when not expired
2. Auto-refreshes at 50-minute mark
3. Tokens never written to disk
4. Refresh failures throw clear error with retry guidance
5. Unit test with mocked time verifies refresh timing

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3; research/06-oauth-and-mcp-architecture.md (token lifecycle)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Specific grant type implementations (T03-T05). This is the framework they plug into.

## Implementation Notes
- Refresh tokens are permanent for script apps (never expire)
- 50-minute refresh window gives 10 minutes of buffer before the 60-minute token expiry
- The manager should accept a "grant strategy" that T03-T05 implement
- Consider a `TokenGrant` interface: `{ authenticate(): Promise<TokenResponse> }`

## Files to Create/Modify
- `src/reddit/auth.ts` — RedditAuthManager class
- `src/reddit/index.ts` — export auth manager
- `src/__tests__/reddit/auth.test.ts` — tests with mocked time for refresh behavior
