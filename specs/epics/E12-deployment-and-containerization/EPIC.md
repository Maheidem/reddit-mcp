# E12: Deployment and Containerization

| Field                | Value                                |
| -------------------- | ------------------------------------ |
| **Status**           | Done                                 |
| **Dependencies**     | E09 (Packaging and Release) — Done   |
| **Tasks**            | 1 (T02, T03 follow-ups documented)   |
| **Estimated Effort** | 4-8 hours                            |

## Goal

Make reddit-mcp deployable as a long-lived HTTP service in a Docker container, suitable for hosting on a home Docker server (Portainer-managed) and reachable from any machine on the LAN. STDIO-via-npx remains the local-development default; the container is the remote-access path.

## Context

Phase 1 (E01-E09) shipped a working server reachable two ways:
1. STDIO via `npx @marcos-heidemann/reddit-mcp` (local subprocess, default)
2. HTTP via `--transport http --port N` (already implemented in E09-T05)

The HTTP transport binds to `127.0.0.1` by default (`src/transport/http.ts:25`) and there is no `--host` flag. Inside a Docker container, `127.0.0.1` is unreachable from the host's port mapping — the bind must be `0.0.0.0`. Additionally, `createMcpExpressApp` only enables DNS rebinding protection for localhost binds; binding to `0.0.0.0` requires passing `allowedHosts` to keep that protection active.

This epic adds the small code changes required for safe container deployment, plus the Dockerfile artifact. The Portainer stack (`docker-compose.yml`) lives in a separate repo (`mcps-stack`), not in this codebase, because it composes multiple MCPs over time.

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md section 7.2 — Streamable HTTP transport (already implemented in E09-T05)
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/express.d.ts` — `CreateMcpExpressAppOptions` API surface (`host`, `allowedHosts`)
- Existing implementation: `src/transport/http.ts` (E09-T05 output)

## Task Index

| ID                                                     | Title                              | Size | Status      | Dependencies |
| ------------------------------------------------------ | ---------------------------------- | :--: | ----------- | ------------ |
| [T01](E12-T01-containerization-and-remote-bind.md)     | Containerization & remote bind     |  M   | Done        | E09          |

## Success Criteria

- `docker build -t reddit-mcp:0.1.2 .` succeeds locally
- Container exposes `/healthz` and `/mcp` reachable from outside the container (via mapped port)
- HTTP transport binds to `0.0.0.0` when configured, with DNS rebinding protection active via `allowedHosts`
- Existing STDIO behavior unchanged; existing HTTP localhost behavior unchanged
- Forward-looking env vars (`MCP_DATA_DIR`, `MCP_CONFIG_DIR`, `MCP_LOG_DIR`) wired up so future state lands in container-mounted dirs without further redeploys

## Follow-ups (separate task tickets to be filed)

- **E12-T02 — Bearer-token auth on /mcp**: required precondition for public exposure of any Tier 3 instance via Cloudflare tunnel. Without this, anyone reaching `/mcp` can act as the configured Reddit account. v1 deployment is LAN-only until this lands.
- **E12-T03 — GHCR image publishing + auto-bump**: replaces manual `docker save | ssh load` distribution with a registry-based path once multi-host or scheduled image refresh is needed.

## Out of Scope

- The `mcps-stack` Portainer stack itself (lives in a separate dev repo)
- TLS termination on the LAN (Cloudflare tunnel handles external TLS later)
- CI/CD for image builds
