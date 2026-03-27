# Research Catalog — Reddit MCP Server

> **Last Updated:** 2026-03-27
> **Librarian:** librarian
> **Total Documents:** 10 research documents (01–10), ALL COMPLETE
> **Total Lines:** ~7,863
> **Location:** All docs consolidated in `research/` with `XX-` prefix naming

---

## Document Index

### 01 — Reddit Official API Reference
- **File:** `research/01-reddit-official-api.md`
- **Researcher:** researcher-1
- **Lines:** 833
- **Status:** Completed | **Task:** #1
- **Topics:** OAuth2 authentication (3 app types, 4 grant flows), API endpoint catalog, thing/listing model (t1-t6 type prefixes), rate limits (60-100 QPM), pagination, Reddit Responsible Builder Policy
- **Key Findings:** All API access requires OAuth2 via `oauth.reddit.com`; JSON-based thing model; tiered pricing for commercial use; pre-approval required for new apps (2025+)

### 02 — Reddit API Libraries, SDKs & Wrappers
- **File:** `research/02-reddit-api-libraries.md`
- **Researcher:** researcher-2
- **Lines:** 862
- **Status:** Completed | **Task:** #2
- **Topics:** 20+ libraries across 12 languages, PRAW, AsyncPRAW, snoowrap (archived), redditwarp, go-reddit, download statistics, MCP SDK compatibility
- **Key Findings:** Recommends TypeScript (direct HTTP) or Python (PRAW) for MCP server; snoowrap is archived; PRAW is most mature library in any language

### 03 — Existing Reddit MCP Server Implementations
- **File:** `research/03-existing-reddit-mcp-servers.md`
- **Researcher:** researcher-3
- **Lines:** 544
- **Status:** Completed | **Task:** #3
- **Topics:** 15 implementations deep-analyzed, 39 total found on PulseMCP, tiered analysis (Tier 1-4), tool naming conventions, architecture patterns, auth approaches, comparison matrix, 30+ gap features, user feedback/issues
- **Key Findings:** Ecosystem is "large but shallow" — all focus on same narrow slice (read posts/comments/search); NO implementation covers moderation, wiki editing, flair CRUD, polls, live threads, chat, collections, scheduled posts; only Dialog uses all 3 MCP primitives; jordanburke has best CRUD + safety engineering; Reddit API access no longer self-service

### 04 — Reddit Content Capabilities
- **File:** `research/04-reddit-content-capabilities.md`
- **Researcher:** researcher-4
- **Lines:** 753
- **Status:** Completed | **Task:** #4
- **Topics:** Media uploads (image/video/gallery via S3), polls (creation + reading), live threads (full API), collections (CRUD), crossposting, awards/gold (2024 overhaul), Reddit Chat (SendBird — NOT in standard API), Reddit Talk (shut down March 2023), Community Points (discontinued Oct 2023), flair system
- **Key Findings:** Media uses multi-step S3 upload flow; chat is inaccessible via standard API (SendBird); Reddit Talk and Community Points are dead; flair has comprehensive API support

### 05 — Reddit Moderation, Admin & Automation APIs
- **File:** `research/05-reddit-moderation-apis.md`
- **Researcher:** researcher-5
- **Lines:** 849
- **Status:** Completed | **Task:** #5
- **Topics:** Content moderation (approve/remove/spam), user management (ban/mute/contributor), queue management (modqueue/reports/spam/unmoderated/edited), flair management, wiki control, new modmail, mod log, mod notes, subreddit config, traffic stats, rules management, removal reasons, community styling, Devvit platform, OAuth2 scopes (modposts, modconfig, modflair, modlog, modcontributors, modmail, modwiki, modnote)
- **Key Findings:** Extensive mod API surface; all gated behind granular OAuth2 scopes; Devvit platform provides event-driven triggers beyond traditional API bots

### 06 — Reddit OAuth UX Patterns + MCP Server Architecture Best Practices
- **File:** `research/06-oauth-and-mcp-architecture.md`
- **Researcher:** researcher-3
- **Lines:** 642
- **Status:** Completed | **Task:** #6
- **Topics:** MCP OAuth 2.1 spec (HTTP vs stdio), Reddit OAuth app types (script vs web), token lifetimes (1-hour access, permanent refresh), 3-tier auth pattern (anonymous → app → user), token storage, MCP SDK versions, transport options (stdio/HTTP/streamable), tool organization & naming (`domain_noun_verb`), tool count guidance (<50), error handling patterns, MCP resources/prompts/sampling, architecture diagram
- **Key Findings:** MCP spec now has native OAuth 2.1 with PKCE for HTTP transport; stdio servers use env vars; Reddit tokens are 1-hour with permanent refresh; "script" app type for single-user, "web" for multi-user; tool count should stay under 50; jordanburke's 3-tier auth is gold standard

### 07 — Reddit API Edge Cases, Undocumented Behavior & Gotchas
- **File:** `research/07-api-edge-cases-and-gotchas.md`
- **Researcher:** researcher-1
- **Lines:** 687
- **Status:** Completed | **Task:** #7
- **Topics:** Rate limit clarification (60 vs 100 RPM resolved — current limit is 100 QPM with 10-min rolling window), undocumented endpoints (gallery, poll, media upload, drafts), response format inconsistencies, comment tree edge cases, media upload flows, deprecated endpoints, field-level gotchas, `.json` suffix trick
- **Key Findings:** Current rate limit is 100 QPM per OAuth client ID (not 60); rolling 10-minute window allows bursting; elevated tier (600-1000 RPM) available by approval; always read `X-Ratelimit-Remaining` headers rather than hardcoding; multiple undocumented endpoints exist for gallery/poll/draft operations

### 08 — Reddit Content Formatting — Markdown, Rich Text JSON & Limits
- **File:** `research/08-reddit-content-formatting.md`
- **Researcher:** researcher-4
- **Lines:** 675
- **Status:** Completed | **Task:** #8
- **Topics:** Snudown markdown parser (Reddit's custom fork), RTJSON (Rich Text JSON) format, character limits by content type & Premium status, URL auto-linking behavior, inline media in comments, superscript/strikethrough/tables, content validation before submission
- **Key Findings:** Always use Markdown over RTJSON (RTJSON spec is unpublished); Reddit uses Snudown (custom Sundown fork) with Reddit-specific extensions; character limits vary by content type and Premium status; `r/subreddit` and `u/user` auto-link natively; inline images in comments have limited community support

### 09 — TypeScript MCP SDK Deep-Dive for Reddit MCP Server
- **File:** `research/09-typescript-mcp-sdk-deep-dive.md`
- **Researcher:** researcher-2
- **Lines:** 1,137
- **Status:** Completed | **Task:** #9 (follow-up to #2)
- **Topics:** SDK v1.28.0 structure & packages, McpServer high-level API, transport setup (stdio + Streamable HTTP), Zod v4 tool schemas, Reddit OAuth patterns (3 approaches), token bucket rate limiter with Reddit header propagation, testing pyramid (MCP Inspector + Vitest + CI in-memory client), tool naming (`reddit_{action}_{resource}`), 20-25 tool sweet spot, production file structure & deployment
- **Key Findings:** Use McpServer (high-level API) with Zod v4; 20-25 tools is sweet spot before model confusion; OAuth token management as shared service layer not per-tool; `isError: true` for recoverable errors, `McpError` for protocol violations; stdio for dev, Streamable HTTP for deployment; 36,800+ npm dependents shows SDK maturity

### 10 — Complete MCP Tool Inventory
- **File:** `research/10-tool-inventory.md`
- **Researcher:** researcher-5
- **Lines:** 327
- **Status:** Completed | **Task:** #10
- **Topics:** 60 tools across 3 implementation phases (Phase 1: 25 core, Phase 2: 18 extended, Phase 3: 17 power user), `reddit_{action}_{resource}` naming, auth tier distribution (22 anon / 14 user / 24 mod), OAuth scope requirements per phase, `manage_*` multi-operation pattern, competitive advantage analysis (16+ features no existing MCP server covers), cross-references to docs 01-06 and 09
- **Key Findings:** 60 tools organized in 3 phases; Phase 1 (25 tools) covers 80% use case; 16+ features with zero competition; `manage_*` pattern keeps phase counts manageable; auth distribution: 37% anon, 23% user, 40% mod

---

## Handoff Files

| File | Researcher | Status |
|------|-----------|--------|
| `.scratchpad/handoffs/researcher-2-2026-03-27-09-30-00-SUCCESS.md` | researcher-2 | SUCCESS |
| `.scratchpad/handoffs/researcher-3-existing-mcp-servers-2026-03-27-SUCCESS.md` | researcher-3 | SUCCESS |
| `.scratchpad/handoffs/researcher-4-content-capabilities-2026-03-27-SUCCESS.md` | researcher-4 | SUCCESS |
| `.scratchpad/handoffs/deep-research-agent-2026-03-27-09-15-00-SUCCESS.md` | deep-research | SUCCESS |
| `.scratchpad/handoffs/deep-research-agent-2026-03-27-12-05-00-SUCCESS.md` | deep-research | SUCCESS |

---

## Resolved Issues

1. ~~**Duplicate file:**~~ `reddit-api-libraries-and-sdks.md` (root) — **deleted** (was duplicate of `research/02-reddit-api-libraries.md`)
2. ~~**Inconsistent locations:**~~ All docs consolidated from `.documentation/` and root into `research/` with `XX-` prefix naming

**Note:** Original copies still exist in `.documentation/` as backups. Canonical versions are in `research/`.

---

## Cross-Reference: Topic Coverage Map

| Topic | Doc # | Coverage |
|-------|-------|----------|
| OAuth2 / Authentication | 01, 05 | Full |
| API Endpoints (general) | 01 | Full |
| Rate Limits | 01 | Full |
| Libraries & SDKs | 02 | Full (20+ libs, 12 langs) |
| Existing MCP Servers | 03 | Full (15 deep, 39 total) |
| Media Upload (image/video/gallery) | 04 | Full |
| Polls | 04 | Full |
| Live Threads | 04 | Full |
| Collections | 04 | Full |
| Crossposting | 04 | Full |
| Awards/Gold | 04 | Partial (2024 overhaul, sparse docs) |
| Reddit Chat | 04 | Confirmed inaccessible (SendBird) |
| Reddit Talk | 04 | Dead (shut down 2023) |
| Flair System | 04, 05 | Full |
| Moderation Actions | 05 | Full |
| Mod Queue/Reports | 05 | Full |
| Modmail | 05 | Full |
| Mod Notes/Log | 05 | Full |
| Wiki Management | 05 | Full |
| AutoModerator | 05 | Full |
| Subreddit Config | 05 | Full |
| Traffic Stats | 05 | Full |
| Devvit Platform | 05 | Full |
| MCP Architecture Best Practices | 03, 06 | Full |
| Rate Limit Details (resolved) | 01, 07 | Full (100 QPM confirmed) |
| Undocumented Endpoints | 07 | Full |
| API Response Gotchas | 07 | Full |
| Markdown Formatting (Snudown) | 08 | Full |
| Rich Text JSON (RTJSON) | 08 | Full |
| Content Length Limits | 08 | Full |
| OAuth UX for MCP Servers | 06 | Full |
| MCP SDK & Transport Options | 06 | Full |
| Tool Naming & Organization | 06, 09 | Full |
| MCP Resources/Prompts/Sampling | 06 | Full |
| TypeScript MCP SDK (v1.28) | 09 | Full |
| Zod Schema Validation | 09 | Full |
| Rate Limiting Implementation | 09 | Full |
| Testing Patterns (Inspector/Vitest) | 09 | Full |
| Production Deployment | 09 | Full |
| Complete Tool Inventory (60 tools) | 10 | Full |
| Implementation Phasing (3 phases) | 10 | Full |
| Auth Tier Distribution | 10 | Full |
| Competitive Advantage Analysis | 10 | Full |
| Gap Analysis (what to build) | 03, 10 | Full (30+ features → 60 tools) |

---

## Final Consolidated Research

- **File:** `research/FINAL-CONSOLIDATED-RESEARCH.md`
- **Author:** phd-lead
- **Status:** Complete
- **Description:** Master synthesis of all 10 research tracks into a single implementation-ready reference document. Covers executive summary, API landscape, authentication, rate limits, competitive analysis, technology stack, architecture design, content system, moderation system, 60-tool inventory (3 phases), implementation gotchas, MCP resources/prompts, and 20 locked-in decisions.
