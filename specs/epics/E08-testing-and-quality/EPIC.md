# E08: Testing and Quality

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Dependencies** | E01-T05 (test infra exists) |
| **Tasks** | 6 |
| **Estimated Effort** | 16-28 hours |

## Goal
Comprehensive test coverage across unit, integration, and E2E levels. This epic runs in parallel with E04-E06 -- individual test tasks start as the code they test is written.

## Context
Testing strategy from research: MCP Inspector for dev-time manual testing, InMemoryTransport for CI-friendly integration tests, subprocess transport for E2E tests. Unit tests mock `fetch` and verify internal logic. Integration tests use real `McpServer` with `InMemoryTransport` and mocked `RedditClient`. E2E tests spawn the server as a subprocess and connect via STDIO.

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md section: 7.4
- research/09-typescript-mcp-sdk-deep-dive.md (testing section)

## Task Index

| ID | Title | Size | Status | Dependencies |
|----|-------|:----:|--------|-------------|
| [T01](E08-T01-unit-tests-infra.md) | Unit tests -- Reddit client, rate limiter, error parser | M | Not Started | E02 |
| [T02](E08-T02-unit-tests-auth.md) | Unit tests -- Auth manager | M | Not Started | E03 |
| [T03](E08-T03-unit-tests-safety.md) | Unit tests -- Safety layer | S | Not Started | E05-T01, E05-T02 |
| [T04](E08-T04-integration-tests.md) | Integration tests -- Tool round-trips via InMemoryTransport | L | Not Started | E04, E05, E06 |
| [T05](E08-T05-e2e-tests.md) | E2E tests -- Subprocess transport | L | Not Started | E08-T04 |
| [T06](E08-T06-ci-configuration.md) | CI configuration -- GitHub Actions | M | Not Started | E08-T01, E08-T02, E08-T03, E08-T04 |

## Success Criteria
- 90%+ branch coverage on core infrastructure files (client, rate limiter, errors, auth)
- At least 1 integration test per tool (25+ minimum)
- E2E test proves full server lifecycle (start, connect, call, shutdown)
- CI pipeline runs on push to main and on PRs
- All tests pass without real Reddit credentials
- Node 18 and 20 matrix in CI
