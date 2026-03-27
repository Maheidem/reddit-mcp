# E02-T01: Reddit HTTP Client Foundation

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Epic**         | [E02 — Core Infrastructure](EPIC.md) |
| **Status**       | Done                                 |
| **Size**         | M                                    |
| **Dependencies** | E01-T03                              |

## Description

Build `src/reddit/client.ts`: a `RedditClient` class wrapping `fetch`. Every GET includes `raw_json=1`. Every POST includes `api_type=json`. User-Agent follows `platform:app_id:version (by /u/username)` format. Base URL is `https://oauth.reddit.com`.

## Acceptance Criteria

1. GET requests auto-append `raw_json=1` query parameter
2. POST requests auto-include `api_type=json` in body
3. User-Agent header matches Reddit format: `platform:app_id:version (by /u/username)`
4. Base URL is `https://oauth.reddit.com`
5. Unit tests verify all 4 behaviors

## Definition of Ready

- [ ] Dependency: E01-T03 (Wire STDIO Transport) is Done -- server shell must exist to add HTTP client to
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 2.1 -- API Structure (base URLs: `oauth.reddit.com` for authenticated, `www.reddit.com` for unauthenticated)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 6.2 -- HTTP Approach: Direct (no wrapper library, native `fetch`)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 7.1 -- System Architecture diagram showing HTTP client layer position
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.1 -- Critical: Always include `raw_json=1` on GET, `api_type=json` on POST
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3.2 -- The `raw_json=1` parameter (prevents HTML-encoding of special characters)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3.3 -- The `api_type=json` parameter (prevents jQuery callback format)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 3.5 -- User-Agent MUST follow format: `platform:app_id:version (by /u/username)`
- [ ] Understand: Use native `fetch` (Node 18+), no axios/got dependency
- [ ] Understand: Client should accept an options object for base URL override (needed for anonymous tier using `www.reddit.com`)
- [ ] ACs reviewed: 5 acceptance criteria covering fetch wrapper, query params, body params, User-Agent, base URL

## Definition of Done

- [ ] AC1: GET requests auto-append `raw_json=1` query parameter
- [ ] AC2: POST requests auto-include `api_type=json` in body
- [ ] AC3: User-Agent header matches Reddit format: `platform:app_id:version (by /u/username)`
- [ ] AC4: Base URL is `https://oauth.reddit.com`
- [ ] AC5: Unit tests verify all 4 behaviors
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: successful GET request, successful POST request, `raw_json=1` injection, `api_type=json` injection, User-Agent header, base URL override, error propagation
- [ ] Exported from `src/reddit/index.ts` barrel file
- [ ] TSDoc on `RedditClient` class and public methods (`get`, `post`, `setAuthHeader`)
- [ ] No lint warnings introduced

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
