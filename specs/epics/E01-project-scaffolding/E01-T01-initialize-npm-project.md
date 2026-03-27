# E01-T01: Initialize npm Project and TypeScript

| Field | Value |
|-------|-------|
| **Epic** | [E01 — Project Scaffolding](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | None |

## Description
Create `package.json` with `"type": "module"`, install `@modelcontextprotocol/sdk@^1.28.0`, `zod@^4`, TypeScript 5.x, vitest, tsx. Configure `tsconfig.json` targeting ES2022/NodeNext.

## Acceptance Criteria
1. `npm run build` (tsc) succeeds
2. `tsconfig.json` has `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`
3. `package.json` has `"type": "module"` and `"bin"` entry pointing to built index

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md sections 6, 7; research/09-typescript-mcp-sdk-deep-dive.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Source code beyond config files.

## Implementation Notes
- Use `tsx` for dev mode (`npm run dev`)
- `"type": "module"` is required for ESM compatibility with MCP SDK
- Pin MCP SDK to `^1.28.0` minimum for stable `McpServer` API

## Files to Create/Modify
- `package.json` — project manifest with type, bin, scripts, dependencies
- `tsconfig.json` — TypeScript compiler configuration
