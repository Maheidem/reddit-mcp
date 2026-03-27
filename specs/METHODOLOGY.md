# Methodology

## Definition of Ready (DoR)

A task is **Ready** when all of the following are true:

1. **Dependencies resolved**: All predecessor tasks are Done, or the task has no dependencies
2. **Acceptance criteria written**: 2-5 concrete, testable criteria (not vague aspirations)
3. **Research consumed**: Implementer has read the relevant FINAL-CONSOLIDATED-RESEARCH.md sections
4. **Scope bounded**: Clear "not in scope" statement if any ambiguity exists
5. **Estimated**: Complexity estimate (S/M/L) reviewed

A task does NOT need: design mockups, formal sign-off, or a separate design doc. The epic spec IS the design doc.

---

## Definition of Done (DoD)

A task is **Done** when all of the following are true:

1. **Compiles**: `tsc --noEmit` passes with zero errors
2. **Tests pass**: All existing tests pass. New code has tests matching acceptance criteria
3. **ACs met**: Every acceptance criterion demonstrably satisfied
4. **No regressions**: Full test suite produces no new failures
5. **Exports clean**: New public API exported from appropriate barrel file (`index.ts`)
6. **Documented**: Public functions/classes have TSDoc comments. README updated if user-facing
7. **Lint clean**: No new lint warnings

A task does NOT need: performance benchmarks, 100% coverage, or external review.

---

## Estimation Guide

| Size | Meaning | Effort | Examples |
|------|---------|--------|----------|
| **S** | Well-understood, 1 file, clear pattern | 1-2 hours | Barrel exports, config loading, single simple tool |
| **M** | Some design decisions, 2-4 files, tests needed | 2-6 hours | HTTP client, rate limiter, most tools |
| **L** | Complex logic, multiple integration points, extensive tests | 6-12 hours | Comment tree parsing, integration test suite, README |

---

## Epic Spec Template

Each epic file follows this structure:

```markdown
# EXX: Epic Title

## Status: [Not Started | In Progress | Done]

## Goal
One sentence describing the epic's outcome.

## Dependencies
- EXX (Name) — must be Done

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: X, Y, Z
- research/XX-specific-doc.md

## Tasks

### EXX-T01: Task Title
- **Status**: [Not Started | In Progress | Done]
- **Size**: S/M/L
- **Dependencies**: EXX-TYY
- **Description**: What to build
- **Acceptance Criteria**:
  1. Testable criterion
  2. Testable criterion
- **Out of Scope**: What this does NOT do
- **Notes**: Implementation hints, gotchas
```

---

## Conventions

### Task IDs
- Format: `EXX-TYY` (e.g., `E02-T03`)
- Sequential within each epic
- Referenced in dependency fields

### Status Flow
```
Not Started → In Progress → Done
```

### Naming
- Epic files: `EXX-kebab-case-name.md`
- No sub-task files — tasks live inside their epic spec
- ADRs in `decisions/`: `ADR-NNN-kebab-case.md`

### Research References
- Always cite specific sections of FINAL-CONSOLIDATED-RESEARCH.md
- Link to individual research docs when a task needs deep detail
