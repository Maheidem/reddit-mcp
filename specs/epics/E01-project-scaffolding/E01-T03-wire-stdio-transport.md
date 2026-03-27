# E01-T03: Wire STDIO Transport with Hello-World Tool

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Epic**         | [E01 — Project Scaffolding](EPIC.md) |
| **Status**       | Done                                 |
| **Size**         | M                                    |
| **Dependencies** | E01-T02                              |

## Description

Create minimal `src/server.ts` using `McpServer` with one dummy tool (`reddit_ping`). Wire `StdioServerTransport` in `src/index.ts`. Prove it runs and responds.

## Acceptance Criteria

1. `npm run dev` starts server without errors
2. MCP Inspector (`npx @modelcontextprotocol/inspector`) connects and lists `reddit_ping`
3. Calling `reddit_ping` returns a text response

## Definition of Ready

- [ ] Dependency: E01-T02 (Create Source Directory Structure) is Done -- `src/index.ts` and directory structure must exist
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 2 -- Server Construction Patterns (`McpServer` vs low-level `Server`, key method reference)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 3 -- Transport Setup (stdio transport code pattern, `console.log()` prohibition)
- [ ] Research: Read research/09-typescript-mcp-sdk-deep-dive.md section 4 -- Tool Definition Best Practices (Zod v4 schema integration for `reddit_ping`)
- [ ] Understand: Always use `McpServer` (high-level API), never the low-level `Server` class
- [ ] Understand: Import from `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/server/stdio.js`
- [ ] Understand: In stdio mode, NEVER use `console.log()` -- stdout is reserved for MCP protocol messages
- [ ] ACs reviewed: 3 acceptance criteria covering dev server start, MCP Inspector connection, and tool response

## Definition of Done

- [ ] AC1: `npm run dev` starts server without errors
- [ ] AC2: MCP Inspector (`npx @modelcontextprotocol/inspector`) connects and lists `reddit_ping` tool
- [ ] AC3: Calling `reddit_ping` returns a text response
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `src/server.ts` creates `McpServer` instance with `reddit_ping` tool registration
- [ ] `src/index.ts` wires `StdioServerTransport` and calls `server.connect(transport)`
- [ ] `McpServer` exported from barrel file for test access
- [ ] No `console.log()` calls in server code (only `console.error()` or SDK logging)
- [ ] No lint warnings introduced

## Out of Scope

Real Reddit API calls. This is a hello-world proof of the MCP pipeline.

## Implementation Notes

- Use `McpServer` (high-level API), never the low-level `Server` class
- Import from `@modelcontextprotocol/sdk/server/mcp.js`
- `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- The `reddit_ping` tool is throwaway but proves the full pipeline works

## Files to Create/Modify

- `src/server.ts` — McpServer instance with reddit_ping tool registration
- `src/index.ts` — wire StdioServerTransport and start the server
