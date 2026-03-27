# E08: Testing and Quality

## Status: Not Started

## Goal
Establish comprehensive test coverage across unit, integration, and E2E levels. This epic runs in parallel with E04-E06.

## Dependencies
- E01-T05 (test infrastructure exists)
- Individual test tasks start as code they test is written

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md section: 7.4
- research/09-typescript-mcp-sdk-deep-dive.md (testing section)

## Tasks

### E08-T01: Unit tests — Reddit client, rate limiter, error parser
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02
- **Description**: Full unit test suite for `src/reddit/client.ts`, `rate-limiter.ts`, `errors.ts`. Mock `fetch`. Test all 4 error formats. Test token bucket math.
- **Acceptance Criteria**:
  1. Client tests verify headers, URL construction, `raw_json=1` injection
  2. Rate limiter tests verify blocking, refill math, header sync
  3. Error parser tests cover all 4 Reddit error formats
  4. 90%+ branch coverage on these 3 files
- **Out of Scope**: Integration-level testing (E08-T04)
- **Notes**: Use `vi.useFakeTimers()` for rate limiter timing tests

### E08-T02: Unit tests — Auth manager
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03
- **Description**: Test all 3 auth tiers. Mock token endpoint. Verify 50-min refresh. Test tier detection from env vars.
- **Acceptance Criteria**:
  1. Tests for each tier's token acquisition flow
  2. Test for auto-refresh at 50-minute mark
  3. Test for graceful degradation chain (tier 3 → 2 → 1)
  4. Test env var parsing edge cases (partial config, invalid values)
- **Out of Scope**: Real Reddit OAuth calls
- **Notes**: Mock `fetch` for token endpoint responses

### E08-T03: Unit tests — Safety layer
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E05-T01, E05-T02
- **Description**: Test content validation (length limits, Unicode), bot disclosure, duplicate detection.
- **Acceptance Criteria**:
  1. Boundary tests at exactly 300/40000/10000 chars (pass) and 301/40001/10001 (fail)
  2. Unicode emoji counted as 1 character
  3. Bot footer append tested (present, correct format)
  4. Duplicate detection hash match tested
- **Out of Scope**: Snudown rendering tests
- **Notes**: Use known Unicode strings for character counting tests

### E08-T04: Integration tests — Tool round-trips via InMemoryTransport
- **Status**: Not Started
- **Size**: L
- **Dependencies**: E04, E05, E06
- **Description**: For each tool category (read, write, mod), create integration tests using real `McpServer` with `InMemoryTransport` and mocked `RedditClient`. Verify full flow: tool call → validation → API call → response formatting.
- **Acceptance Criteria**:
  1. At least 1 integration test per tool (25 minimum)
  2. Tests use `InMemoryTransport` (no network)
  3. Tests verify Zod schema validation rejects bad inputs
  4. Tests verify error responses use `isError: true`
- **Out of Scope**: Real Reddit API calls
- **Notes**: Create a test helper that sets up `McpServer` + `InMemoryTransport` + mocked client

### E08-T05: E2E test — subprocess transport
- **Status**: Not Started
- **Size**: L
- **Dependencies**: E08-T04
- **Description**: Spawn server as subprocess, connect via STDIO, call 3 tools (1 read, 1 write, 1 mod), verify responses. Uses mocked Reddit API (env var to enable test mode).
- **Acceptance Criteria**:
  1. Server starts as subprocess via `node dist/index.js`
  2. MCP client connects via STDIO transport
  3. Tool calls succeed and return expected data
  4. Server shuts down cleanly (no zombie processes)
  5. Runs in CI without real Reddit credentials
- **Out of Scope**: Real Reddit API calls, performance testing
- **Notes**: Use `SubprocessTransport` or spawn directly with `child_process`

### E08-T06: CI configuration (GitHub Actions)
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E08-T01 through E08-T04
- **Description**: Create GitHub Actions workflow: lint → type-check → unit tests → integration tests on push/PR. Cache node_modules.
- **Acceptance Criteria**:
  1. CI runs on push to main and on PR
  2. All test suites pass in CI
  3. Node modules cached for speed
  4. Fails fast on lint/type errors (before tests)
  5. Node 18 and 20 matrix
- **Out of Scope**: Deployment, npm publish automation
- **Notes**: Use `actions/setup-node@v4` with caching
