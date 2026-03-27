# E01-T03: Wire STDIO Transport with Hello-World Tool

| Field | Value |
|-------|-------|
| **Epic** | [E01 — Project Scaffolding](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E01-T02 |

## Description
Create minimal `src/server.ts` using `McpServer` with one dummy tool (`reddit_ping`). Wire `StdioServerTransport` in `src/index.ts`. Prove it runs and responds.

## Acceptance Criteria
1. `npm run dev` starts server without errors
2. MCP Inspector (`npx @modelcontextprotocol/inspector`) connects and lists `reddit_ping`
3. Calling `reddit_ping` returns a text response

## Definition of Ready
- [ ] Dependencies completed
- [ ] Research sections read: research/09-typescript-mcp-sdk-deep-dive.md (McpServer and transport sections)
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
