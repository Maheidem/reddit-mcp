# E03-T03: Tier 1 Anonymous Auth

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E03 — Authentication System](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | M                                      |
| **Dependencies** | E03-T02                                |

## Description

Implement anonymous path: installed client credentials grant (no secret needed, read-only, ~10 RPM). Fallback to unauthenticated `.json` suffix if that fails.

## Acceptance Criteria

1. Works with zero env vars configured
2. Can fetch public subreddit data
3. Correctly identifies as read-only tier
4. Graceful degradation to `.json` suffix fallback

## Definition of Ready

- [ ] E03-T02 (Auth Manager Core) is Done — anonymous grant implements the `TokenGrant` interface
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 3.1 (Three-Tier Auth Strategy) — Tier 1 details: ~10 req/min, read-only, no credentials needed
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.1 (API Structure) — understand base URL difference: `https://www.reddit.com` with `.json` suffix for unauthenticated fallback
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 4.1 (Rate Limit Rules) — unauthenticated rate is 10 RPM per IP
- [ ] Research read: research/01-reddit-official-api.md — installed client grant flow (device ID, no secret)
- [ ] Understand the two paths: installed client credentials grant (primary) and `.json` suffix fallback (last resort)
- [ ] Understand that this tier has significantly lower rate limits (~10 RPM) than authenticated tiers (100 QPM)

## Definition of Done

- [ ] Works with zero env vars configured — no credentials required
- [ ] Can fetch public subreddit data at Tier 1
- [ ] Correctly identifies as read-only tier via `getAuthTier()`
- [ ] Graceful degradation: falls back to `.json` suffix on `https://www.reddit.com` if installed client grant fails
- [ ] Implements `TokenGrant` interface from E03-T02
- [ ] No credentials or tokens logged in anonymous path
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: successful anonymous auth, fallback to `.json` suffix, read-only tier identification
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/reddit/index.ts` barrel file

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
