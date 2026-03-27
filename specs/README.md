# Reddit MCP Server — Spec Tracker

> **Project**: The most comprehensive MCP server for Reddit
> **Phase**: 1 (Launch Target — 25 tools)
> **Methodology**: [METHODOLOGY.md](METHODOLOGY.md) | **Dependencies**: [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md)

---

## Epic Status

| Epic | Title | Tasks | Status | Progress |
|------|-------|:-----:|--------|----------|
| [E01](epics/E01-project-scaffolding.md) | Project Scaffolding | 5 | Not Started | 0/5 |
| [E02](epics/E02-core-infrastructure.md) | Core Infrastructure | 6 | Not Started | 0/6 |
| [E03](epics/E03-authentication-system.md) | Authentication System | 7 | Not Started | 0/7 |
| [E04](epics/E04-phase1-read-tools.md) | Phase 1 Read Tools | 8 | Not Started | 0/8 |
| [E05](epics/E05-phase1-write-tools.md) | Phase 1 Write Tools | 7 | Not Started | 0/7 |
| [E06](epics/E06-phase1-moderation-tools.md) | Phase 1 Moderation Tools | 6 | Not Started | 0/6 |
| [E07](epics/E07-mcp-resources-and-prompts.md) | MCP Resources & Prompts | 5 | Not Started | 0/5 |
| [E08](epics/E08-testing-and-quality.md) | Testing & Quality | 6 | Not Started | 0/6 |
| [E09](epics/E09-packaging-and-release.md) | Packaging & Release | 5 | Not Started | 0/5 |
| [E10](epics/E10-phase2-extended-tools.md) | Phase 2 Extended Tools | TBD | Future | — |
| [E11](epics/E11-phase3-power-user-tools.md) | Phase 3 Power User Tools | TBD | Future | — |

**Phase 1 Total**: 55 tasks | **Estimated**: 102-178 hours

---

## Critical Path

```
E01 → E02 → E03 → E04 → E09 (minimum viable server)
```

## Parallel Opportunities

- E04, E05, E06 can run in parallel after E03
- E08 testing tracks alongside E04-E06
- E07 starts once E04 is done

---

## Quick Reference

- **DoR**: Dependencies done, ACs written, research read, scope bounded, estimated
- **DoD**: Compiles, tests pass, ACs met, no regressions, exported, documented, lint clean
- **Sizes**: S (1-2h), M (2-6h), L (6-12h)
- **Research**: [FINAL-CONSOLIDATED-RESEARCH.md](../research/FINAL-CONSOLIDATED-RESEARCH.md) | [Tool Inventory](../research/10-tool-inventory.md)
