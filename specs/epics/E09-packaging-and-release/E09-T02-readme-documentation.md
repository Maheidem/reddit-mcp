# E09-T02: README Documentation

| Field | Value |
|-------|-------|
| **Epic** | [E09 — Packaging and Release](EPIC.md) |
| **Status** | Not Started |
| **Size** | L |
| **Dependencies** | E09-T01 |

## Description
Comprehensive README: installation, config (env vars), all 25 tools with descriptions, MCP client config examples, auth tier explanation, troubleshooting.

## Acceptance Criteria
1. Installation section with npm and npx
2. All 25 tools documented with parameter tables
3. Config examples for Claude Desktop, Claude Code, Cursor
4. Auth tier table with env var requirements
5. Troubleshooting for common errors (auth, rate limits, permissions)

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL sections 6, 7; research/09
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
API reference docs (TSDoc covers this)

## Implementation Notes
- README is the first thing users see — make it excellent
- Structure: badges, one-liner, install, quick start, tools table, config, auth, troubleshooting, contributing
- Each tool needs: name, description, parameters, auth tier required
- Config examples must be copy-paste ready with correct JSON

## Files to Create/Modify
- `README.md` — complete rewrite with all sections
