# E03-T06: Auth-Aware Tool Guard

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E03-T02 |

## Description
Build `src/reddit/auth-guard.ts`: utility to verify current auth tier supports required operation. Returns clear error if insufficient.

## Acceptance Criteria
1. `requireAuth("user")` throws if tier is anon/app-only
2. `requireAuth("anon")` always succeeds
3. Error messages name specific env vars needed
4. Can check for specific OAuth scopes

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3 (tier capabilities); research/06-oauth-and-mcp-architecture.md (guard pattern)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Per-tool scope configuration (tools declare their own requirements).

## Implementation Notes
- Error message example: "This tool requires user authentication. Set REDDIT_USERNAME and REDDIT_PASSWORD."
- The guard is used by individual tools to check auth before making API calls
- Tier hierarchy: anon < app-only < user (each tier includes capabilities of lower tiers)
- Scope checking is for verifying that the requested OAuth scopes were actually granted

## Files to Create/Modify
- `src/reddit/auth-guard.ts` — requireAuth utility function
- `src/reddit/index.ts` — export auth guard
- `src/__tests__/reddit/auth-guard.test.ts` — tests for all tier combinations
