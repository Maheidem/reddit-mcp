# E09-T01: npm Packaging Configuration

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Epic**         | [E09 — Packaging and Release](EPIC.md) |
| **Status**       | Done                                   |
| **Size**         | M                                      |
| **Dependencies** | E04, E05, E06                          |

## Description

Finalize `package.json`: `bin` entry, `files` whitelist, `engines`, `keywords`, `description`, `repository`. Add `prepublishOnly` script. Ensure `npx @marcos-heidemann/reddit-mcp` works.

## Acceptance Criteria

1. `npm pack` produces clean tarball (no tests, research, specs)
2. `npx @marcos-heidemann/reddit-mcp` starts the server
3. `files` field excludes tests, research, specs, .github
4. `engines` specifies Node >= 18
5. `prepublishOnly` runs build + test

## Definition of Ready

- [ ] E04 (Read Tools), E05 (Write Tools), and E06 (Mod Tools) are Done -- all 25 tools functional
- [ ] FINAL section 6 read: technology stack decisions (TypeScript, direct HTTP, MCP SDK)
- [ ] FINAL section 7.2 read: transport strategy (STDIO primary, Streamable HTTP optional)
- [ ] research/09-typescript-mcp-sdk-deep-dive.md read: packaging patterns for MCP servers
- [ ] npm `bin`, `files`, `engines`, and `prepublishOnly` configuration patterns understood
- [ ] Package name `@marcos-heidemann/reddit-mcp` availability on npm checked

## Definition of Done

- [ ] `npm pack --dry-run` produces clean tarball with no tests, research, specs, or .github included
- [ ] `npx @marcos-heidemann/reddit-mcp` starts the server successfully (bin entry points to compiled JS with shebang)
- [ ] `files` field whitelists only production artifacts (dist/, README, LICENSE, CHANGELOG)
- [ ] `engines` field specifies `"node": ">=18"`
- [ ] `prepublishOnly` script runs `npm run build && npm test` before any publish
- [ ] `package.json` has complete metadata: `description`, `keywords`, `repository`, `license`, `author`
- [ ] `src/index.ts` has `#!/usr/bin/env node` shebang line for npx execution
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced

## Out of Scope

npm publish automation (manual for v1.0)

## Implementation Notes

- Package name: `@marcos-heidemann/reddit-mcp` (check npm availability)
- `bin` entry must point to compiled JS entry point with shebang
- `files` whitelist is safer than `.npmignore` for controlling tarball contents
- Test with `npm pack --dry-run` to verify included files

## Files to Create/Modify

- `package.json` — add bin, files, engines, keywords, prepublishOnly
- `src/index.ts` — ensure shebang line for npx execution
