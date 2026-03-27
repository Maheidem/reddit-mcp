# E09-T01: npm Packaging Configuration

| Field | Value |
|-------|-------|
| **Epic** | [E09 — Packaging and Release](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E04, E05, E06 |

## Description
Finalize `package.json`: `bin` entry, `files` whitelist, `engines`, `keywords`, `description`, `repository`. Add `prepublishOnly` script. Ensure `npx reddit-mcp-server` works.

## Acceptance Criteria
1. `npm pack` produces clean tarball (no tests, research, specs)
2. `npx reddit-mcp-server` starts the server
3. `files` field excludes tests, research, specs, .github
4. `engines` specifies Node >= 18
5. `prepublishOnly` runs build + test

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
npm publish automation (manual for v1.0)

## Implementation Notes
- Package name: `reddit-mcp-server` (check npm availability)
- `bin` entry must point to compiled JS entry point with shebang
- `files` whitelist is safer than `.npmignore` for controlling tarball contents
- Test with `npm pack --dry-run` to verify included files

## Files to Create/Modify
- `package.json` — add bin, files, engines, keywords, prepublishOnly
- `src/index.ts` — ensure shebang line for npx execution
