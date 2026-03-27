# E09-T04: CHANGELOG and Release Process

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E09 — Packaging and Release](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | S                                      |
| **Dependencies** | E09-T01                                |

## Description

Create CHANGELOG.md. Document release process. Add `release` npm script.

## Acceptance Criteria

1. CHANGELOG follows Keep a Changelog format
2. Release script: build → test → version bump
3. First entry documents v1.0.0 feature set

## Definition of Ready

- [ ] E09-T01 (npm packaging) is Done -- version number and package metadata finalized
- [ ] FINAL section 10 read: complete tool inventory for v1.0.0 feature list
- [ ] FINAL section 12 read: resources and prompts list for v1.0.0 feature documentation
- [ ] Keep a Changelog format understood: https://keepachangelog.com/
- [ ] Semver versioning rules understood for v1.0.0 initial release

## Definition of Done

- [ ] `CHANGELOG.md` follows Keep a Changelog format with `## [Unreleased]` and `## [1.0.0]` sections
- [ ] v1.0.0 entry lists all 25 tools, 6 resources, 4 prompts, 3 auth tiers, and transport modes
- [ ] CHANGELOG categorizes changes correctly: Added, Changed, Fixed, etc.
- [ ] `package.json` has `release` npm script that runs build -> test -> version bump
- [ ] Release script uses `npm version` for semver bumps (not manual editing)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

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
