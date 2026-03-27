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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 7.4; research/06-oauth-and-mcp-architecture.md (auth)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
