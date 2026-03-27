# E09-T04: CHANGELOG and Release Process

| Field | Value |
|-------|-------|
| **Epic** | [E09 — Packaging and Release](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E09-T01 |

## Description
Create CHANGELOG.md. Document release process. Add `release` npm script.

## Acceptance Criteria
1. CHANGELOG follows Keep a Changelog format
2. Release script: build → test → version bump
3. First entry documents v1.0.0 feature set

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL sections 6, 7
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Automated publishing, semantic-release

## Implementation Notes
- Follow semver strictly
- Keep a Changelog format: https://keepachangelog.com/
- v1.0.0 entry should list all 25 tools, auth tiers, transport modes
- Release script should be a simple npm script, not a complex CI pipeline

## Files to Create/Modify
- `CHANGELOG.md` — initial changelog with v1.0.0 entry
- `package.json` — add release script
