# E09: Packaging and Release

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Dependencies** | E04-E08 substantially done |
| **Tasks** | 5 |
| **Estimated Effort** | 10-18 hours |

## Goal
Package the server for npm distribution and create comprehensive end-user documentation. This is how users will discover and install the server.

## Context
Package as npm with npx support. README is the primary discovery surface. Config examples for Claude Desktop, Claude Code, Cursor.

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 6, 7
- research/09-typescript-mcp-sdk-deep-dive.md

## Task Index

| ID | Title | Size | Status | Dependencies |
|----|-------|:----:|--------|-------------|
| [T01](E09-T01-npm-packaging.md) | npm packaging configuration | M | Not Started | E04, E05, E06 |
| [T02](E09-T02-readme-documentation.md) | README documentation | L | Not Started | E09-T01 |
| [T03](E09-T03-configuration-examples.md) | Configuration examples | S | Not Started | E09-T02 |
| [T04](E09-T04-changelog-release.md) | CHANGELOG and release process | S | Not Started | E09-T01 |
| [T05](E09-T05-streamable-http-transport.md) | Streamable HTTP transport | M | Not Started | E04, E05, E06 |

## Success Criteria
- npm package publishes cleanly with no dev/test artifacts
- `npx reddit-mcp-server` starts the server out of the box
- README covers all 25 tools, auth tiers, and MCP client configs
- Configuration examples work for Claude Desktop, Claude Code, and Cursor
- CHANGELOG follows Keep a Changelog format with v1.0.0 entry
- Optional HTTP transport available for hosted deployments
