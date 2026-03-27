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
- [ ] Dependency: E01-T01 (Initialize npm Project and TypeScript) is Done -- package.json must exist for adding lint/format dev dependencies and scripts
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 6 -- Technology Stack Decision (TypeScript 5.x, ESM requirements)
- [ ] Understand: ESLint v9+ uses flat config (`eslint.config.js`), not legacy `.eslintrc` format
- [ ] Understand: Prettier and ESLint must not conflict -- use `eslint-config-prettier` or equivalent
- [ ] Understand: TypeScript ESM projects need ESLint configured for `"type": "module"` and NodeNext module resolution
- [ ] ACs reviewed: 3 acceptance criteria covering lint pass, format command, and specific lint rules

## Definition of Done
- [ ] AC1: `npm run lint` passes on all existing project code without errors
- [ ] AC2: `npm run format` auto-formats code using Prettier
- [ ] AC3: ESLint enforces `no-unused-vars`, `no-explicit-any`, `consistent-type-imports`
- [ ] `eslint.config.js` uses flat config format (ESLint v9+)
- [ ] `.prettierrc` configuration file created
- [ ] `package.json` updated with `lint` and `format` scripts and all lint/format dev dependencies
- [ ] Prettier and ESLint do not conflict on any existing files
- [ ] `tsc --noEmit` still passes after adding configuration

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
