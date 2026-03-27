# Dependency Map

## Epic-Level Dependencies

```
E01 Project Scaffolding
 │
 ├──> E02 Core Infrastructure
 │     │
 │     ├──> E03 Authentication System
 │     │     │
 │     │     ├──> E04 Phase 1 Read Tools ──────────────> E07 Resources & Prompts
 │     │     │                                             │
 │     │     ├──> E05 Phase 1 Write Tools ────────────> E07
 │     │     │                                             │
 │     │     └──> E06 Phase 1 Mod Tools ──────────────> E07
 │     │
 │     └──> E08 Testing (starts with E02, runs parallel with E04-E06)
 │
 └──────────────────────────────────────────────────────> E09 Packaging & Release
                                                           │
                                                           └──> E10 Phase 2 (future)
                                                                  │
                                                                  └──> E11 Phase 3 (future)
```

### Legend

- `──>` = hard dependency (must complete before)
- E04, E05, E06 can run **in parallel** after E03
- E08 testing tasks track their respective epics

---

## Critical Path

```
E01 → E02 → E03 → E04 → E09
```

This is the shortest path to a minimum viable server (read-only tools + packaging).

---

## Parallel Opportunities

| After    | Can Start In Parallel                           |
| -------- | ----------------------------------------------- |
| E03 done | E04, E05, E06 (independent tool categories)     |
| E02 done | E08-T01 (infra unit tests)                      |
| E03 done | E08-T02 (auth unit tests)                       |
| E04 done | E07-T01 to E07-T04 (Resources reuse read logic) |
| E05 done | E08-T03 (safety layer tests)                    |

---

## Task-Level Dependencies (Cross-Epic)

| Task     | Depends On                | Reason                                      |
| -------- | ------------------------- | ------------------------------------------- |
| E02-T01  | E01-T03                   | HTTP client needs working server shell      |
| E02-T06  | E02-T01, E02-T02, E02-T03 | Integration of client + limiter + errors    |
| E03-T07  | E02-T06, E03-T02          | Wiring auth into already-wired client       |
| E04-\*   | E02-T04, E03-T06          | Tools need types and auth guards            |
| E05-T03+ | E05-T01, E05-T02          | Write tools need safety layer first         |
| E06-T05  | E02-T02                   | Mod notes has special 30 QPM rate limit     |
| E07-T01  | E04-T03                   | Subreddit resources reuse read tool logic   |
| E07-T04+ | E04, E05, E06             | Prompts reference tools from all categories |
| E08-T04  | E04, E05, E06             | Integration tests need real tools           |
| E08-T05  | E08-T04                   | E2E tests build on integration tests        |
| E09-T01  | E04, E05, E06             | Package needs functional tools              |
| E09-T02  | E09-T01                   | README needs final tool list                |

---

## Task-Level Dependencies (Within Epics)

### E01: Project Scaffolding

```
T01 (npm init) → T02 (directory structure) → T03 (STDIO + hello tool)
T01 → T04 (lint/format)
T03 → T05 (test infrastructure)
```

### E02: Core Infrastructure

```
T01 (HTTP client) → T04 (types, needs client context)
T01 + T02 (rate limiter) + T03 (error parser) → T06 (integration)
T01 → T05 (normalize utils)
```

### E03: Authentication System

```
T01 (config) → T02 (auth manager core)
T02 → T03 (tier 1) | T04 (tier 2) | T05 (tier 3)  [parallel]
T02 → T06 (auth guard)
T02 + E02-T06 → T07 (wire into client)
```

### E04: Phase 1 Read Tools

```
T01-T07 can run in parallel (independent tools)
T01-T07 → T08 (registration)
```

### E05: Phase 1 Write Tools

```
T01 (content validation) → T02 (bot disclosure + dupe detection)
T01 + T02 → T03-T06 (individual tools, can be parallel)
T03-T06 → T07 (registration + integration test)
```

### E06: Phase 1 Moderation Tools

```
T01-T05 can run in parallel (independent tools)
T01-T05 → T06 (registration)
```

### E07: MCP Resources & Prompts

```
T01-T03 can run in parallel (independent resources)
T04-T05 can run in parallel (independent prompts, but after E04-E06)
```

### E08: Testing & Quality

```
T01 (infra tests, after E02) | T02 (auth tests, after E03) | T03 (safety tests, after E05)
T01-T03 → T04 (integration tests)
T04 → T05 (E2E tests)
T01-T04 → T06 (CI config)
T05 + E09-T01 → T07 (real-world Playwright validation, local only)
```

### E09: Packaging & Release

```
T01 (npm config) → T02 (README) → T03 (examples)
T01 → T04 (CHANGELOG)
T01 → T05 (HTTP transport, optional)
```
