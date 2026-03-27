# E02-T01: Reddit HTTP Client Foundation

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E01-T03 |

## Description
Build `src/reddit/client.ts`: a `RedditClient` class wrapping `fetch`. Every GET includes `raw_json=1`. Every POST includes `api_type=json`. User-Agent follows `platform:app_id:version (by /u/username)` format. Base URL is `https://oauth.reddit.com`.

## Acceptance Criteria
1. GET requests auto-append `raw_json=1` query parameter
2. POST requests auto-include `api_type=json` in body
3. User-Agent header matches Reddit format: `platform:app_id:version (by /u/username)`
4. Base URL is `https://oauth.reddit.com`
5. Unit tests verify all 4 behaviors

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 2, 4; research/01-reddit-official-api.md (API conventions)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Auth header injection (E03-T07), rate limiting integration (E02-T06).

## Implementation Notes
- Use native `fetch` (Node 18+). No axios/got dependency.
- `raw_json=1` prevents Reddit from HTML-encoding special characters in JSON responses
- `api_type=json` forces JSON responses instead of jQuery/redirect format
- The client should accept an options object for base URL override (needed for anonymous tier)

## Files to Create/Modify
- `src/reddit/client.ts` — RedditClient class with get/post methods
- `src/reddit/index.ts` — export RedditClient
- `src/__tests__/reddit/client.test.ts` — unit tests for all 4 behaviors
