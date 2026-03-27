# Project Map

## Spec Files

```
specs/
├── README.md                              # Epic status tracker
├── METHODOLOGY.md                         # DoR, DoD, estimation guide
├── DEPENDENCY-MAP.md                      # Full dependency graph
└── epics/
    ├── E01-project-scaffolding/           # 5 tasks
    ├── E02-core-infrastructure/           # 6 tasks
    ├── E03-authentication-system/         # 7 tasks
    ├── E04-phase1-read-tools/             # 8 tasks
    ├── E05-phase1-write-tools/            # 7 tasks
    ├── E06-phase1-moderation-tools/       # 6 tasks
    ├── E07-mcp-resources-and-prompts/     # 5 tasks
    ├── E08-testing-and-quality/           # 6 tasks
    ├── E09-packaging-and-release/         # 5 tasks
    ├── E10-phase2-extended-tools/         # Future
    └── E11-phase3-power-user-tools/       # Future
```

Each epic folder contains:

- `EPIC.md` — goal, context, research refs, task index table
- `EXX-TYY-task-name.md` — self-contained task ticket

## Research Files

```
research/
├── FINAL-CONSOLIDATED-RESEARCH.md        # Master synthesis (925 lines)
├── CATALOG.md                            # Index of all research docs
├── 01-reddit-official-api.md             # 150+ endpoints, OAuth2, Things
├── 02-reddit-api-libraries.md            # 20+ libraries compared
├── 03-existing-reddit-mcp-servers.md     # 39 servers analyzed
├── 04-reddit-content-capabilities.md     # Media, polls, galleries
├── 05-reddit-moderation-apis.md          # 100+ mod endpoints
├── 06-oauth-and-mcp-architecture.md      # Auth tiers, transport, safety
├── 07-api-edge-cases-and-gotchas.md      # 15+ documented pitfalls
├── 08-reddit-content-formatting.md       # Snudown, RTJSON, limits
├── 09-typescript-mcp-sdk-deep-dive.md    # SDK patterns, testing
└── 10-tool-inventory.md                  # 60 tools across 3 phases
```

## Critical Path

```
E01 → E02 → E03 → E04 → E09 (minimum viable server)

Parallel after E03: E04, E05, E06
E07 after E04 (soft: E05, E06)
E08 parallel with E04-E06
```
