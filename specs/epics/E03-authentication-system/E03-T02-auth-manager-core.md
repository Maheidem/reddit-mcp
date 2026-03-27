# E03-T02: Auth Manager Core with Token Lifecycle

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E03 — Authentication System](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | M                                      |
| **Dependencies** | E03-T01                                |

## Description

Build `src/reddit/auth.ts`: `RedditAuthManager` class with `getAccessToken()`. Cached tokens. Refresh at 50 min (not 60). In-memory only.

## Acceptance Criteria

1. `getAccessToken()` returns cached token when not expired
2. Auto-refreshes at 50-minute mark
3. Tokens never written to disk
4. Refresh failures throw clear error with retry guidance
5. Unit test with mocked time verifies refresh timing

## Definition of Ready

- [ ] E03-T01 (Configuration and Environment Loading) is Done — auth manager consumes `RedditConfig`
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.4 (Token Management) — understand 50-min refresh, in-memory storage, token lifecycle code pattern
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — understand what each tier can do
- [ ] Research read: research/06-oauth-and-mcp-architecture.md — token lifecycle details, grant strategy pattern
- [ ] Understand that refresh tokens are permanent for script apps (never expire)
- [ ] Understand the `TokenGrant` interface pattern: tier strategies (T03-T05) plug into this manager
- [ ] Understand Trail of Bits finding: tokens must never be persisted to disk

## Definition of Done

- [ ] `getAccessToken()` returns cached token when not expired
- [ ] Auto-refresh triggers at 50-minute mark (not 60) to avoid race conditions
- [ ] Tokens stored in memory only — no disk writes, no `localStorage`, no file I/O
- [ ] Token values never appear in log output or error messages
- [ ] Refresh failures throw clear error with retry guidance (e.g., "Token refresh failed. Check credentials and retry.")
- [ ] `TokenGrant` interface defined for tier strategies to implement (used by T03-T05)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests with mocked time (`vi.useFakeTimers`) verify refresh triggers at 50 min, not before
- [ ] Unit tests verify cached token returned when still valid
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

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
