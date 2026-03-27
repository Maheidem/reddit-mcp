# E08-T06: CI Configuration -- GitHub Actions

| Field | Value |
|-------|-------|
| **Epic** | [E08 -- Testing and Quality](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E08-T01, E08-T02, E08-T03, E08-T04 |

## Description
Create GitHub Actions workflow: lint -> type-check -> unit tests -> integration tests on push/PR. Cache node_modules.

## Acceptance Criteria
1. CI runs on push to main and on PR
2. All test suites pass in CI
3. Node modules cached for speed
4. Fails fast on lint/type errors (before tests)
5. Node 18 and 20 matrix

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: GitHub Actions docs for Node.js projects
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
