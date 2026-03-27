# E01-T04: Configure Linting and Formatting

| Field | Value |
|-------|-------|
| **Epic** | [E01 — Project Scaffolding](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E01-T01 |

## Description
Add ESLint (flat config) and Prettier. Configure for TypeScript ESM. Add `lint` and `format` npm scripts.

## Acceptance Criteria
1. `npm run lint` passes on existing code
2. `npm run format` auto-formats
3. ESLint enforces `no-unused-vars`, `no-explicit-any`, `consistent-type-imports`

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: FINAL-CONSOLIDATED-RESEARCH.md section 7 (tooling decisions)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Pre-commit hooks (can add later).

## Implementation Notes
- Use flat config (`eslint.config.js`), not `.eslintrc`
- Flat config is the ESLint v9+ standard
- Prettier and ESLint should not conflict (use `eslint-config-prettier` or equivalent)

## Files to Create/Modify
- `eslint.config.js` — ESLint flat config for TypeScript ESM
- `.prettierrc` — Prettier configuration
- `package.json` — add `lint` and `format` scripts, dev dependencies
