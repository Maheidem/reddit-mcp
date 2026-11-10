# E12-T01: Containerization and Remote Bind

| Field            | Value                                                |
| ---------------- | ---------------------------------------------------- |
| **Epic**         | [E12 — Deployment and Containerization](EPIC.md)     |
| **Status**       | Done                                                 |
| **Size**         | M                                                    |
| **Dependencies** | E09 (Packaging and Release) — Done                   |

## Description

Make the HTTP transport safe and reachable from inside a Docker container, then add a Dockerfile so the server can be run as a long-lived service. Three small code surfaces change:

1. CLI gains `--host` flag (and `MCP_HTTP_HOST` env fallback) alongside existing `--port` / `MCP_HTTP_PORT`.
2. HTTP transport passes `allowedHosts` to `createMcpExpressApp` whenever the bind is non-localhost, keeping DNS rebinding protection active. Read from `MCP_ALLOWED_HOSTS` env (comma-separated).
3. New `/healthz` endpoint returns `{ ok: true, tier: <auth-tier> }` so Docker's `HEALTHCHECK` and Portainer can probe liveness without speaking MCP.

A new `src/utils/paths.ts` module reads `MCP_DATA_DIR` / `MCP_CONFIG_DIR` / `MCP_LOG_DIR` with sane defaults so future state-using code lands in container-mounted dirs without another deploy.

A multi-stage `Dockerfile` and `.dockerignore` ship the server as `node:22-alpine`-based image running as `USER node` (UID 1000, aligns with host `maheidem` UID 1000).

## Acceptance Criteria

1. `--host <addr>` CLI flag and `MCP_HTTP_HOST` env var both control the HTTP bind address; flag beats env, env beats default (`127.0.0.1`).
2. When binding non-localhost, `createMcpExpressApp` receives `allowedHosts` containing at minimum `["localhost", "127.0.0.1", os.hostname()]` plus any values from `MCP_ALLOWED_HOSTS` (comma-separated env var).
3. `GET /healthz` returns HTTP 200 with JSON `{ ok: true, tier: "anon" | "app" | "user" }` reflecting the current auth tier.
4. `docker build -t reddit-mcp:dev .` succeeds; `docker run --rm -p 3101:3000 -e REDDIT_USER_AGENT=test reddit-mcp:dev` boots and `curl http://localhost:3101/healthz` returns the expected JSON.
5. Existing STDIO and HTTP-localhost behavior unchanged; full vitest suite passes.

## Definition of Ready

- [ ] E09 (Packaging and Release) is Done — HTTP transport baseline (E09-T05) exists at `src/transport/http.ts`
- [ ] FINAL section 7.2 read: Streamable HTTP transport requirements; DNS rebinding protection rationale
- [ ] `node_modules/@modelcontextprotocol/sdk/dist/esm/server/express.d.ts` reviewed: `CreateMcpExpressAppOptions { host?: string; allowedHosts?: string[] }` is the documented API surface
- [ ] Understand: `createMcpExpressApp` only auto-enables DNS rebinding protection for localhost binds — `0.0.0.0` requires explicit `allowedHosts` to keep protection on
- [ ] Understand: `node:22-alpine`'s `node` user is UID 1000, which aligns with host `maheidem` UID 1000 — bind-mounted dirs created as `maheidem:maheidem` are writable from the container without `chown` gymnastics
- [ ] Security understood: with Tier 3 creds (`REDDIT_USERNAME`/`REDDIT_PASSWORD`) loaded, anyone reaching `/mcp` can act as the Reddit account. v1 deployment must be LAN-only until E12-T02 (bearer auth) lands.
- [ ] ACs reviewed: 5 acceptance criteria covering flag/env precedence, allowedHosts wiring, health endpoint, Docker build/smoke, and regression-free behavior

## Definition of Done

- [ ] AC1: `src/index.ts` parses `--host` (flag) and reads `MCP_HTTP_HOST` (env) with documented precedence; new test verifies precedence
- [ ] AC2: `src/transport/http.ts` passes `allowedHosts` to `createMcpExpressApp` when bind host is not `127.0.0.1`/`localhost`/`::1`; unit test asserts `allowedHosts` is populated correctly
- [ ] AC3: `GET /healthz` route registered before `/mcp`; unit test asserts JSON shape and 200 status
- [ ] AC4: `docker build -t reddit-mcp:dev .` exits 0; manual smoke run + `curl /healthz` documented in CHANGELOG entry or PR notes
- [ ] AC5: Existing tests still pass — `npm test` produces no new failures
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npm run lint` clean — no new warnings
- [ ] New module `src/utils/paths.ts` exported from `src/utils/index.ts` (barrel)
- [ ] Public API has TSDoc comments (HttpTransportOptions, paths module exports)
- [ ] `Dockerfile` and `.dockerignore` created at repo root; image runs as non-root (`USER node`)

## Out of Scope

- Bearer-token auth on `/mcp` (filed as E12-T02 follow-up — required before public tunnel exposure)
- The `mcps-stack` Portainer compose file (separate dev repo)
- Image registry publishing (manual `docker save | ssh load` for now; E12-T03 follow-up)
- Reading the new `MCP_DATA_DIR`/`CONFIG_DIR`/`LOG_DIR` from any existing tool — only the paths module is added; consumers come later

## Implementation Notes

- CLI flag precedence: command-line flag > env var > default. Implement as `getFlag(args, "--host") ?? process.env.MCP_HTTP_HOST ?? "127.0.0.1"`.
- `allowedHosts` default for non-localhost bind: `["localhost", "127.0.0.1", os.hostname()]` plus `MCP_ALLOWED_HOSTS.split(",")` if set. Operators add the compose service name (`reddit-mcp`) and any tunnel hostname via env.
- `/healthz` should be registered on the Express app *before* the `/mcp` POST handler so it works regardless of MCP transport state.
- Tier detection for `/healthz`: read from the existing auth/config layer — return `"anon"` if no client credentials, `"app"` if app-only, `"user"` if user creds present.
- Dockerfile: multi-stage; build stage runs `npm ci` + `tsc` + `npm prune --omit=dev`; run stage copies `dist/` and `node_modules/`. `wget` ships with alpine, used for HEALTHCHECK.

## Files to Create/Modify

- `src/index.ts` — add `--host` flag parsing, `MCP_HTTP_HOST`/`MCP_HTTP_PORT` env var fallbacks
- `src/transport/http.ts` — accept `host` option, pass `allowedHosts` to `createMcpExpressApp` for non-localhost binds, register `/healthz` route
- `src/utils/paths.ts` — new module reading `MCP_DATA_DIR`/`MCP_CONFIG_DIR`/`MCP_LOG_DIR` with defaults
- `src/utils/index.ts` — export `paths.ts`
- `src/__tests__/transport-http.test.ts` (or extend existing) — unit tests for new behavior
- `Dockerfile` — new, multi-stage build at repo root
- `.dockerignore` — new, excludes node_modules, dist, .git, specs, research, tests, docs, .env*
