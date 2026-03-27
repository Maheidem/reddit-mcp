# E09-T05: Streamable HTTP Transport

| Field | Value |
|-------|-------|
| **Epic** | [E09 — Packaging and Release](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E04, E05, E06 |

## Description
Add Streamable HTTP transport for hosted deployments. Behind `--transport http` flag. STDIO remains default.

## Acceptance Criteria
1. Server starts in HTTP mode with `--transport http`
2. Connects via Streamable HTTP protocol
3. DNS rebinding protection enabled
4. STDIO remains default when no flag

## Definition of Ready
- [ ] E04 (Read Tools), E05 (Write Tools), and E06 (Mod Tools) are Done -- server functional over STDIO
- [ ] FINAL section 7.2 read: Streamable HTTP is MCP-recommended transport for non-STDIO deployments; SSE deprecated March 2025
- [ ] research/09-typescript-mcp-sdk-deep-dive.md read: MCP SDK HTTP transport setup, express/hono integration
- [ ] DNS rebinding protection requirements understood: validate Host header against allowed origins
- [ ] CLI argument parsing pattern decided: `--transport http` flag, `--port` flag (default 3000)

## Definition of Done
- [ ] Server starts in HTTP mode with `--transport http` flag and listens on configured port
- [ ] Server uses Streamable HTTP protocol (not deprecated SSE)
- [ ] DNS rebinding protection enabled: Host header validated against allowed origins
- [ ] STDIO remains the default transport when no `--transport` flag is provided
- [ ] `--port` flag configures the HTTP listen port (defaults to 3000)
- [ ] Tests verify: HTTP mode starts, STDIO mode still works, invalid transport flag rejected
- [ ] Transport module exported from appropriate barrel file
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No new lint warnings introduced
- [ ] HTTP transport dependency (express or hono) added to `package.json`

## Out of Scope
SSE transport (deprecated March 2025)

## Implementation Notes
- Use express or hono integration from MCP SDK
- This is optional for v1.0 — not blocking release
- DNS rebinding protection: validate Host header against allowed origins
- Consider port configuration via `--port` flag (default 3000)
- Streamable HTTP is the MCP-recommended transport for non-STDIO deployments

## Files to Create/Modify
- `src/transport/http.ts` — Streamable HTTP transport setup
- `src/index.ts` — CLI flag parsing for `--transport http`
- `package.json` — add express/hono dependency (if not already present)
