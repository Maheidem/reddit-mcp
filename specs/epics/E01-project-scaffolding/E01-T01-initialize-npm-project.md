# E01-T01: Initialize npm Project and TypeScript

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Epic**         | [E01 — Project Scaffolding](EPIC.md) |
| **Status**       | Done                                 |
| **Size**         | S                                    |
| **Dependencies** | None                                 |

## Description

Create `package.json` with `"type": "module"`, install `@modelcontextprotocol/sdk@^1.28.0`, `zod@^4`, TypeScript 5.x, vitest, tsx. Configure `tsconfig.json` targeting ES2022/NodeNext.

## Acceptance Criteria

1. `npm run build` (tsc) succeeds
2. `tsconfig.json` has `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`
3. `package.json` has `"type": "module"` and `"bin"` entry pointing to built index

## Definition of Ready

- [ ] No dependencies (this is the first task)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 6 -- Technology Stack Decision (TypeScript + Direct HTTP, key dependencies table)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 7.1 -- System Architecture diagram (understand HTTP client, auth, safety layers that will live in this project)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 1 -- SDK Version & Package Structure (v1.28.0 requirements, Zod v4 peer dependency)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 9 -- Production Deployment (package.json configuration, file structure, npm scripts)
- [ ] Understand: `"type": "module"` is required for ESM compatibility with MCP SDK
- [ ] Understand: MCP SDK minimum version is ^1.28.0 (security fix GHSA-345p-7cg4-v4c7 hard floor at v1.26.0)
- [ ] ACs reviewed: 3 acceptance criteria covering tsc build, tsconfig settings, package.json configuration

## Definition of Done

- [ ] AC1: `npm run build` (tsc) succeeds without errors
- [ ] AC2: `tsconfig.json` has `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`
- [ ] AC3: `package.json` has `"type": "module"` and `"bin"` entry pointing to `dist/index.js`
- [ ] `tsc --noEmit` passes with zero errors
- [ ] All npm scripts defined and functional: `build` (tsc), `dev` (tsx), `test` (vitest), `lint`
- [ ] Dependencies installed: `@modelcontextprotocol/sdk` ^1.28.0, `zod` v4, `typescript` 5.x, `vitest`, `tsx`
- [ ] No lint warnings from tsconfig or package.json configuration
- [ ] `.gitignore` includes `node_modules/` and `dist/`

## Out of Scope

Source code beyond config files.

## Implementation Notes

- Use `tsx` for dev mode (`npm run dev`)
- `"type": "module"` is required for ESM compatibility with MCP SDK
- Pin MCP SDK to `^1.28.0` minimum for stable `McpServer` API

## Files to Create/Modify

- `package.json` — project manifest with type, bin, scripts, dependencies
- `tsconfig.json` — TypeScript compiler configuration
