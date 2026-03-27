# E03-T03: Tier 1 Anonymous Auth

| Field | Value |
|-------|-------|
| **Epic** | [E03 — Authentication System](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E03-T02 |

## Description
Implement anonymous path: installed client credentials grant (no secret needed, read-only, ~10 RPM). Fallback to unauthenticated `.json` suffix if that fails.

## Acceptance Criteria
1. Works with zero env vars configured
2. Can fetch public subreddit data
3. Correctly identifies as read-only tier
4. Graceful degradation to `.json` suffix fallback

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 3 (Tier 1); research/01-reddit-official-api.md (installed client grant)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Write operations at this tier.

## Implementation Notes
- Base URL changes to `https://www.reddit.com` with `.json` suffix for the fallback path
- Installed client grant uses a device ID and no client secret
- Rate limit is significantly lower (~10 RPM) at this tier
- The `.json` suffix fallback is a last resort when even anonymous OAuth fails

## Files to Create/Modify
- `src/reddit/grants/anonymous.ts` — anonymous grant strategy
- `src/reddit/index.ts` — export grant
- `src/__tests__/reddit/grants/anonymous.test.ts` — tests including fallback behavior
