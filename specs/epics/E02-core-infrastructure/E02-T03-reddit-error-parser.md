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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 11; research/07-api-edge-cases-and-gotchas.md (error formats)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
