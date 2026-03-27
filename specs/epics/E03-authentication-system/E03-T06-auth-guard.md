# E03-T06: Auth-Aware Tool Guard

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E03 — Authentication System](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | S                                      |
| **Dependencies** | E03-T02                                |

## Description

Build `src/reddit/auth-guard.ts`: utility to verify current auth tier supports required operation. Returns clear error if insufficient.

## Acceptance Criteria

1. `requireAuth("user")` throws if tier is anon/app-only
2. `requireAuth("anon")` always succeeds
3. Error messages name specific env vars needed
4. Can check for specific OAuth scopes

## Definition of Ready

- [ ] E03-T02 (Auth Manager Core) is Done — guard queries the auth manager for current tier
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — understand tier hierarchy: anon < app-only < user
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.3 (OAuth Scopes) — understand which scopes map to which capabilities
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 7.3 (Error Handling Strategy) — guard errors should return `isError: true` for recoverable tool errors
- [ ] Research read: research/06-oauth-and-mcp-architecture.md — guard pattern and tier capability matrix
- [ ] Understand the guard is used by individual tools (E04-E06) to check auth before making API calls
- [ ] Understand error messages must name specific env vars needed (e.g., "Set REDDIT_USERNAME and REDDIT_PASSWORD")

## Definition of Done

- [ ] `requireAuth("user")` throws if current tier is anon or app-only
- [ ] `requireAuth("app")` throws if current tier is anon, passes for app-only and user
- [ ] `requireAuth("anon")` always succeeds (all tiers satisfy anonymous requirement)
- [ ] Scope checking function verifies specific OAuth scopes were granted
- [ ] Error messages name the specific env vars needed to upgrade to the required tier
- [ ] Guard errors are structured for MCP `isError: true` response pattern
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover all tier combinations: anon requesting user (fail), anon requesting anon (pass), app-only requesting user (fail), user requesting user (pass), scope check pass/fail
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

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
