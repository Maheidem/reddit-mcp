# E03-T01: Configuration and Environment Loading

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E03 — Authentication System](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | S                                      |
| **Dependencies** | E02-T01                                |

## Description

Build `src/reddit/config.ts`: load `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT` from env vars. Determine auth tier based on which vars are present.

## Acceptance Criteria

1. Missing all vars = Tier 1 (anonymous)
2. CLIENT_ID + CLIENT_SECRET only = Tier 2 (app-only)
3. All 4 credential vars = Tier 3 (full OAuth)
4. Throws if CLIENT_SECRET present without CLIENT_ID
5. USER_AGENT has fallback default

## Definition of Ready

- [ ] E02-T01 (HTTP Client) is Done — config depends on client existing to validate against
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — understand which env vars map to which tier
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.2 (OAuth2 App Types) — understand script vs web vs installed app types
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.5 (API Access Requirements) — understand User-Agent format requirement (`platform:app_id:version (by /u/username)`)
- [ ] Research read: research/06-oauth-and-mcp-architecture.md — tier detection logic and config shape
- [ ] Understand the 5 env vars: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT`
- [ ] Understand tier mapping: no vars = Tier 1, ID+SECRET = Tier 2, all 4 credential vars = Tier 3

## Definition of Done

- [ ] Missing all env vars correctly yields Tier 1 (anonymous) config
- [ ] CLIENT_ID + CLIENT_SECRET only correctly yields Tier 2 (app-only) config
- [ ] All 4 credential vars correctly yields Tier 3 (full OAuth) config
- [ ] Throws descriptive error if CLIENT_SECRET present without CLIENT_ID
- [ ] USER_AGENT has fallback default following Reddit format: `platform:app_id:version (by /u/username)`
- [ ] `RedditConfig` type exported carrying tier enum and available credentials
- [ ] Credentials never logged or exposed in error messages
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover all 3 tier detection paths plus the invalid-combo error case
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

## Out of Scope

Encrypted credential storage.

## Implementation Notes

- Never persist tokens to disk (Trail of Bits finding)
- Tier detection is pure logic based on presence/absence of env vars
- Default USER_AGENT should follow Reddit format but with a generic app name
- Consider a `RedditConfig` type that carries the tier and available credentials

## Files to Create/Modify

- `src/reddit/config.ts` — config loading and tier detection
- `src/reddit/index.ts` — export config types
- `src/__tests__/reddit/config.test.ts` — tests for all tier detection cases
