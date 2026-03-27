# E02-T03: Reddit Error Parser (4 Formats)

| Field | Value |
|-------|-------|
| **Epic** | [E02 — Core Infrastructure](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E02-T01 |

## Description
Build `src/reddit/errors.ts`: parse all 4 Reddit error formats. Map to unified `RedditApiError` class with `status`, `code`, `message`, `field` properties.

## Acceptance Criteria
1. Parses standard HTTP: `{"message":"Forbidden","error":403}`
2. Parses wrapped JSON: `{"json":{"errors":[["BAD_SR_NAME","invalid","sr"]]}}`
3. Handles empty `{}` as success (not error)
4. Detects jQuery format and throws descriptive error
5. All 4 formats have dedicated unit tests

## Definition of Ready
- [ ] Dependency: E02-T01 (Reddit HTTP Client Foundation) is Done -- error parser will be called from the HTTP client's response handling
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.2 -- Response Format Inconsistencies (all 4 error formats with examples)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 11.3 -- HTTP Status Code Surprises (302 for private subreddit, 403 for bot detection, etc.)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 7.3 -- Error Handling Strategy (two MCP error paths: `isError: true` vs `McpError`)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 7.1 -- Error Response Format Variations (4 formats with code examples)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 7.2 -- HTTP Status Code Surprises (private subreddit returns 302, banned subreddit returns 403)
- [ ] Understand: Format 1 = standard HTTP `{"message":"Forbidden","error":403}`
- [ ] Understand: Format 2 = wrapped JSON `{"json":{"errors":[["BAD_SR_NAME","invalid","sr"]]}}`
- [ ] Understand: Format 3 = jQuery callback `[["call","attr",...]]` -- safety net, only happens without `api_type=json`
- [ ] Understand: Format 4 = empty object `{}` -- indicates success on some mod endpoints, NOT an error
- [ ] ACs reviewed: 5 acceptance criteria covering all 4 error formats and dedicated tests

## Definition of Done
- [ ] AC1: Parses standard HTTP error format: `{"message":"Forbidden","error":403}` into `RedditApiError`
- [ ] AC2: Parses wrapped JSON error format: `{"json":{"errors":[["BAD_SR_NAME","invalid","sr"]]}}` with error code, message, and field
- [ ] AC3: Handles empty `{}` as success (not error) -- returns null/undefined, does not throw
- [ ] AC4: Detects jQuery callback format `[["call","attr",...]]` and throws descriptive error explaining `api_type=json` was likely missing
- [ ] AC5: All 4 formats have dedicated unit tests
- [ ] `RedditApiError` extends `Error` with structured properties: `status`, `code`, `message`, `field`
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: all 4 formats, multiple errors in wrapped format, unknown/unexpected response shapes
- [ ] Exported from `src/reddit/index.ts` barrel file
- [ ] TSDoc on `RedditApiError` class, `parseRedditResponse()` function, and error format types
- [ ] No lint warnings introduced

## Out of Scope
MCP-level error mapping (that's in individual tools).

## Implementation Notes
- Format 3 (jQuery) only happens without `api_type=json`, so it's a safety net
- The 4 formats are: (1) standard HTTP error, (2) wrapped JSON errors array, (3) jQuery/redirect, (4) empty object
- `RedditApiError` should extend `Error` and carry structured data for tools to map to MCP errors
- Consider a `parseRedditResponse()` function that handles all formats in one call

## Files to Create/Modify
- `src/reddit/errors.ts` — RedditApiError class and parse functions
- `src/reddit/index.ts` — export error types
- `src/__tests__/reddit/errors.test.ts` — tests for all 4 formats
