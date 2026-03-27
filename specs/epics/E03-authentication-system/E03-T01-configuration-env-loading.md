# E03-T01: Configuration and Environment Loading

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E02-T01 |

## Description
Build `src/reddit/config.ts`: load `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT` from env vars. Determine auth tier based on which vars are present.

## Acceptance Criteria
1. Missing all vars = Tier 1 (anonymous)
2. CLIENT_ID + CLIENT_SECRET only = Tier 2 (app-only)
3. All 4 credential vars = Tier 3 (full OAuth)
4. Throws if CLIENT_SECRET present without CLIENT_ID
5. USER_AGENT has fallback default

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3; research/06-oauth-and-mcp-architecture.md (tier detection)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
