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
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (project structure section)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
