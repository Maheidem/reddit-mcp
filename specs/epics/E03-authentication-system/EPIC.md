# E03: Authentication System

| Field                | Value       |
| -------------------- | ----------- |
| **Status**           | Done        |
| **Dependencies**     | E02         |
| **Tasks**            | 7           |
| **Estimated Effort** | 10-18 hours |

## Goal

Implement 3-tier progressive auth (anonymous -> app-only -> full OAuth) with in-memory token management and 50-minute auto-refresh. Success means the server gracefully adapts its capabilities based on which environment variables are configured, from zero-config anonymous browsing to full read/write/mod operations.

## Context

Implements progressive auth from research. Trail of Bits finding: never persist tokens to disk. Refresh at 50 min not 60 to avoid token expiry race conditions. Three tiers map to three OAuth grant types: installed client (anonymous), client credentials (app-only), and password grant (full).

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md section: 3
- research/01-reddit-official-api.md (OAuth section)
- research/06-oauth-and-mcp-architecture.md
- research/09-typescript-mcp-sdk-deep-dive.md

## Task Index

| ID                                          | Title                                  | Size | Status      | Dependencies |
| ------------------------------------------- | -------------------------------------- | :--: | ----------- | ------------ |
| [T01](E03-T01-configuration-env-loading.md) | Configuration and Environment Loading  |  S   | Done        | E02-T01      |
| [T02](E03-T02-auth-manager-core.md)         | Auth Manager Core with Token Lifecycle |  M   | Done        | T01          |
| [T03](E03-T03-tier1-anonymous-auth.md)      | Tier 1 Anonymous Auth                  |  M   | Done        | T02          |
| [T04](E03-T04-tier2-app-only-auth.md)       | Tier 2 App-Only Auth                   |  S   | Done        | T02          |
| [T05](E03-T05-tier3-full-oauth.md)          | Tier 3 Full OAuth (Password Grant)     |  M   | Done        | T02          |
| [T06](E03-T06-auth-guard.md)                | Auth-Aware Tool Guard                  |  S   | Done        | T02          |
| [T07](E03-T07-wire-auth-into-client.md)     | Wire Auth into HTTP Client             |  S   | Done        | E02-T06, T02 |

## Success Criteria

- Server starts with zero env vars and can read public data (Tier 1)
- Server with CLIENT_ID + CLIENT_SECRET authenticates via client credentials (Tier 2)
- Server with all 4 vars authenticates via password grant with full scopes (Tier 3)
- Tokens auto-refresh at 50-minute mark without interrupting requests
- No tokens ever written to disk
- Auth guard produces clear error messages naming which env vars are needed
