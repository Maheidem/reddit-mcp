# Reddit MCP Server

TypeScript MCP server providing Reddit API access via STDIO transport.
Tech: TypeScript + Direct HTTP (no wrapper libs) + MCP SDK v1.28.0+ + Zod v4 + vitest.
Repo: github.com/Maheidem/reddit-mcp (MIT)

## The Core Rule: Specs Drive Everything

Specs are the source of truth. Never write implementation code without a corresponding task ticket.
If work is needed that no spec covers, create or update the spec FIRST, then implement.
Status lives in task files (`specs/epics/EXX-*/EXX-TYY-*.md`) and EPIC.md task index tables — not in memory.

## Task Workflow

1. Find the next Ready task: check `specs/DEPENDENCY-MAP.md`, then the EPIC.md task index
2. Read the task file. Verify DoR: dependencies done, research sections read, ACs clear
3. Implement against acceptance criteria — nothing more, nothing less
4. Verify DoD: `tsc --noEmit` passes, tests pass, ACs met, lint clean, exports from barrel file, TSDoc on public API
5. Update status to Done in BOTH the task file AND the EPIC.md task index table

DoR/DoD checklists are in `specs/METHODOLOGY.md`. Do not skip them.

## Research-First Rule

Before implementing ANY Reddit API interaction, read the cited research sections first.
Do not guess at Reddit API behavior — answers are in the research docs.
Primary reference: `research/FINAL-CONSOLIDATED-RESEARCH.md`
Supporting docs: `research/01-*.md` through `research/10-*.md` (see `research/CATALOG.md`)

## Reddit API Decisions (Locked)

- Direct HTTP to Reddit API — no wrapper libraries
- Auth: 3-tier progressive (anonymous, app-only, full OAuth)
- Always send `raw_json=1` on GET requests, `api_type=json` on POST requests
- Token refresh at 50 minutes (not 60), store in memory only
- Tool naming: `{action}_{resource}` pattern (e.g., `get_post`, `search_subreddits`)
- Phase 1 ceiling: 25 tools max (model confusion above 30)
- Phase 2/3 tools (E10, E11) are opt-in only — never load by default

## Project Structure

```
specs/           # Methodology, dependency map, 11 epic folders with 55 task tickets
  epics/EXX-*/   # EPIC.md + EXX-TYY-*.md task files
research/        # 10 research docs + FINAL-CONSOLIDATED-RESEARCH.md
src/             # Source code (created by E01)
tests/           # Test files (created by E01)
```

## Build and Verify

```bash
npm run build     # tsc compilation
npm test          # vitest test suite
npm run lint      # linter
tsc --noEmit      # type-check without emit (DoD requirement)
```

## Skill Reference

The `spec-workflow` skill manages the full task lifecycle (picking tasks, checking DoR, completing tasks, updating status). Use it when working through the backlog.

## Things NOT To Do

- Do not start coding without finding the corresponding spec task first
- Do not skip DoR/DoD checklists — they exist to prevent regressions
- Do not hardcode Reddit API assumptions; check research docs instead
- Do not add tools beyond Phase 1 scope unless explicitly requested
- Do not create files outside the expected project structure without spec justification
