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
- [ ] E09-T01 (npm packaging) is Done -- final tool list and package name confirmed
- [ ] FINAL section 10 read: complete tool inventory with all 25 Phase 1 tools, their names, and auth tiers
- [ ] FINAL section 3 read: 3-tier auth system (env var requirements per tier)
- [ ] FINAL section 12 read: all 6 resources and 4 prompts documented
- [ ] MCP client config formats understood: Claude Desktop JSON, Claude Code settings, Cursor config

## Definition of Done
- [ ] README has installation section with both `npm install` and `npx` usage
- [ ] All 25 tools documented with name, description, parameter table, and required auth tier
- [ ] Config examples for Claude Desktop, Claude Code, and Cursor are copy-paste ready with correct JSON
- [ ] Auth tier table clearly shows which env vars are needed for each tier (Tier 1: none, Tier 2: client_id + secret, Tier 3: + refresh_token)
- [ ] Troubleshooting section covers common errors: auth failures, rate limits, permission denied, missing credentials
- [ ] README structure: badges, one-liner, install, quick start, tools table, resources, prompts, config, auth, troubleshooting, contributing
- [ ] All tool names, parameter names, and env var names match actual implementation exactly
- [ ] `tsc --noEmit` passes with zero errors (no code changes, but verify no regressions)

## Out of Scope
API reference docs (TSDoc covers this)

## Implementation Notes
- README is the first thing users see — make it excellent
- Structure: badges, one-liner, install, quick start, tools table, config, auth, troubleshooting, contributing
- Each tool needs: name, description, parameters, auth tier required
- Config examples must be copy-paste ready with correct JSON

## Files to Create/Modify
- `README.md` — complete rewrite with all sections
