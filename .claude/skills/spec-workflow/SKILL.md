---
name: spec-workflow
description: Manage spec-driven development workflow for the Reddit MCP Server. Find next ready task, verify Definition of Ready, guide implementation, verify Definition of Done, and update task/epic status. Use when user says "let's work", "what's next", "next task", "start a task", "pick up a task", "mark done", "task complete", "finish task", "show progress", "where are we", "status", or at the beginning of any implementation session. Also trigger proactively when about to write implementation code without having checked the specs first.
---

# Spec-Driven Development Workflow

This project uses atomic spec files as the source of truth. Every implementation task maps to a task ticket in `specs/epics/`.

## Detect Mode

Based on user intent, run one of three modes:

- **"what's next" / "let's work" / "start" / session start** → Mode 1: Find Next Task
- **"mark done" / "complete" / "finish"** → Mode 2: Complete Task
- **"status" / "progress" / "where are we"** → Mode 3: Show Progress

---

## Mode 1: Find Next Task

1. Read `specs/README.md` — get epic status table
2. Identify the first epic on the critical path that is not Done:
   - Critical path: E01 → E02 → E03 → E04 → E09
   - Parallel after E03: E04, E05, E06 (independent)
   - E07 after E04; E08 parallel with E04-E06
3. Read that epic's `EPIC.md` — find the task index table
4. Find the first task where Status = `Not Started` and all dependencies are `Done`
   - If dependencies are unclear, read each dependency's task file to check status
5. Read the full task file

### Verify Definition of Ready

Walk through the DoR checklist in the task file:

```
- [ ] Dependencies completed — check each listed dependency's status
- [ ] Research sections read — read the cited sections from research/
- [ ] Acceptance criteria reviewed and clear
```

If DoR fails (e.g., dependency not done), explain what's blocking and suggest the blocking task instead.

### Present to User

> **Next up: [E0X-T0Y] — [Title]**
> - Size: [S/M/L]
> - Dependencies: [list, all Done ✓]
> - ACs: [count] acceptance criteria
>
> Ready to start?

### On Confirmation

Update status in two places using the Edit tool:

1. **Task file**: Change `Not Started` to `In Progress` in the metadata table
2. **EPIC.md**: Change that task's status in the task index table to `In Progress`
3. If this is the first In Progress task in the epic, also set epic status to `In Progress`

Then read the cited research sections and begin implementation.

---

## Mode 2: Complete Task

1. Find the current In Progress task:
   - Read `specs/README.md` for in-progress epic
   - Read that epic's `EPIC.md` for the in-progress task
   - Read the task file

2. **Run DoD verification**:

```bash
# Compile check
npm run build  # or tsc --noEmit

# Test check
npm test

# Lint check
npm run lint
```

3. **Walk acceptance criteria** — verify each one is met (by test, code review, or demonstration)

4. **Check DoD checklist**:
   - [ ] All acceptance criteria met
   - [ ] Compiles clean
   - [ ] Tests pass
   - [ ] Lint clean
   - [ ] Public API exported from barrel file
   - [ ] TSDoc comments on public functions

5. If all pass, update status in two places:
   - **Task file**: Change `In Progress` to `Done`
   - **EPIC.md**: Change that task's status to `Done`

6. Check if all tasks in the epic are now Done — if so, mark epic as `Done` in both EPIC.md and `specs/README.md`

7. Run Mode 1 to suggest the next task.

---

## Mode 3: Show Progress

1. Read `specs/README.md`
2. For each in-progress or recently active epic, read its `EPIC.md`
3. Display a dashboard:

```
📊 Project Progress

| Epic | Status | Progress |
|------|--------|----------|
| E01 Project Scaffolding | Done ✓ | 5/5 |
| E02 Core Infrastructure | In Progress | 3/6 |
| ...

🎯 Current: E02-T04 — Reddit Thing Types
📋 Next up: E02-T05 — Response Normalization
🛤️ Critical path: E01 ✓ → E02 [3/6] → E03 → E04 → E09
📈 Overall: 8/55 tasks (15%)
```

---

## Rules

- **Never skip DoR** — always verify dependencies and read research before starting
- **Never skip DoD** — always run compile/test/lint and check ACs before marking done
- **Dual update** — always update BOTH the task file AND EPIC.md task index
- **Research first** — for any task in E02+, read the cited research sections before coding
- **Dependency chain** — if a task's deps aren't met, work on the blocking task instead
- **Spec is truth** — if work is needed that isn't in a spec, create/update the spec first
