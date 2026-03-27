# E01-T02: Create Source Directory Structure

| Field | Value |
|-------|-------|
| **Epic** | [E01 — Project Scaffolding](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E01-T01 |

## Description
Create `src/` with subdirectories: `reddit/`, `tools/`, `resources/`, `prompts/`, `utils/`. Create barrel `index.ts` files. Match the layout from research doc 09.

## Acceptance Criteria
1. Directory tree matches prescribed layout
2. Each subdirectory has an `index.ts` barrel
3. `src/index.ts` entry point exists and is referenced by `package.json` bin

## Definition of Ready
- [ ] Dependency: E01-T01 (Initialize npm Project and TypeScript) is Done -- package.json and tsconfig.json must exist to compile barrel files
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 9 -- Production Deployment (file structure showing `src/reddit/`, `src/tools/`, `src/resources/`, `src/prompts/`, `src/utils/`)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 7.1 -- System Architecture diagram (understand which layers map to which directories)
- [ ] Understand: Barrel files (`index.ts`) use placeholder exports only at this stage -- no implementation code
- [ ] Understand: `src/index.ts` is the entry point referenced by `package.json` `"bin"` field
- [ ] ACs reviewed: 3 acceptance criteria covering directory tree, barrel files, entry point

## Definition of Done
- [ ] AC1: Directory tree matches prescribed layout: `src/reddit/`, `src/tools/`, `src/resources/`, `src/prompts/`, `src/utils/`
- [ ] AC2: Each subdirectory has an `index.ts` barrel file with placeholder exports
- [ ] AC3: `src/index.ts` entry point exists and is referenced by `package.json` `"bin"` field
- [ ] `tsc --noEmit` passes with zero errors (all barrels compile)
- [ ] `npm run build` succeeds
- [ ] No lint warnings introduced

## Out of Scope
Actual implementation code. Barrels should have placeholder exports only.

## Implementation Notes
- Keep barrels empty with placeholder exports
- The directory structure sets conventions for where all future code lives
- `src/index.ts` is the entry point referenced by `package.json` `"bin"`

## Files to Create/Modify
- `src/index.ts` — main entry point
- `src/reddit/index.ts` — Reddit client barrel
- `src/tools/index.ts` — tools barrel
- `src/resources/index.ts` — resources barrel
- `src/prompts/index.ts` — prompts barrel
- `src/utils/index.ts` — utilities barrel
