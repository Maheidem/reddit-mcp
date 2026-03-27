---
title: Reddit OAuth UX Patterns + MCP Server Architecture Best Practices
date: 2026-03-27
researcher: researcher-3
status: completed
confidence: high
task_refs: [6]
---

# Reddit OAuth UX Patterns + MCP Server Architecture Best Practices

## Executive Summary

This research addresses two critical implementation questions: (1) How should our Reddit MCP server handle OAuth authentication with the best possible UX? and (2) What are the current best practices for building production-quality MCP servers?

**Key findings:**
- The MCP spec (as of March 2026) now includes **native OAuth 2.1 support** with PKCE, metadata discovery, and dynamic client registration — but this only applies to HTTP-transport servers
- For **stdio-based servers** (the most common deployment), **environment variables + system keychain** is the standard pattern
- Reddit's OAuth2 uses **1-hour access tokens** with optional permanent refresh tokens — our server must handle auto-refresh transparently
- A Reddit MCP server should use the **"script" app type** (password grant) for single-user MCP deployments and **"web" app type** (authorization code) for multi-user/hosted deployments
- **jordanburke's 3-tier auth** (anonymous → auto → authenticated) is the gold standard UX pattern for Reddit MCP servers
- **Tool count should stay under 50 per server**; use `domain_noun_verb` naming; paginate all results

---

# Part 1: Reddit OAuth UX for MCP Servers

## 1.1 How MCP Servers Handle OAuth Flows

The MCP specification added **OAuth 2.1** authorization support in March 2025, with security updates in November 2025. The approach differs by transport:

### HTTP/Streamable HTTP Transport (Remote Servers)
Full OAuth 2.1 flow with automatic discovery:

1. **Client connects** → Server responds `401 Unauthorized` with `WWW-Authenticate` header pointing to Protected Resource Metadata (PRM)
2. **Metadata discovery** → Client fetches PRM document to learn about authorization server, supported scopes
3. **Authorization server discovery** → Client fetches OIDC/OAuth metadata for endpoints
4. **Dynamic Client Registration** (optional) → Client registers itself, receives `client_id`
5. **PKCE Authorization** → Client opens browser, user logs in, grants consent, receives auth code
6. **Token exchange** → Client exchanges code + PKCE verifier for access/refresh tokens
7. **Authenticated requests** → Client sends `Authorization: Bearer <token>` on all MCP requests

**Source**: [MCP Authorization Tutorial](https://modelcontextprotocol.io/docs/tutorials/security/authorization)

### STDIO Transport (Local Servers — Most Common)
For local MCP servers using stdio transport, the MCP spec explicitly notes:

> "For MCP servers using the STDIO transport, you can use environment-based credentials or credentials provided by third-party libraries embedded directly in the MCP server instead."

This means **environment variables are the standard pattern** for stdio-based servers. The server reads credentials from env vars at startup and handles Reddit OAuth internally.

**Source**: [MCP Authorization Spec](https://modelcontextprotocol.io/docs/tutorials/security/authorization)

### How Existing Reddit MCP Servers Handle Auth

| Server | Method | UX Pattern |
|--------|--------|-----------|
| jordanburke | 3-tier: env vars for credentials, auto-detection | Best UX — works with zero config, upgrades gracefully |
| reddit-mcp-buddy | 3-tier: env vars, CLI interactive setup for testing | Good — interactive fallback |
| Arindam200 | Env vars only (client_id/secret + optional user/pass) | Standard |
| Dialog | Server-managed Descope OAuth (hosted) | Best for multi-user, but requires hosted backend |
| eliasbiondo | None needed (redd library) | Simplest — but limited to public data |

---

## 1.2 Reddit's OAuth2 App Types: Which to Use

Reddit offers three OAuth2 app types. The choice directly impacts our MCP server's auth UX:

### Script App (Recommended for Single-User MCP)
- **Grant type**: Password grant (`grant_type=password`)
- **Flow**: Server sends client_id, client_secret, username, password directly to Reddit's token endpoint
- **Client secret**: Kept secure (runs on user's machine)
- **Pros**: Simplest flow, no browser redirect needed, perfect for personal MCP use
- **Cons**: Only the app developer's account(s) can use it, requires knowing user's password
- **Token lifetime**: 1 hour access token, permanent refresh token if `duration=permanent`
- **Best for**: Claude Desktop / Claude Code / Cursor personal use

### Web App (Recommended for Hosted/Multi-User MCP)
- **Grant type**: Authorization code (`grant_type=authorization_code`)
- **Flow**: User redirected to Reddit login page → consent → redirect back with auth code → exchange for tokens
- **Client secret**: Kept secure on server
- **Pros**: Multi-user support, no password handling, standard OAuth flow
- **Cons**: Requires browser redirect, more complex setup
- **Token lifetime**: 1 hour access token, permanent refresh token with `duration=permanent`
- **Best for**: Hosted MCP servers (HTTP transport), multi-user deployments

### Installed App
- **Grant type**: Implicit grant (no refresh tokens!) OR authorization code (limited)
- **Flow**: Browser redirect with custom URI scheme
- **Client secret**: Cannot be kept secret
- **Cons**: No refresh tokens with implicit grant, less secure
- **Best for**: Mobile apps — NOT recommended for MCP servers

**Source**: [Reddit OAuth2 App Types](https://github.com/reddit-archive/reddit/wiki/oauth2-app-types), [Reddit OAuth2 Wiki](https://github.com/reddit-archive/reddit/wiki/oauth2)

### Recommendation for Our Server

**Support both Script and Web app types** with a configuration switch:

```
# Script app (default — single user, simplest)
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
REDDIT_APP_TYPE=script

# Web app (multi-user, hosted)
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_REDIRECT_URI=http://localhost:8080/callback
REDDIT_APP_TYPE=web
```

---

## 1.3 Reddit Token Lifetimes & Refresh

| Token Type | Lifetime | Notes |
|-----------|---------|-------|
| Access Token | **1 hour** | All bearer tokens expire after 1 hour |
| Refresh Token | **Permanent** | Only issued when `duration=permanent` is requested |
| Application-Only Token | **1 hour** | For app-only OAuth (no user context) |

### Refresh Flow
```
POST https://www.reddit.com/api/v1/access_token
grant_type=refresh_token
refresh_token=TOKEN
Authorization: Basic base64(client_id:client_secret)
```

### Token Revocation
```
POST https://www.reddit.com/api/v1/revoke_token
token=TOKEN
token_type_hint=refresh_token|access_token
```

**Critical for MCP**: Revoking a refresh token also revokes ALL associated access tokens.

### Implementation Pattern

jordanburke's implementation handles this elegantly:
- **RedditClient** is a singleton with axios interceptors
- Token refresh happens **automatically** via interceptors when a 401 is received
- No user intervention needed — the MCP server handles refresh transparently
- If refresh fails, tools return a clear error message rather than crashing

**Source**: [jordanburke CLAUDE.md](https://github.com/jordanburke/reddit-mcp-server/blob/main/CLAUDE.md)

---

## 1.4 Token Storage Best Practices

### Current Landscape
A Trail of Bits report ([April 2025](https://blog.trailofbits.com/2025/04/30/insecure-credential-storage-plagues-mcp/)) found that **insecure credential storage plagues MCP** — many servers store tokens in plaintext .env files.

### Recommended Storage Hierarchy

| Method | Security | Convenience | When to Use |
|--------|---------|------------|-------------|
| **System keychain** (macOS Keychain, Windows Credential Manager, Linux Secret Service) | Highest | Medium | Production deployments |
| **Environment variables** (set by parent process) | Good | High | stdio transport (Claude Desktop, Cursor) |
| **.env file** (gitignored, local only) | Moderate | Highest | Development, personal use |
| **Centralized secrets manager** (AWS SM, Doppler, Vault) | Highest | Low | Enterprise / hosted deployments |
| **Hardcoded in code** | None | N/A | **NEVER** |

**Source**: [Stainless MCP API Key Management](https://www.stainless.com/mcp/mcp-server-api-key-management-best-practices), [Trail of Bits MCP Security](https://blog.trailofbits.com/2025/04/30/insecure-credential-storage-plagues-mcp/)

### For Our Server
The standard pattern for MCP servers connected via stdio (Claude Desktop/Code/Cursor):
1. **MCP client config** passes env vars to the server process
2. Server reads `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, etc. from env at startup
3. Server handles token acquisition and refresh internally
4. Tokens are **in-memory only** — never persisted to disk by the server
5. If tokens expire and can't be refreshed, return clear error to the LLM

---

## 1.5 jordanburke's 3-Tier Auth: How It Works

This is the **best auth UX pattern** observed across all Reddit MCP implementations:

### Tier 1: Anonymous (Zero Config)
- **Config needed**: None
- **Rate limit**: ~10 requests/minute
- **Capabilities**: Read-only (posts, comments, search, subreddit info)
- **How it works**: Uses Reddit's public JSON API (append `.json` to URLs)
- **User experience**: Install and run immediately — zero friction

### Tier 2: Auto (Default)
- **Config needed**: Optional — uses credentials if present, falls back to anonymous
- **Rate limit**: 60-100 req/min (if credentials found) or ~10 (if not)
- **Capabilities**: Read-only with higher limits if credentials present
- **How it works**: Checks env for `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` at startup. If found, authenticates. If not, continues in anonymous mode.
- **User experience**: "It just works" — auto-detects available capabilities

### Tier 3: Authenticated (Full Access)
- **Config needed**: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`
- **Rate limit**: 60-100 req/min
- **Capabilities**: Full read + write (create, edit, delete posts/comments)
- **How it works**: Password grant OAuth2 (script app type)
- **User experience**: Requires credentials but enables full functionality

### Key Design Decisions
- Write tools **gracefully fail** with clear error messages if credentials are missing (rather than hiding tools)
- All tools are always **visible** to the LLM — auth just determines what succeeds
- `REDDIT_AUTH_MODE` env var overrides auto-detection (force anonymous, force authenticated)

**Source**: [jordanburke/reddit-mcp-server CLAUDE.md](https://github.com/jordanburke/reddit-mcp-server/blob/main/CLAUDE.md)

---

## 1.6 Best UX Pattern So Users Don't Hardcode Credentials

### For STDIO Deployments (Claude Desktop, Claude Code, Cursor)

The client config file handles credential injection:

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["reddit-mcp-server"],
      "env": {
        "REDDIT_CLIENT_ID": "${REDDIT_CLIENT_ID}",
        "REDDIT_CLIENT_SECRET": "${REDDIT_CLIENT_SECRET}",
        "REDDIT_USERNAME": "${REDDIT_USERNAME}",
        "REDDIT_PASSWORD": "${REDDIT_PASSWORD}"
      }
    }
  }
}
```

Users set env vars in their shell profile (~/.zshrc, ~/.bashrc) or use a .env file. The MCP client passes them through.

### For HTTP Deployments (Hosted)

Use MCP's native OAuth 2.1 flow:
1. Server advertises Protected Resource Metadata
2. Client (VS Code, etc.) initiates OAuth flow
3. User authenticates in browser
4. Server receives tokens and manages refresh
5. User never sees or handles credentials directly

### Progressive Enhancement Pattern (Recommended)

```
1. First run: Server starts in anonymous mode (zero config)
2. Server tool responses include hint: "For write access, set REDDIT_CLIENT_ID..."
3. User adds credentials → restart → auto-detects upgraded capabilities
4. Write tools become functional without any code changes
```

---

# Part 2: MCP Server Architecture Best Practices (March 2026)

## 2.1 Latest MCP SDK Versions & Features

### TypeScript SDK
- **Latest**: v1.28.0 (March 2026)
- **Package**: `@modelcontextprotocol/sdk`
- **Key features**:
  - Streamable HTTP transport (recommended for remote)
  - STDIO transport (for local)
  - OAuth 2.1 middleware (auth router, bearer auth middleware)
  - Session management via `Mcp-Session-Id` header
  - Express/Hono middleware packages
  - Full tool/resource/prompt registration
  - v2 API docs available, stable v2 release anticipated Q1-Q2 2026

### Python SDK
- **Latest**: v1.26.0 (January 2026)
- **Package**: `mcp` on PyPI
- **Key features**:
  - Streamable HTTP support
  - STDIO transport
  - SEP-1577 sampling support
  - Resource and ResourceTemplate metadata
  - FastMCP framework (higher-level, recommended): `fastmcp` on PyPI

### FastMCP (Python — Recommended)
- **Latest**: v3.x (March 2026)
- **Package**: `fastmcp`
- **Key features**:
  - Server composition via `mount()` — combine multiple servers
  - Namespace support for tool/resource/prompt isolation
  - Tag filtering
  - Remote server proxying
  - Automatic OpenAPI-to-MCP conversion
  - HTTP + STDIO transports

**Sources**: [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), [Python SDK](https://github.com/modelcontextprotocol/python-sdk), [FastMCP](https://gofastmcp.com/servers/composition)

---

## 2.2 Transport Options: When to Use Which

| Transport | Use Case | Auth Support | Scaling | Setup |
|-----------|---------|-------------|---------|-------|
| **STDIO** | Local tools, Claude Desktop/Code/Cursor | Env vars only | Single user | Simplest |
| **SSE** | **Deprecated** (spec 2025-03-26) — legacy only | Limited | Limited | Avoid for new projects |
| **Streamable HTTP** | Production, remote, multi-user, cloud | Full OAuth 2.1 | Horizontal (stateless) | Most complex |

### STDIO (Recommended for Our Primary Target)
- Zero network configuration
- Claude Desktop, Claude Code, Cursor all support it natively
- One client per server instance
- Server runs as subprocess — started/stopped by the MCP client
- **This is what 90%+ of Reddit MCP users will use**

### Streamable HTTP (For Advanced/Hosted Deployment)
- Introduced in spec 2025-03-26 as SSE replacement
- Stateless architecture for horizontal scaling behind load balancers
- Full HTTP authentication ecosystem (Bearer tokens, OAuth, mTLS)
- Multi-client support (hundreds simultaneously)
- Works with standard infrastructure (AWS, GCP, Kubernetes, Docker)

### Our Strategy
**Support both STDIO (primary) and Streamable HTTP (optional)**:
- STDIO for personal use (vast majority of users)
- HTTP for hosted/enterprise deployments
- Single codebase with transport configuration via env var

**Source**: [MCP Transports Guide](https://dev.to/zoricic/understanding-mcp-server-transports-stdio-sse-and-http-streamable-5b1p), [MCP Server Transports](https://docs.roocode.com/features/mcp/server-transports)

---

## 2.3 Tool Organization for 30+ Tools

Our Reddit MCP server will have 50-100+ tools. Here's how to organize them:

### Naming Convention: `reddit_{noun}_{verb}`

Following the **domain-noun-verb** pattern recommended by AWS and community best practices:

```
# Posts
reddit_post_get
reddit_post_create
reddit_post_edit
reddit_post_delete
reddit_post_search
reddit_post_crosspost

# Comments
reddit_comment_get
reddit_comment_create
reddit_comment_edit
reddit_comment_delete

# Subreddits
reddit_subreddit_get_info
reddit_subreddit_get_rules
reddit_subreddit_get_posts
reddit_subreddit_get_wiki
reddit_subreddit_search

# Users
reddit_user_get_info
reddit_user_get_posts
reddit_user_get_comments

# Moderation
reddit_mod_get_queue
reddit_mod_approve
reddit_mod_remove
reddit_mod_ban_user
reddit_mod_get_log

# Flair
reddit_flair_get
reddit_flair_set
reddit_flair_list_templates
```

**Why this works**:
- Alphabetical sorting groups related operations (`reddit_mod_*`, `reddit_post_*`)
- LLMs can scan and identify the right tool quickly
- No naming collisions with other MCP servers
- `reddit_` prefix makes all tools immediately identifiable

### Tool Count Guidelines

| Count | Approach |
|-------|---------|
| **1-15** | Single server, flat tool list |
| **15-50** | Single server with domain-noun-verb grouping |
| **50+** | Consider splitting into separate servers OR use FastMCP composition |

### Splitting Strategy (If Needed)

```
reddit-read-mcp    → All read operations (posts, comments, search, users, subreddits)
reddit-write-mcp   → All write operations (create, edit, delete, post, comment)
reddit-mod-mcp     → All moderation operations (queue, ban, approve, flair, wiki)
```

**OR** use FastMCP's `mount()` for server composition:

```python
main = FastMCP("Reddit MCP")
main.mount(read_server, namespace="reddit_read")
main.mount(write_server, namespace="reddit_write")
main.mount(mod_server, namespace="reddit_mod")
```

**Sources**: [AWS Tool Organization](https://docs.aws.amazon.com/prescriptive-guidance/latest/mcp-strategies/mcp-tool-strategy-organization.html), [MCP Best Practices](https://www.philschmid.de/mcp-best-practices), [FastMCP Composition](https://gofastmcp.com/servers/composition)

---

## 2.4 Error Handling & Rate Limit Propagation

### MCP Error Handling Rules

1. **Tool errors go in the result object** (not protocol-level errors):
   ```json
   {
     "content": [{"type": "text", "text": "Error: Subreddit r/nonexistent not found"}],
     "isError": true
   }
   ```

2. **Protocol-level errors** are only for MCP protocol issues (invalid JSON-RPC, unknown method)

3. **Error messages must be LLM-actionable** — the LLM should understand what went wrong and what to do next:
   - BAD: `"Error 429"`
   - GOOD: `"Reddit API rate limit reached (100 requests/minute). Please wait 60 seconds before retrying."`

### Rate Limit Strategy

```
1. Track requests internally (token bucket algorithm)
2. Respect Reddit's X-Ratelimit-* response headers
3. When approaching limit: add automatic delays (don't fail immediately)
4. When limit hit: return isError with clear retry guidance
5. Different limits for read (higher) vs. write (lower, with safe mode delays)
```

### Reddit Rate Limit Headers
```
X-Ratelimit-Used: 5
X-Ratelimit-Remaining: 95
X-Ratelimit-Reset: 45
```

**Source**: [MCP Tools Spec](https://modelcontextprotocol.io/docs/concepts/tools), [MCP Error Handling Guide](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)

---

## 2.5 LLM-Friendly Tool Design

### Tool Descriptions

Every tool must have:
1. **Clear action statement** — what it does in one line
2. **When to use** — help the LLM know when to pick this tool
3. **Parameter descriptions** — every parameter fully described with constraints
4. **Return format hint** — what the LLM can expect back

Example:
```python
@server.tool()
def reddit_post_search(
    query: str,          # "Search terms to find Reddit posts"
    subreddit: str = "", # "Limit search to this subreddit (optional, empty = all Reddit)"
    sort: Literal["relevance", "hot", "top", "new", "comments"] = "relevance",
    time_filter: Literal["hour", "day", "week", "month", "year", "all"] = "all",
    limit: int = 25      # "Number of results (1-100, default 25)"
) -> str:
    """Search Reddit posts across all subreddits or within a specific subreddit.

    Use this when the user wants to find posts about a topic.
    Returns post titles, scores, comment counts, and direct URLs.
    """
```

### Key Principles from [philschmid.de](https://www.philschmid.de/mcp-best-practices):

1. **Outcomes, not operations** — Design tools around what the agent wants to achieve, not raw API endpoints. One `reddit_post_search` > three separate search endpoints.

2. **Flatten arguments** — Use top-level primitives with `Literal` types for constrained choices. No nested dicts.

3. **Instructions are context** — Every docstring, error message, and response text influences agent behavior.

4. **Paginate always** — Include `limit` parameter (default 25, max 100), return `has_more` and `next_offset` metadata.

5. **Curate ruthlessly** — 5-15 tools per domain group. Delete tools that aren't used.

---

## 2.6 MCP Spec Features Relevant to Reddit MCP

### Tools (Core — All implementations use)
Our primary mechanism. Every Reddit operation is a tool.

### Resources (Under-utilized — Only Dialog uses)
Resources are **read-only data** exposed via URIs. Perfect for:

```
reddit://subreddit/{name}/info     → Subreddit metadata
reddit://subreddit/{name}/rules    → Subreddit rules
reddit://user/{name}/profile       → User profile data
reddit://server/config             → Server configuration and capabilities
```

Resources let the LLM **browse** data without invoking tools, reducing tool call overhead for read-heavy workflows.

### Prompts (Under-utilized — Only Dialog uses)
Reusable instruction templates. Perfect for:

```
reddit_research      → "Research a topic across Reddit, find key discussions, summarize findings"
reddit_moderate      → "Review mod queue, apply consistent moderation decisions"
reddit_content_plan  → "Plan content creation for a subreddit, suggest timing and topics"
reddit_user_analysis → "Analyze a Reddit user's activity patterns and interests"
```

Prompts standardize complex workflows without users needing to craft detailed instructions.

### Sampling (Advanced — No Reddit MCP uses yet)
Allows the server to request LLM completions from the client. Could enable:
- Server-side content analysis (sentiment, topic classification)
- Smart moderation recommendations
- Content suggestion generation

### Elicitation (New — No implementations yet)
Allows servers to request missing context from users mid-operation:
- "Which subreddit do you want to post to?"
- "This post has multiple flairs available — which one?"

### Roots
Define filesystem boundaries — not directly relevant for Reddit API server, but useful if we add data export features.

**Sources**: [MCP Features Guide (WorkOS)](https://workos.com/blog/mcp-features-guide), [VS Code MCP Blog](https://devblogs.microsoft.com/visualstudio/mcp-prompts-resources-sampling/)

---

## Architecture Recommendation Summary

### For Our Reddit MCP Server

```
┌─────────────────────────────────────────────┐
│              Reddit MCP Server               │
│                                              │
│  Transport: STDIO (primary) + HTTP (optional)│
│  Auth: 3-tier (anon → app-only → full OAuth) │
│  SDK: TypeScript @modelcontextprotocol/sdk   │
│        OR Python FastMCP                     │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Read   │  │  Write   │  │    Mod    │  │
│  │  Tools   │  │  Tools   │  │   Tools   │  │
│  │ (anon ok)│  │(auth req)│  │(auth req) │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │         Reddit OAuth Client              ││
│  │  - Auto token refresh (1hr expiry)       ││
│  │  - Script app (password) + Web app (AC)  ││
│  │  - Singleton with interceptors           ││
│  │  - In-memory token storage only          ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ┌──────────────┐  ┌───────────────────────┐│
│  │  Resources   │  │      Prompts          ││
│  │ (subreddit   │  │ (research, moderate,  ││
│  │  info, rules)│  │  content planning)    ││
│  └──────────────┘  └───────────────────────┘│
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │         Safety Layer                     ││
│  │  - Rate limiting (token bucket)          ││
│  │  - Duplicate detection                  ││
│  │  - Safe mode (off/standard/strict)      ││
│  │  - Bot disclosure footer                ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transport | STDIO + HTTP | STDIO for 90% of users; HTTP for hosted |
| Auth pattern | 3-tier auto-detect | Best UX from competitive analysis |
| Tool naming | `reddit_{noun}_{verb}` | AWS/community best practice, LLM-scannable |
| Tool count | 50-80 in single server | Under 50 threshold, or use FastMCP mount() |
| Error pattern | isError + actionable messages | MCP spec requirement + LLM usability |
| Token management | Singleton + auto-refresh interceptors | jordanburke's proven pattern |
| Token storage | In-memory only (env vars at startup) | Security best practice for stdio |
| Reddit app type | Script (default) + Web (optional) | Script simplest for MCP; Web for hosted |
| MCP primitives | Tools + Resources + Prompts | Differentiate from all competitors (tools-only) |
| Safety | Configurable safe mode | Reddit Responsible Builder Policy compliance |

---

## Sources

### MCP Authorization & OAuth
1. [MCP Authorization Tutorial](https://modelcontextprotocol.io/docs/tutorials/security/authorization) — Official MCP OAuth 2.1 guide (accessed 2026-03-27) ⭐⭐⭐⭐⭐
2. [Implementing MCP OAuth (Upstash)](https://upstash.com/blog/mcp-oauth-implementation) — Deep-dive on PKCE, DCR, token exchange (accessed 2026-03-27) ⭐⭐⭐⭐
3. [Auth0 MCP Introduction](https://auth0.com/blog/an-introduction-to-mcp-and-authorization/) — OAuth patterns for MCP (accessed 2026-03-27) ⭐⭐⭐⭐
4. [MCP OAuth Security Pitfalls (Obsidian Security)](https://www.obsidiansecurity.com/blog/when-mcp-meets-oauth-common-pitfalls-leading-to-one-click-account-takeover) — Security risks and mitigations (accessed 2026-03-27) ⭐⭐⭐⭐⭐

### Reddit OAuth2
5. [Reddit OAuth2 Wiki](https://github.com/reddit-archive/reddit/wiki/oauth2) — Official OAuth2 spec: token lifetimes, refresh, scopes (accessed 2026-03-27) ⭐⭐⭐⭐⭐
6. [Reddit OAuth2 App Types](https://github.com/reddit-archive/reddit/wiki/oauth2-app-types) — Script vs Web vs Installed (accessed 2026-03-27) ⭐⭐⭐⭐⭐
7. [Reddit OAuth2 Quick Start](https://github.com/reddit-archive/reddit/wiki/OAuth2-Quick-Start-Example) — Code examples (accessed 2026-03-27) ⭐⭐⭐⭐

### MCP Server Architecture
8. [MCP Best Practices (philschmid.de)](https://www.philschmid.de/mcp-best-practices) — 6 core practices: outcomes, flatten args, curate, name, paginate (accessed 2026-03-27) ⭐⭐⭐⭐⭐
9. [AWS Tool Organization Guide](https://docs.aws.amazon.com/prescriptive-guidance/latest/mcp-strategies/mcp-tool-strategy-organization.html) — domain-noun-verb naming, 50-tool limit (accessed 2026-03-27) ⭐⭐⭐⭐⭐
10. [FastMCP Server Composition](https://gofastmcp.com/servers/composition) — mount(), namespacing, proxying (accessed 2026-03-27) ⭐⭐⭐⭐
11. [MCP Transports Guide](https://dev.to/zoricic/understanding-mcp-server-transports-stdio-sse-and-http-streamable-5b1p) — STDIO vs SSE vs HTTP Streamable (accessed 2026-03-27) ⭐⭐⭐⭐
12. [Docker MCP Best Practices](https://www.docker.com/blog/mcp-server-best-practices/) — Production deployment (accessed 2026-03-27) ⭐⭐⭐⭐

### MCP SDKs
13. [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — v1.28.0 (accessed 2026-03-27) ⭐⭐⭐⭐⭐
14. [Python SDK](https://github.com/modelcontextprotocol/python-sdk) — v1.26.0 (accessed 2026-03-27) ⭐⭐⭐⭐⭐
15. [MCP SDK Overview](https://modelcontextprotocol.io/docs/sdk) — All supported languages (accessed 2026-03-27) ⭐⭐⭐⭐⭐

### MCP Features & Spec
16. [MCP Features Guide (WorkOS)](https://workos.com/blog/mcp-features-guide) — Tools, Resources, Prompts, Sampling, Roots, Elicitation (accessed 2026-03-27) ⭐⭐⭐⭐⭐
17. [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — Current spec version (accessed 2026-03-27) ⭐⭐⭐⭐⭐
18. [VS Code MCP Prompts/Resources/Sampling](https://devblogs.microsoft.com/visualstudio/mcp-prompts-resources-sampling/) — Practical MCP feature usage (accessed 2026-03-27) ⭐⭐⭐⭐

### Security & Credential Management
19. [Trail of Bits MCP Security Report](https://blog.trailofbits.com/2025/04/30/insecure-credential-storage-plagues-mcp/) — Credential storage vulnerabilities (accessed 2026-03-27) ⭐⭐⭐⭐⭐
20. [Stainless API Key Management](https://www.stainless.com/mcp/mcp-server-api-key-management-best-practices) — Best practices (accessed 2026-03-27) ⭐⭐⭐⭐
21. [MCP Secrets Plugin](https://github.com/amirshk/mcp-secrets-plugin) — System keychain integration (accessed 2026-03-27) ⭐⭐⭐

### Reference Implementations
22. [jordanburke/reddit-mcp-server CLAUDE.md](https://github.com/jordanburke/reddit-mcp-server/blob/main/CLAUDE.md) — Architecture reference: 3-tier auth, safe mode, tool org (accessed 2026-03-27) ⭐⭐⭐⭐⭐
23. [MCP Naming Conventions](https://zazencodes.com/blog/mcp-server-naming-conventions) — Tool naming best practices (accessed 2026-03-27) ⭐⭐⭐⭐
24. [MCP Tool Overload (PulseMCP)](https://www.pulsemcp.com/posts/agentic-mcp-configuration) — Managing large tool sets (accessed 2026-03-27) ⭐⭐⭐⭐
