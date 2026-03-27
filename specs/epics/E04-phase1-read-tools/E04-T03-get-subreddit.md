# E04-T03: Get Subreddit and Rules Tools

| Field | Value |
|-------|-------|
| **Epic** | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02, E03 |

## Description
Get subreddit info and rules. Handle private/banned/nonexistent subreddit edge cases. Uses `GET /r/{sub}/about` and `GET /r/{sub}/about/rules`.

## Acceptance Criteria
1. Returns subscriber count, description, created date, NSFW status
2. Rules returned as structured list with kind and description
3. Private subreddit returns clear "private" error (not crash)
4. Nonexistent subreddit returns clear "not found" error

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 10; research/07-api-edge-cases-and-gotchas.md (subreddit edge cases); research/10-tool-inventory.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Subreddit settings (mod-only, Phase 3).

## Implementation Notes
- Private subs may return 302 redirect instead of 403 -- handle both
- Check `over18` (no underscore!) for subreddits vs `over_18` for posts
- Rules have `kind` field: `link`, `comment`, or `all`
- Consider separate `get_subreddit` and `get_subreddit_rules` MCP tools

## Files to Create/Modify
- `src/tools/read/get-subreddit.ts` — subreddit info tool
- `src/tools/read/get-subreddit-rules.ts` — subreddit rules tool
- `src/tools/read/index.ts` — export both tools
- `src/__tests__/tools/read/get-subreddit.test.ts` — tests including private/banned edge cases
