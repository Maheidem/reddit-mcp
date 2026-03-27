---
name: spec-workflow
description: Deterministic state-machine workflow for spec-driven development on the Reddit MCP Server. Find next ready task, run quality gate on task file, verify Definition of Ready item-by-item, guide implementation, verify Definition of Done with evidence, update status, and suggest next task. Use when user says "let's work", "what's next", "next task", "start a task", "pick up a task", "mark done", "task complete", "finish task", "show progress", "where are we", "status", "validate task", "check task quality", or at the beginning of any implementation session. Also trigger proactively when about to write implementation code without having checked the specs first.
---

# Spec-Driven Development Workflow

This project uses atomic spec files as the source of truth. Every implementation task maps to a task ticket in `specs/epics/`. Every task follows a deterministic state machine -- no step can be skipped.

## State Machine

```
FIND_TASK --> QUALITY_GATE --> DOR_VERIFICATION --> IMPLEMENTATION --> DOD_VERIFICATION --> COMPLETION --> FIND_NEXT
```

```
+------------+     +----------------+     +--------------------+
| FIND       |---->| QUALITY GATE   |---->| DOR VERIFICATION   |
| next task  |     | task file ok?  |     | each item walked   |
+------------+     +-------+--------+     +---------+----------+
                           | FAIL                   | PASS
                    Fix task file              +-----v--------------+
                    before proceeding          | IMPLEMENTATION     |
                                               | code against ACs   |
                                               +-----+--------------+
                                                     |
                                               +-----v--------------+
                                               | DOD VERIFICATION   |
                                               | evidence for       |
                                               | each item          |
                                               +-----+--------------+
                                                     | ALL PASS
                                               +-----v--------------+
                                               | COMPLETION         |
                                               | update status      |
                                               | suggest next       |
                                               +--------------------+
```

Transitions are gated. You cannot enter IMPLEMENTATION without passing QUALITY_GATE and DOR_VERIFICATION. You cannot enter COMPLETION without passing DOD_VERIFICATION. If any gate fails, stop, report, and fix before proceeding.

---

## Detect Mode

Based on user intent, run one of four modes:

- **"what's next" / "let's work" / "start" / session start** --> Mode 1: Find Next Task
- **"mark done" / "complete" / "finish"** --> Mode 2: Complete Task
- **"status" / "progress" / "where are we"** --> Mode 3: Show Progress
- **"validate task" / "check task quality"** --> Mode 4: Validate Task File

---

## Mode 1: Find Next Task

### Step 1 -- Locate the Task

1. Read `specs/README.md` -- get the epic status table
2. Identify the first epic on the critical path that is not Done:
   - Critical path: E01 --> E02 --> E03 --> E04 --> E09
   - Parallel after E03: E04, E05, E06 (independent)
   - E07 after E04; E08 parallel with E04-E06
3. Read that epic's `EPIC.md` -- find the task index table
4. Find the first task where Status = `Not Started` and all dependencies are `Done`
   - If dependencies are unclear, read each dependency's task file to check status
5. Read the full task file

### Step 2 -- Quality Gate

Before proceeding, verify the task file meets quality standards. Check every rule below and track pass/fail:

**DoR Quality Checks:**

| # | Check | Rule |
|---|-------|------|
| Q1 | Item count | DoR has 4+ checklist items (3 or fewer = likely boilerplate) |
| Q2 | Dependency specificity | DoR references specific dependency task IDs (e.g., "E01-T02 is Done"), not just "Dependencies completed" |
| Q3 | Research specificity | DoR references specific research section numbers with topic descriptions (e.g., "Read section 6 -- Technology Stack Decision"), not just "Research sections read:" |
| Q4 | Understanding items | DoR includes task-specific understanding requirements (items that show the implementer must internalize something specific to this task) |
| Q5 | AC review item | DoR includes an ACs-reviewed item that states the count and scope of ACs |

**DoD Quality Checks:**

| # | Check | Rule |
|---|-------|------|
| Q6 | Item count | DoD has 6+ checklist items |
| Q7 | AC restatement | DoD restates each AC as a verifiable checklist item (e.g., "AC1: `npm run build` succeeds without errors"), not just "All acceptance criteria met" |
| Q8 | Type-appropriate gates | DoD gates match the task type -- see Task Type Gates table below |
| Q9 | Build gate | DoD includes `tsc --noEmit` or equivalent build verification |
| Q10 | Specificity | DoD items reference concrete artifacts (file names, command outputs, export names), not vague outcomes |

**Task Type Gates (for Q8):**

| Task Type | Required DoD Gates | NOT Required |
|-----------|-------------------|--------------|
| Config/scaffolding | Config files created, commands work, no lint warnings | Barrel exports, TSDoc |
| Source code (tool, module, class) | Barrel export, TSDoc on public API, tests | -- |
| Test infrastructure | Test runner works, sample test passes | Barrel exports |
| Tool implementation | Zod schema defined, tool registered, barrel export, TSDoc | -- |
| Integration/packaging | End-to-end verification, all components wired | TSDoc on internals |

**Scoring:**

- **GOOD** (0 red flags): Proceed to DOR_VERIFICATION
- **FAIR** (1-2 red flags): Warn the user, list the issues, offer to fix. Do NOT proceed until the user confirms fix or explicitly overrides
- **POOR** (3+ red flags): BLOCK. List all issues. Fix the task file before proceeding. Do not offer an override

Report the quality gate result:

```
Quality Gate: [GOOD/FAIR/POOR] -- [N]/10 checks passed

[For each failed check:]
  FAIL Q[N]: [explanation of what's wrong and how to fix it]
```

### Step 3 -- DoR Verification

Walk each DoR checklist item individually. For each item, collect evidence:

- **Dependency items**: Read the dependency's task file. Verify its status field = `Done`. Report: "E0X-T0Y: [title] -- Status: Done [checkmark]" or "Status: [actual status] -- BLOCKS this task"
- **Research items**: Read the cited research section. Summarize the key insight in 1-2 sentences. Report: "Section N.N -- [topic]: [1-2 sentence summary of key insight]"
- **Understanding items**: Confirm you have internalized the concept. State it back briefly.
- **AC review items**: Count the ACs and confirm they are clear and testable.

If ANY DoR item fails:
- Explain what is blocking
- If a dependency is not Done, suggest working on that task instead
- Do NOT proceed to implementation

### Step 4 -- Present to User

```
Next up: [E0X-T0Y] -- [Title]
  Epic: [Epic title]
  Size: [S/M/L]
  Dependencies: [list, all Done]
  ACs: [count] acceptance criteria
  Quality Gate: GOOD ([N]/10 passed)

  DoR Verification:
    [checkmark] Dependency: E0X-T0Y -- [title] -- Done
    [checkmark] Research: Section N -- [topic] -- [key insight]
    [checkmark] Understanding: [concept confirmed]
    [checkmark] ACs reviewed: [count] criteria, all clear

Ready to start?
```

### Step 5 -- On Confirmation

Update status in two places using the Edit tool:

1. **Task file**: Change `Not Started` to `In Progress` in the metadata table
2. **EPIC.md**: Change that task's status in the task index table to `In Progress`
3. If this is the first In Progress task in the epic, also set epic status to `In Progress` in both EPIC.md and `specs/README.md`

Then begin implementation against the acceptance criteria.

---

## Mode 2: Complete Task

### Step 1 -- Find the In Progress Task

1. Read `specs/README.md` for the in-progress epic
2. Read that epic's `EPIC.md` for the in-progress task
3. Read the task file

### Step 2 -- DoD Verification with Evidence

Walk each DoD checklist item. For EVERY item, collect and present evidence:

- **AC-specific items** (e.g., "AC1: `npm run build` succeeds"): Identify the test, code, or behavior that proves it. Show the evidence -- run the command, read the file, or demonstrate the behavior.
- **Build items** (e.g., "`tsc --noEmit` passes"): Actually run the command. Show the output.
- **Test items** (e.g., "Tests pass"): Actually run `npm test`. Show the output.
- **Lint items** (e.g., "No lint warnings"): Actually run `npm run lint`. Show the output.
- **Export items** (e.g., "Exported from barrel file"): Read the barrel file (`src/index.ts` or relevant barrel). Verify the export exists. Show the line.
- **Documentation items** (e.g., "TSDoc on public API"): Search for TSDoc comments on the relevant functions/classes. Show them.
- **File items** (e.g., "Config file created"): Read the file. Confirm it exists and has the required content.

Track each item:

```
DoD Verification:
  [pass/fail] AC1: [description] -- Evidence: [what proves it]
  [pass/fail] AC2: [description] -- Evidence: [what proves it]
  [pass/fail] `tsc --noEmit` -- Evidence: [command output]
  [pass/fail] `npm test` -- Evidence: [X tests passed]
  [pass/fail] Lint clean -- Evidence: [command output]
  ...

Result: [N]/[total] passed
```

### Step 3 -- Handle Failures

If ANY DoD item fails:
- Report which items failed and why
- Do NOT mark as Done
- Suggest specific fixes for each failure
- After fixes are applied, re-run the failed checks

### Step 4 -- Handle Success

If ALL DoD items pass:

1. Update status in two places:
   - **Task file**: Change `In Progress` to `Done`
   - **EPIC.md**: Change that task's status to `Done`
2. Check if all tasks in the epic are now Done:
   - If yes, mark epic as `Done` in both EPIC.md and `specs/README.md`
3. Auto-suggest the next task by running Mode 1

---

## Mode 3: Show Progress

1. Read `specs/README.md`
2. For each in-progress or recently active epic, read its `EPIC.md`
3. Display a dashboard:

```
Project Progress

| Epic | Status | Progress |
|------|--------|----------|
| E01 Project Scaffolding | Done | 5/5 |
| E02 Core Infrastructure | In Progress | 3/6 |
| ...

Current: E02-T04 -- Reddit Thing Types
Next up: E02-T05 -- Response Normalization
Critical path: E01 [done] --> E02 [3/6] --> E03 --> E04 --> E09
Overall: 8/55 tasks (15%)

Blockers:
  [List any tasks whose dependencies are not met]

Quality Summary:
  Completed tasks with task-specific DoR/DoD: [N]/[total]
  Completed tasks with boilerplate DoR/DoD detected: [N]/[total]
```

For the quality summary, scan completed task files and check if their DoR/DoD would pass the Quality Gate from Mode 1. Report the ratio.

---

## Mode 4: Validate Task File

Triggered by "validate task", "check task quality", or when explicitly asked to review a task file.

1. If a specific task is named (e.g., "validate E02-T03"), read that task file
2. If an epic is named (e.g., "validate E02"), read all task files in that epic folder
3. If nothing specific is named, validate all task files in all epic folders

For each task file, run the Quality Gate checks from Mode 1 Step 2. Report:

```
Task File Validation: [E0X-T0Y] -- [Title]

  DoR Quality:
    [pass/fail] Q1: Item count ([N] items)
    [pass/fail] Q2: Dependency specificity
    [pass/fail] Q3: Research specificity
    [pass/fail] Q4: Understanding items
    [pass/fail] Q5: AC review item

  DoD Quality:
    [pass/fail] Q6: Item count ([N] items)
    [pass/fail] Q7: AC restatement
    [pass/fail] Q8: Type-appropriate gates
    [pass/fail] Q9: Build gate
    [pass/fail] Q10: Specificity

  Score: [N]/10 -- [GOOD/FAIR/POOR]
  Issues: [list each failed check with fix suggestion]
```

When validating multiple tasks, also show a summary table:

```
| Task | Score | Rating | Issues |
|------|-------|--------|--------|
| E01-T01 | 10/10 | GOOD | -- |
| E01-T02 | 8/10 | FAIR | Q4, Q8 |
| E01-T03 | 10/10 | GOOD | -- |
```

Offer to fix any FAIR or POOR task files.

---

## Anti-Boilerplate Detection

The following patterns indicate boilerplate DoR/DoD. These are the specific patterns the Quality Gate checks for:

### DoR Red Flags

- Exactly 3 items (the original template had exactly 3)
- Contains "Dependencies completed" without listing specific task IDs
- Contains "Research sections read:" without section numbers and topic descriptions
- Contains "Acceptance criteria reviewed and clear" as a standalone item without stating AC count
- No task-specific understanding requirements (no "Understand:" items)

### DoD Red Flags

- Exactly 5 items (the original template had exactly 5)
- Contains "All acceptance criteria met" without listing specific ACs (AC1, AC2, etc.)
- Contains "Public API exported from barrel file" on a config/test/packaging task that has no public API
- Contains "Tests written and passing" without specifying WHAT to test
- No AC-specific checklist items (items that reference AC1, AC2, etc. individually)
- Contains "TSDoc comments on public functions" on a config-only task

### Quality Score

- **GOOD**: 0 red flags detected -- proceed normally
- **FAIR**: 1-2 red flags -- warn, suggest fixes, do not proceed until acknowledged
- **POOR**: 3+ red flags -- BLOCK, must fix before starting task

---

## Rules

- **Never skip the quality gate** -- always verify the task file meets quality standards before starting
- **Never skip DoR** -- always verify dependencies and read research before starting
- **Never skip DoD** -- always collect evidence for every item before marking done
- **Evidence is mandatory** -- "I believe this passes" is not evidence. Run the command, read the file, show the output
- **Dual update** -- always update BOTH the task file AND EPIC.md task index
- **Research first** -- for any task in E02+, read the cited research sections before coding
- **Dependency chain** -- if a task's deps are not met, work on the blocking task instead
- **Spec is truth** -- if work is needed that is not in a spec, create/update the spec first
- **No partial completion** -- a task is either Done (all DoD passed) or not Done. No "mostly done"
- **Fix, don't skip** -- if a quality gate or DoD check fails, fix the issue. Do not skip the check
