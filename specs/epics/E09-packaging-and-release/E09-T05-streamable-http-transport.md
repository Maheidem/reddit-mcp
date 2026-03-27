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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL sections 6, 7; research/09
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

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
