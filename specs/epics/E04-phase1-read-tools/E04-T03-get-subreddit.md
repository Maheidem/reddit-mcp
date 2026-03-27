# E04-T03: Get Subreddit and Rules Tools

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Epic**         | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status**       | Done                         |
| **Size**         | M                                   |
| **Dependencies** | E02, E03                            |

## Description

Get subreddit info and rules. Handle private/banned/nonexistent subreddit edge cases. Uses `GET /r/{sub}/about` and `GET /r/{sub}/about/rules`.

## Acceptance Criteria

1. Returns subscriber count, description, created date, NSFW status
2. Rules returned as structured list with kind and description
3. Private subreddit returns clear "private" error (not crash)
4. Nonexistent subreddit returns clear "not found" error

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available for tier checking
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.3 (Thing Types) — understand t5 (Subreddit) fullname format
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 10.1 (Phase 1 Read Tools) — `get_subreddit` and `get_subreddit_rules` tools: auth=anon
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.3 (HTTP Status Code Surprises) — private sub returns 302 not 403, nonexistent sub returns 302 redirect to search
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.7 (Field Naming Inconsistencies) — subreddit uses `over18` (no underscore) vs post uses `over_18`
- [ ] Research read: research/07-api-edge-cases-and-gotchas.md — subreddit edge cases (private, banned, nonexistent)
- [ ] Understand the specific Reddit API endpoints: `GET /r/{sub}/about` and `GET /r/{sub}/about/rules`
- [ ] Understand rules have `kind` field with values: `link`, `comment`, or `all`

## Definition of Done

- [ ] `get_subreddit` tool registered with `McpServer.tool()` — returns subscriber count, description, created date, NSFW status
- [ ] `get_subreddit_rules` tool registered with `McpServer.tool()` — returns rules as structured list with kind and description
- [ ] NSFW field correctly read from `over18` (not `over_18`) on subreddit objects
- [ ] Private subreddit returns clear "private" error with `isError: true` (handles both 302 redirect and 403)
- [ ] Nonexistent subreddit returns clear "not found" error with `isError: true` (handles 302 redirect to search)
- [ ] Banned subreddit handled gracefully (may return 403 or 404)
- [ ] Zod schemas validate all params with LLM-readable descriptions
- [ ] `raw_json=1` included in requests
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: normal subreddit, private sub (302 + 403), nonexistent sub, banned sub, rules retrieval
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

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
