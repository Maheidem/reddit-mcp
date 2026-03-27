# E01: Project Scaffolding

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Dependencies** | None |
| **Tasks** | 5 |
| **Estimated Effort** | 6-10 hours |

## Goal
Set up a buildable, testable TypeScript project with MCP SDK wired and a hello-world tool that proves the pipeline works end-to-end. Success means a developer can clone the repo, run `npm install && npm run build && npm test`, and see a passing test that exercises the full MCP tool invocation pipeline via in-memory transport.

## Context
This epic implements the foundational decisions from research: TypeScript as the implementation language, MCP SDK v1.28.0+, Zod v4 for schema validation, ES2022/NodeNext module system, and vitest as the test runner. Every subsequent epic depends on this scaffolding being solid.

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 6, 7
- research/09-typescript-mcp-sdk-deep-dive.md

## Task Index

| ID | Title | Size | Status | Dependencies |
|----|-------|:----:|--------|-------------|
| [T01](E01-T01-initialize-npm-project.md) | Initialize npm Project and TypeScript | S | Not Started | None |
| [T02](E01-T02-create-source-directory.md) | Create Source Directory Structure | S | Not Started | T01 |
| [T03](E01-T03-wire-stdio-transport.md) | Wire STDIO Transport with Hello-World Tool | M | Not Started | T02 |
| [T04](E01-T04-configure-linting.md) | Configure Linting and Formatting | S | Not Started | T01 |
| [T05](E01-T05-configure-test-infrastructure.md) | Configure Test Infrastructure | M | Not Started | T03 |

## Success Criteria
- `npm run build` compiles without errors
- `npm run dev` starts the MCP server
- `npm test` passes with at least one in-memory transport test
- `npm run lint` and `npm run format` work
- MCP Inspector can connect and invoke the `reddit_ping` tool
