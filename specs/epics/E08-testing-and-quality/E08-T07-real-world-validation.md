# E08-T07: Real-World Validation — Playwright Browser Tests

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E08 -- Testing and Quality](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | L                                     |
| **Dependencies** | E08-T05, E09-T01                      |

## Description

Automated Playwright browser tests that validate the MCP server against real Reddit. The server creates/reads/deletes content on r/test, and Playwright opens reddit.com to visually verify each action actually happened. These tests require real credentials and are skipped in CI — they run locally as the final validation gate before release.

## Acceptance Criteria

1. Playwright test starts the MCP server, connects as a client, and invokes tools against real Reddit
2. Read validation: search r/test, verify returned post titles match what browser sees on reddit.com/r/test
3. Write validation: create a post on r/test via MCP, navigate browser to r/test/new, assert post title appears on page
4. Write validation: comment on the created post via MCP, navigate to post page, assert comment text + bot footer visible
5. Cleanup: delete the created post and comment after validation
6. Tests are skipped when `REDDIT_CLIENT_ID` is not set (CI-safe)

## Definition of Ready

- [ ] Dependency: E08-T05 (E2E subprocess tests) is Done — subprocess patterns established
- [ ] Dependency: E09-T01 (npm packaging) is Done — server can be started via built entry point
- [ ] Playwright installed and configured in the project
- [ ] Understand: Playwright runs headless by default, headed mode for local debugging
- [ ] Understand: r/test is the only allowed subreddit for write operations
- [ ] Understand: Tests must clean up (delete) all created content after assertions
- [ ] Real Reddit credentials available in .env (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD)
- [ ] ACs reviewed: 6 acceptance criteria covering read validation, write validation, browser verification, and cleanup

## Definition of Done

- [ ] AC1: Playwright test starts MCP server as subprocess, connects via STDIO, and invokes tools with real Reddit API responses
- [ ] AC2: Read test — calls search/get_subreddit_posts on r/test, navigates browser to reddit.com/r/test, verifies at least one returned title appears on the page
- [ ] AC3: Write test — calls create_post on r/test with unique title, navigates to reddit.com/r/test/new, asserts the exact title appears
- [ ] AC4: Comment test — calls create_comment on the created post, navigates to post permalink, asserts comment text and bot disclosure footer are visible
- [ ] AC5: Cleanup — calls delete_content on both comment and post, verifies deletion (post page shows [deleted])
- [ ] AC6: Tests skip gracefully when REDDIT_CLIENT_ID is not set (no failures in CI)
- [ ] Playwright config file created (playwright.config.ts) with reasonable timeouts for Reddit page loads
- [ ] Test script added to package.json: `test:e2e:real` (separate from `test` to avoid running in CI)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings

## Out of Scope

- Moderation tool browser validation (requires being a mod of a subreddit)
- Performance testing
- Cross-browser testing (Chromium only is fine)
- CI integration (these run locally only)

## Implementation Notes

- Use `@playwright/test` package
- Start the MCP server as a subprocess (reuse pattern from E08-T05)
- Connect to it via MCP client over STDIO
- For browser assertions, navigate to reddit.com pages and use Playwright selectors
- Reddit pages may take 2-5 seconds to reflect new content — add appropriate waits
- Generate unique post titles with timestamps to avoid collision
- Always clean up: delete created content in test teardown (even on failure)
- Run with: `npx playwright test` or `npm run test:e2e:real`
- Skip mechanism: check for env var in test setup, call `test.skip()` if missing

## Files to Create/Modify

- `playwright.config.ts` — Playwright configuration
- `tests/e2e/real-world.spec.ts` — Playwright test file
- `package.json` — add `test:e2e:real` script and `@playwright/test` devDependency
