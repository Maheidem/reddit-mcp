# E08-T06: CI Configuration -- GitHub Actions

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E08 -- Testing and Quality](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | M                                     |
| **Dependencies** | E08-T01, E08-T02, E08-T03, E08-T04    |

## Description

Create GitHub Actions workflow: lint -> type-check -> unit tests -> integration tests on push/PR. Cache node_modules.

## Acceptance Criteria

1. CI runs on push to main and on PR
2. All test suites pass in CI
3. Node modules cached for speed
4. Fails fast on lint/type errors (before tests)
5. Node 18 and 20 matrix

## Definition of Ready

- [ ] E08-T01, E08-T02, E08-T03 (unit test suites) are Done and passing
- [ ] E08-T04 (integration tests) is Done and passing
- [ ] GitHub Actions workflow syntax understood: `actions/setup-node@v4`, matrix strategy, caching
- [ ] Pipeline ordering decided: install -> lint -> type-check -> unit tests -> integration tests (fail fast)
- [ ] Node version matrix confirmed: [18, 20]

## Definition of Done

- [ ] `.github/workflows/ci.yml` created with valid GitHub Actions syntax
- [ ] CI triggers on push to main and on pull requests
- [ ] Pipeline fails fast: lint and type-check run before tests (if lint fails, tests don't run)
- [ ] Node modules cached using `actions/setup-node@v4` with cache key based on `package-lock.json` hash
- [ ] Matrix strategy runs all steps on Node 18 and Node 20
- [ ] All existing test suites (unit + integration) pass in CI
- [ ] Workflow runs green on a real push (verified by running the workflow)
- [ ] No dev/test artifacts or secrets leaking in CI logs
- [ ] `tsc --noEmit` passes with zero errors

## Out of Scope

Deployment, npm publish automation.

## Implementation Notes

- Use `actions/setup-node@v4` with caching
- Pipeline order: install -> lint -> type-check -> unit tests -> integration tests
- Fail fast: if lint fails, don't run tests
- Matrix: `node-version: [18, 20]`
- Cache key should include `package-lock.json` hash
- Consider separate jobs for lint/typecheck vs tests for parallelism

## Files to Create/Modify

- `.github/workflows/ci.yml` -- GitHub Actions CI workflow
