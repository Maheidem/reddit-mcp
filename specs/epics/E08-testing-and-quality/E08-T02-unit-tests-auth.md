# E08-T02: Unit Tests -- Auth Manager

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03 |

## Description
Test all 3 auth tiers. Mock token endpoint. Verify 50-min refresh. Test tier detection from env vars.

## Acceptance Criteria
1. Tests for each tier's token acquisition flow
2. Test for auto-refresh at 50-minute mark
3. Test for graceful degradation chain (tier 3 -> 2 -> 1)
4. Test env var parsing edge cases (partial config, invalid values)

## Definition of Ready
- [ ] E03 (Authentication System) is Done: auth manager, all 3 tiers, auth guard, and wiring are stable
- [ ] FINAL section 3 read: 3-tier progressive auth (anonymous, app-only, full OAuth)
- [ ] research/06-oauth-and-mcp-architecture.md auth section read: tier detection from env vars, degradation chain
- [ ] Vitest mocking patterns understood: `vi.fn()` for fetch (token endpoint), `vi.useFakeTimers()` for 50-min refresh
- [ ] Tier detection logic understood: Tier 3 = client_id + client_secret + refresh_token, Tier 2 = client_id + client_secret, Tier 1 = nothing

## Definition of Done
- [ ] Tests for each tier's token acquisition flow: Tier 1 (no token), Tier 2 (client credentials grant), Tier 3 (refresh_token grant)
- [ ] Test for auto-refresh at 50-minute mark using `vi.useFakeTimers()` (not 60 minutes)
- [ ] Test for graceful degradation chain: Tier 3 fails -> falls back to Tier 2 -> falls back to Tier 1
- [ ] Test env var parsing edge cases: empty strings, whitespace-only values, partial config, missing vars
- [ ] Token endpoint mocked with `vi.fn()` -- no real Reddit OAuth calls
- [ ] Auth guard tests: correct tier detected from env, unauthorized tool calls rejected with clear error
- [ ] No flaky tests -- all timing-dependent tests use fake timers
- [ ] Tests run in under 5 seconds total
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope
Real Reddit OAuth calls.

## Implementation Notes
- Mock `fetch` for token endpoint responses
- Use `vi.useFakeTimers()` to test the 50-minute refresh timing
- Tier detection: Tier 3 needs client_id + client_secret + refresh_token, Tier 2 needs client_id + client_secret, Tier 1 needs nothing
- Degradation chain: if Tier 3 creds are invalid/expired, fall back to Tier 2, then Tier 1
- Test edge cases: empty strings, whitespace-only values, missing vars

## Files to Create/Modify
- `tests/unit/auth/auth-manager.test.ts` -- auth manager unit tests
