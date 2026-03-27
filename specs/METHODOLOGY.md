# Methodology

## Project Structure

Tasks are organized in atomic folder-based layout:

```
specs/
  README.md                              # Epic status tracker
  METHODOLOGY.md                         # This file -- DoR, DoD, estimation, templates
  DEPENDENCY-MAP.md                      # Full dependency graph
  epics/
    E01-project-scaffolding/
      EPIC.md                            # Goal, context, research refs, task index table
      E01-T01-initialize-npm-project.md  # Self-contained task ticket
      E01-T02-create-source-directory.md
      ...
    E02-core-infrastructure/
      EPIC.md
      E02-T01-reddit-http-client.md
      ...
```

Each epic folder contains:

- `EPIC.md` -- goal, context, research references, task index table with status
- `EXX-TYY-task-name.md` -- self-contained task ticket with metadata, ACs, DoR, DoD

Tasks are individual files, not sections inside an epic spec. Status is tracked in both the task file AND the EPIC.md task index table.

---

## Definition of Ready (DoR)

A task is **Ready** when all of the following are true:

1. **Dependencies resolved**: All predecessor tasks are Done, or the task has no dependencies
2. **Acceptance criteria written**: 2-5 concrete, testable criteria (not vague aspirations)
3. **Research consumed**: Implementer has read the relevant FINAL-CONSOLIDATED-RESEARCH.md sections
4. **Scope bounded**: Clear "not in scope" statement if any ambiguity exists
5. **Estimated**: Complexity estimate (S/M/L) reviewed

A task does NOT need: design mockups, formal sign-off, or a separate design doc. The epic EPIC.md IS the design doc.

### DoR Quality Standards

The DoR checklist in each task file must be **task-specific**, not boilerplate. The following standards apply:

**Minimum 4 checklist items.** Three items or fewer signals the DoR was copied from a template without tailoring.

**Dependency specificity.** Each dependency must be listed by task ID and title:

- GOOD: `Dependency: E01-T02 (Create Source Directory Structure) is Done -- src/index.ts and directory structure must exist`
- BAD: `Dependencies completed`

**Research specificity.** Each research reference must cite a specific section number and topic:

- GOOD: `Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 2 -- Server Construction Patterns (McpServer vs low-level Server, key method reference)`
- BAD: `Research sections read: 09-typescript-mcp-sdk-deep-dive.md`

**Understanding items.** The DoR must include items that show the implementer has internalized task-specific concepts:

- GOOD: `Understand: In stdio mode, NEVER use console.log() -- stdout is reserved for MCP protocol messages`
- BAD: (no understanding items at all)

**AC review item.** State the count and scope of ACs:

- GOOD: `ACs reviewed: 3 acceptance criteria covering lint pass, format command, and specific lint rules`
- BAD: `Acceptance criteria reviewed and clear`

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

### DoD Quality Standards

The DoD checklist in each task file must be **task-specific**, not boilerplate. The following standards apply:

**Minimum 6 checklist items.** Five items or fewer signals the DoD was copied from a template without tailoring.

**AC restatement.** Each acceptance criterion must be restated as a verifiable checklist item:

- GOOD: `AC1: npm run build (tsc) succeeds without errors`
- BAD: `All acceptance criteria met`

**Type-appropriate gates.** Different task types require different DoD gates:

| Task Type                         | Required DoD Gates                                        | NOT Required          |
| --------------------------------- | --------------------------------------------------------- | --------------------- |
| Config/scaffolding                | Config files created, commands work, no lint warnings     | Barrel exports, TSDoc |
| Source code (tool, module, class) | Barrel export, TSDoc on public API, tests written         | --                    |
| Test infrastructure               | Test runner works, sample test passes                     | Barrel exports        |
| Tool implementation               | Zod schema defined, tool registered, barrel export, TSDoc | --                    |
| Integration/packaging             | End-to-end verification, all components wired             | TSDoc on internals    |

**Build gate.** Every DoD must include `tsc --noEmit` or equivalent build verification.

**Specificity.** DoD items must reference concrete artifacts:

- GOOD: `src/server.ts creates McpServer instance with reddit_ping tool registration`
- BAD: `Server code is correct`

---

## Estimation Guide

| Size  | Meaning                                                     | Effort     | Examples                                             |
| ----- | ----------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| **S** | Well-understood, 1 file, clear pattern                      | 1-2 hours  | Barrel exports, config loading, single simple tool   |
| **M** | Some design decisions, 2-4 files, tests needed              | 2-6 hours  | HTTP client, rate limiter, most tools                |
| **L** | Complex logic, multiple integration points, extensive tests | 6-12 hours | Comment tree parsing, integration test suite, README |

---

## Epic File Template

Each `EPIC.md` follows this structure:

```markdown
# EXX: Epic Title

| Field                | Value       |
| -------------------- | ----------- |
| **Status**           | Not Started |
| **Dependencies**     | EXX (Name)  |
| **Tasks**            | N           |
| **Estimated Effort** | N-N hours   |

## Goal

One sentence describing the epic's outcome.

## Context

Background on what this epic implements and why.

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md sections: X, Y, Z
- research/XX-specific-doc.md

## Task Index

| ID                          | Title      | Size | Status      | Dependencies |
| --------------------------- | ---------- | :--: | ----------- | ------------ |
| [T01](EXX-T01-task-name.md) | Task Title |  S   | Not Started | None         |
| [T02](EXX-T02-task-name.md) | Task Title |  M   | Not Started | T01          |

## Success Criteria

- Concrete outcome 1
- Concrete outcome 2
```

---

## Task File Template

Each `EXX-TYY-task-name.md` is a self-contained task ticket:

```markdown
# EXX-TYY: Task Title

| Field            | Value                        |
| ---------------- | ---------------------------- |
| **Epic**         | [EXX -- Epic Title](EPIC.md) |
| **Status**       | Not Started                  |
| **Size**         | S/M/L                        |
| **Dependencies** | EXX-TYY, EXX-TYY             |

## Description

What to build and why, in 2-3 sentences.

## Acceptance Criteria

1. Testable criterion with concrete expected outcome
2. Testable criterion with concrete expected outcome
3. Testable criterion with concrete expected outcome

## Definition of Ready

- [ ] Dependency: EXX-TYY (Task Title) is Done -- [why this dependency matters]
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section N -- [Topic Name] ([what to look for])
- [ ] Research: Read research/NN-doc-name.md section N -- [Topic Name] ([what to look for])
- [ ] Understand: [Task-specific concept the implementer must internalize]
- [ ] Understand: [Another task-specific concept]
- [ ] ACs reviewed: N acceptance criteria covering [brief scope summary]

## Definition of Done

- [ ] AC1: [Restate AC1 as verifiable checklist item]
- [ ] AC2: [Restate AC2 as verifiable checklist item]
- [ ] AC3: [Restate AC3 as verifiable checklist item]
- [ ] `tsc --noEmit` passes with zero errors
- [ ] [Task-type-specific gate: e.g., barrel export, test coverage, config file created]
- [ ] [Task-type-specific gate: e.g., no lint warnings, TSDoc, Zod schema]
- [ ] [Additional concrete verification item]

## Out of Scope

What this task explicitly does NOT do.

## Implementation Notes

- Hints, gotchas, patterns to follow
- Links to relevant code or research

## Files to Create/Modify

- `path/to/file.ts` -- what this file does
- `path/to/other.ts` -- what this file does
```

---

## Task-Specific DoR/DoD Examples

### Example: Config/Scaffolding Task (E01-T01 style)

```markdown
## Definition of Ready

- [ ] No dependencies (this is the first task)
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 6 -- Technology Stack Decision (TypeScript + Direct HTTP, key dependencies table)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 9 -- Production Deployment (package.json configuration, file structure)
- [ ] Understand: "type": "module" is required for ESM compatibility with MCP SDK
- [ ] Understand: MCP SDK minimum version is ^1.28.0 (security fix floor)
- [ ] ACs reviewed: 3 acceptance criteria covering tsc build, tsconfig settings, package.json configuration

## Definition of Done

- [ ] AC1: `npm run build` (tsc) succeeds without errors
- [ ] AC2: `tsconfig.json` has "module": "NodeNext", "target": "ES2022", "strict": true
- [ ] AC3: `package.json` has "type": "module" and "bin" entry pointing to dist/index.js
- [ ] `tsc --noEmit` passes with zero errors
- [ ] All npm scripts defined and functional: build, dev, test, lint
- [ ] Dependencies installed: @modelcontextprotocol/sdk ^1.28.0, zod v4, typescript 5.x, vitest, tsx
- [ ] No lint warnings from tsconfig or package.json configuration
- [ ] .gitignore includes node_modules/ and dist/
```

Note: No barrel export or TSDoc required -- this is a config task.

### Example: Source Code Module Task (E02-T01 style)

```markdown
## Definition of Ready

- [ ] Dependency: E01-T03 (Wire STDIO Transport) is Done -- HTTP client needs working server shell
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 2 -- Reddit API Conventions (raw_json=1, api_type=json, User-Agent format)
- [ ] Research: Read research/07-api-edge-cases-and-gotchas.md section 3 -- HTTP Edge Cases (retry logic, timeout values)
- [ ] Understand: Always send raw_json=1 on GET requests to get unescaped HTML
- [ ] Understand: User-Agent must follow format: platform:app_id:version (by /u/username)
- [ ] ACs reviewed: 4 acceptance criteria covering GET/POST conventions, User-Agent, error handling

## Definition of Done

- [ ] AC1: GET requests automatically append raw_json=1 query parameter
- [ ] AC2: POST requests automatically include api_type=json in body
- [ ] AC3: User-Agent header follows Reddit format specification
- [ ] AC4: HTTP errors are caught and wrapped in typed error objects
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover GET convention, POST convention, User-Agent, error wrapping
- [ ] RedditHttpClient exported from src/index.ts barrel file
- [ ] TSDoc comments on RedditHttpClient class and all public methods
- [ ] No lint warnings introduced
```

### Example: Tool Implementation Task (E04-TXX style)

```markdown
## Definition of Ready

- [ ] Dependency: E02-T04 (Reddit Thing Types) is Done -- tool needs Post type definitions
- [ ] Dependency: E03-T06 (Auth Guard) is Done -- tool needs auth tier checking
- [ ] Research: Read FINAL-CONSOLIDATED-RESEARCH.md section 3.1 -- Listing Endpoints (pagination, after/before params)
- [ ] Research: Read research/01-reddit-official-api.md section on GET /r/{subreddit}/hot
- [ ] Understand: Reddit listings return max 100 items per request, default 25
- [ ] Understand: Tool naming convention is {action}\_{resource} (e.g., get_subreddit_posts)
- [ ] ACs reviewed: 5 acceptance criteria covering Zod schema, pagination, sorting, auth tier, error handling

## Definition of Done

- [ ] AC1: Zod schema validates subreddit name, sort order, limit, and after parameters
- [ ] AC2: Supports hot/new/top/rising sort with time filter for top
- [ ] AC3: Returns normalized Post[] with consistent field names
- [ ] AC4: Requires minimum auth tier 1 (anonymous)
- [ ] AC5: Returns clear error for invalid subreddit or API failures
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Tool registered in server with correct name and description
- [ ] get_subreddit_posts exported from tools barrel file
- [ ] TSDoc on tool function documenting parameters, return type, and auth requirements
- [ ] Unit tests: valid request, pagination, each sort order, invalid subreddit error
- [ ] No lint warnings introduced
```

---

## Conventions

### Task IDs

- Format: `EXX-TYY` (e.g., `E02-T03`)
- Sequential within each epic
- Referenced in dependency fields

### Status Flow

```
Not Started --> In Progress --> Done
```

### Status Tracking

Status is tracked in TWO places (must always be in sync):

1. The task file's metadata table (`| **Status** | ... |`)
2. The EPIC.md's task index table (`| T01 | ... | Status | ... |`)

When an epic's status changes, also update `specs/README.md`.

### File Naming

- Epic folders: `EXX-kebab-case-name/`
- Epic files: `EPIC.md` (inside the epic folder)
- Task files: `EXX-TYY-kebab-case-name.md` (inside the epic folder)

### Research References

- Always cite specific sections of FINAL-CONSOLIDATED-RESEARCH.md by number and topic
- Link to individual research docs when a task needs deep detail
- Include what to look for in the cited section, not just the section number
