---
title: Existing Reddit MCP Server Implementations — Comprehensive Competitive Analysis
date: 2026-03-27
researcher: researcher-3
status: completed
confidence: high
task_refs: [3]
---

# Existing Reddit MCP Server Implementations

## Executive Summary

As of March 2026, the Reddit MCP server ecosystem is **large but shallow**. PulseMCP alone lists **39 Reddit-related MCP servers**, with at least **15 distinct, notable implementations** on GitHub, npm, and PyPI. However, nearly all focus on the same narrow slice of Reddit's API: reading posts, comments, and basic search. **No single implementation comes close to comprehensive Reddit API coverage.** The gaps are enormous — moderation, wiki, flair, awards, polls, live threads, chat, collections, scheduled posts, and advertising are almost entirely untouched.

**Critical recent development**: Reddit's API access is no longer self-service. As of late 2024/2025, developers must apply and be approved under Reddit's Responsible Builder Policy. This is already causing issues across multiple implementations (see User Feedback section).

This creates a massive opportunity: a truly comprehensive Reddit MCP server would have no real competition.

---

## Tier 1: Major Implementations (High Stars, Active Development)

### 1. karanb192/reddit-mcp-buddy
- **URL**: [github.com/karanb192/reddit-mcp-buddy](https://github.com/karanb192/reddit-mcp-buddy)
- **Stars**: 570+ | **Forks**: 69 | **License**: MIT
- **Language**: TypeScript/Node.js
- **MCP SDK**: @modelcontextprotocol/sdk (TypeScript)
- **Auth**: 3-tier (Anonymous 10 req/min → App-Only 60 req/min → Authenticated 100 req/min)
- **Tools (5)**:
  - `browse_subreddit` — browse posts with sorting options
  - `search_reddit` — cross-Reddit or subreddit-scoped search
  - `get_post_details` — post with full comment threads
  - `user_analysis` — user profile and activity analysis
  - `reddit_explain` — Reddit terminology explainer (unique tool)
- **Strengths**: Zero-setup anonymous access, smart 50MB in-memory cache (configurable), LLM-optimized output formatting, clean code, privacy-focused (no external analytics, in-memory-only credential storage)
- **Limitations**: Read-only only, no write operations, no moderation tools
- **Maintenance**: Active (recent commits on main branch)
- **Code Quality**: Well-structured, good TypeScript typing, comprehensive README
- **Notable**: Most popular by stars; focused on LLM-optimized data delivery. Published as npm package `reddit-mcp-buddy`.

### 2. adhikasp/mcp-reddit
- **URL**: [github.com/adhikasp/mcp-reddit](https://github.com/adhikasp/mcp-reddit)
- **Stars**: 377 | **Forks**: 51 | **License**: MIT
- **Language**: Python (76.5%), Dockerfile (23.5%)
- **Auth**: Public API (no credentials needed)
- **Tools (1-2)**:
  - `fetch_hot_threads` — retrieves hot threads from subreddits
- **Strengths**: Simple, minimal, well-known, Docker support
- **Limitations**: Extremely limited tool set — essentially one function. No search, no user info, no write operations
- **Maintenance**: Last commit December 2024 — potentially stale
- **Code Quality**: Minimal but clean; no tests visible
- **Notable**: High stars for minimal functionality; benefited from early mover advantage. 4 contributors.

### 3. Arindam200/reddit-mcp
- **URL**: [github.com/Arindam200/reddit-mcp](https://github.com/Arindam200/reddit-mcp)
- **Stars**: 272 | **Forks**: 38 | **License**: MIT
- **Language**: Python (100%)
- **MCP SDK**: Python MCP SDK
- **Auth**: Two-tier (client_id/secret for read-only; + username/password for write)
- **Tools (13)**:
  - **Read (9)**: `get_user_info`, `get_user_comments`, `get_user_posts`, `get_top_posts`, `search_posts`, `get_subreddit_stats`, `get_trending_subreddits`, `get_submission_by_url`, `get_submission_by_id`
  - **Write (4)**: `who_am_i`, `create_post`, `reply_to_post`, `reply_to_comment`
- **Dependencies**: PRAW
- **Strengths**: Broadest tool coverage among Python implementations, includes write operations, subreddit health stats, trending discovery, AI-powered analysis recommendations
- **Limitations**: No edit/delete, no moderation, no flair/wiki/awards, no voting
- **Maintenance**: Created May 2025, 27 commits, 6 contributors — moderately active
- **Code Quality**: Reasonable structure, PRAW-based, clear tool definitions

### 4. Hawstein/mcp-server-reddit
- **URL**: [github.com/Hawstein/mcp-server-reddit](https://github.com/Hawstein/mcp-server-reddit)
- **Stars**: 152 | **Forks**: 29 | **License**: MIT
- **Language**: Python (96.7%)
- **Auth**: Public API via redditwarp (no credentials required)
- **Tools (8)**:
  - `get_frontpage_posts`, `get_subreddit_info`, `get_subreddit_hot_posts`, `get_subreddit_new_posts`, `get_subreddit_top_posts`, `get_subreddit_rising_posts`, `get_post_content`, `get_post_comments`
- **Dependencies**: [redditwarp](https://github.com/Pyprohly/redditwarp) library
- **Strengths**: Good subreddit browsing coverage with multiple sort modes, Docker support, multiple install methods (uvx, pip, Smithery), configurable limits (1-100 posts, 1-10 comment depth)
- **Limitations**: Read-only, no search, no user tools, no write operations, capped at 100 posts / 10 comment depth levels
- **Maintenance**: Last updated February 2025, 15 commits
- **Code Quality**: Well-structured, uses redditwarp instead of PRAW (lighter weight)

### 5. eliasbiondo/reddit-mcp-server
- **URL**: [github.com/eliasbiondo/reddit-mcp-server](https://github.com/eliasbiondo/reddit-mcp-server)
- **Stars**: 123 | **Forks**: 11 | **License**: MIT
- **Language**: Python (100%)
- **Auth**: None needed (uses `redd` library — no API keys, no browser required)
- **Tools (6)**:
  - `search`, `search_subreddit`, `get_post`, `get_subreddit_posts`, `get_user`, `get_user_posts`
- **Dependencies**: redd library (custom Reddit data access)
- **Architecture**: **Hexagonal (ports & adapters)** — cleanest architecture of all implementations. Clear separation: domain logic → application use cases → adapters (inbound/outbound)
- **Strengths**: Zero-config, clean architecture, multiple transports (stdio, HTTP), decent tool coverage
- **Limitations**: Read-only, public data only, 1-2 second throttling between paginated requests, 10-second timeout
- **Maintenance**: Last updated March 2026, 11 commits — active
- **Code Quality**: **Best architecture** — hexagonal pattern is exemplary for MCP server design

---

## Tier 2: Solid Feature-Rich Implementations

### 6. jordanburke/reddit-mcp-server
- **URL**: [github.com/jordanburke/reddit-mcp-server](https://github.com/jordanburke/reddit-mcp-server)
- **Stars**: 28 | **Forks**: 9 | **License**: MIT
- **Language**: TypeScript/Node.js
- **MCP SDK**: @modelcontextprotocol/sdk (TypeScript)
- **Auth**: 3-tier (Anonymous/Auto/Authenticated) with configurable env vars
- **Tools (15)** — **Most comprehensive tool set among well-maintained implementations**:
  - **Read (9)**: `get_reddit_post`, `get_top_posts`, `get_user_info`, `get_user_posts`, `get_user_comments`, `get_subreddit_info`, `get_trending_subreddits`, `get_post_comments`, `search_reddit`
  - **Write (6)**: `create_post`, `reply_to_post`, `edit_post`, `edit_comment`, `delete_post`, `delete_comment`
- **Strengths**: Full CRUD operations, safe mode with Reddit Responsible Builder Policy compliance, bot disclosure footer (`REDDIT_BOT_DISCLOSURE`), Docker + HTTP server mode, anti-spam protections:
  - Rate limiting (2-5 second delays between operations)
  - Duplicate content detection
  - Cross-subreddit posting safeguards
  - Configurable safety levels (off/standard/strict)
- **Limitations**: No moderation tools, no voting (intentionally), no flair/wiki/awards, no DM
- **Maintenance**: 132 commits — **most active development** of all implementations
- **Code Quality**: Production-grade with comprehensive safety engineering
- **Notable**: **Best overall feature completeness** despite lower stars. Published on npm as `reddit-mcp-server` v1.2.1. Available as Claude Desktop Extension (.mcpb).

### 7. king-of-the-grackles/reddit-research-mcp (Dialog)
- **URL**: [github.com/king-of-the-grackles/reddit-research-mcp](https://github.com/king-of-the-grackles/reddit-research-mcp)
- **Stars**: 94 | **Forks**: 17 | **License**: MIT
- **Language**: Python
- **MCP SDK**: FastMCP
- **Auth**: Descope OAuth2 (server-managed — no Reddit credentials needed from user, ~30 second first-use setup)
- **Tools (13)**:
  - **Core MCP (3)**: `discover_operations`, `get_operation_schema`, `execute_operation`
  - **Reddit Ops (5)**: `discover_subreddits`, `search_subreddit`, `fetch_posts`, `fetch_multiple`, `fetch_comments`
  - **Feed Management (5)**: `create_feed`, `list_feeds`, `get_feed`, `update_feed`, `delete_feed`
- **Resources**: `reddit://server-info` — MCP resource for documentation
- **Prompts**: `reddit_research` — automated research workflow template
- **Dependencies**: ChromaDB, PRAW, FastMCP
- **Strengths**:
  - **Semantic vector search** across 20,000+ subreddits using ChromaDB (unique!)
  - Batch concurrent fetching ("70% more efficient")
  - Persistent feed-based research tracking
  - Full citations with upvotes, awards, direct URLs
  - Hosted solution (HTTP transport via FastMCP.app)
  - Cross-device synchronization
- **Limitations**: Public data only, indexed subreddits limited to communities with 2k+ members (updated weekly), hosted dependency
- **Maintenance**: 94 commits — very active
- **Code Quality**: Well-engineered, uses MCP resources and prompts (not just tools)
- **Notable**: **Most innovative approach** — semantic search + research feeds + MCP resources/prompts. Only implementation using all three MCP primitives (tools, resources, prompts).

---

## Tier 3: Specialized / Niche Implementations

### 8. reddit-mcp-server (PyPI — andrewlwn77)
- **URL**: [pypi.org/project/reddit-mcp-server/](https://pypi.org/project/reddit-mcp-server/) | [github.com/reddit-mcp/reddit-mcp-server](https://github.com/reddit-mcp/reddit-mcp-server)
- **Stars**: 3 | **Version**: 1.2.0 (August 2025)
- **Language**: Python (99.1%)
- **Auth**: PRAW (client_id, client_secret, user_agent) + optional username/password
- **Tools (20)** — **Highest tool count of any implementation**:
  - **Reddit Instance (3)**: `get_random_subreddit`, `check_username_available`, `get_reddit_info`
  - **Subreddit Discovery (8)**: `search_subreddits`, `get_popular_subreddits`, `get_new_subreddits`, `get_subreddit_info`, `get_subreddit_rules`, `get_subreddit_moderators`, `get_subreddit_traffic`, `get_subreddit_wiki`
  - **Content (6)**: `search_subreddit_content`, `get_hot_posts`, `get_top_posts`, `get_post_details`, `get_post_comments`, `search_all_reddit`
  - **User (1)**: `search_user_content`
  - **Communities (1)**: `get_best_communities`
  - **Export (1)**: `export_data` (JSON/CSV)
- **Dependencies**: PRAW, Puppeteer, Node.js, Chrome/Chromium (complex multi-runtime)
- **Strengths**: Broadest tool set, **only implementation to expose subreddit rules, moderators, traffic stats, and wiki** (read-only), data export, market research focus, engagement metrics
- **Limitations**: Complex dependencies (Python + Node.js + Puppeteer + Chrome), low adoption, read-only, uses web scraping for some features
- **Notable**: Market research oriented — brand monitoring, competitor tracking, influencer analysis

### 9. jacklenzotti/pullpush-mcp
- **URL**: [github.com/jacklenzotti/pullpush-mcp](https://github.com/jacklenzotti/pullpush-mcp)
- **Stars**: 2 | **License**: MIT
- **Language**: TypeScript
- **Auth**: None (PullPush.io is free/unauthenticated)
- **Tools (2)**:
  - `search_comments` — historical Reddit comment search with filters (query, subreddit, author, date range, sort, size 1-100)
  - `search_submissions` — historical Reddit post search with filters (query, subreddit, author, title, selftext, dates, NSFW/video/locked/stickied/spoiler flags, score/comment count filters)
- **Strengths**: **Historical data access** — content deleted or removed from Reddit's official API, relative date formats ("30d", "1y"), flexible filtering
- **Limitations**: Capped at 100 results per query, dependent on PullPush.io availability, minimal feature set, 4 total commits
- **Notable**: **Only implementation offering access to deleted/archived Reddit content** via PullPush.io (successor to PushShift)

### 10. sbmeaper/reddit-ad-mcp
- **URL**: [github.com/sbmeaper/reddit-ad-mcp](https://github.com/sbmeaper/reddit-ad-mcp)
- **Stars**: 0
- **Language**: Python
- **Auth**: OAuth2 with refresh token (`adsread` scope) — requires one-time OAuth flow
- **Tools (6)**:
  - `get_accounts` — list accessible ad accounts
  - `get_campaigns` — list campaigns for an account
  - `get_ad_groups` — filter ad groups by campaign
  - `get_ads` — filter ads by ad group
  - `get_performance_report` — custom metrics/breakdowns (impressions, reach, clicks, spend, eCPM, CTR, CPC, video metrics, conversions)
  - `get_daily_performance` — convenience tool for daily trend analysis
- **Breakdowns**: date, country, region, community, placement, device_os
- **Strengths**: Reddit Ads API v3 integration, comprehensive performance metrics including video and conversion data, configurable defaults via config.local.json
- **Limitations**: Read-only, requires advertiser account, newly created
- **Notable**: **Only Python implementation covering Reddit Ads API**

### 11. mkerchenski/RedditAdsMcp
- **URL**: [github.com/mkerchenski/RedditAdsMcp](https://github.com/mkerchenski/RedditAdsMcp)
- **Stars**: 1 | **License**: MIT
- **Language**: C# (.NET 10) — **only C#/.NET Reddit MCP implementation**
- **Auth**: OAuth2 (Reddit Ads API) with refresh token via redirect URI
- **Tools (6)**: `ListAccounts`, `ListCampaigns`, `ListAdGroups`, `ListAds`, `GetPerformanceReport`, `GetDailyPerformance`
- **Distribution**: NuGet package `RedditAdsMcp`
- **Notable**: Demonstrates MCP server viability in .NET ecosystem; uses official ModelContextProtocol C# SDK

### 12. GeLi2001/reddit-mcp
- **URL**: [github.com/GeLi2001/reddit-mcp](https://github.com/GeLi2001/reddit-mcp)
- **Stars**: 3 | **Forks**: 4 | **License**: MIT
- **Language**: Python 3.10+ (FastMCP framework)
- **Auth**: OAuth2 (client_id, client_secret, user_agent — app credentials only, no user auth)
- **Tools (5)**: `search_reddit_posts`, `search_reddit_all`, `get_reddit_post_details`, `get_subreddit_info`, `get_hot_reddit_posts`
- **Limitations**: Read-only, basic tool set, ~60 req/min rate limit

### 13. netixc/reddit-mcp-server
- **URL**: [github.com/netixc/reddit-mcp-server](https://github.com/netixc/reddit-mcp-server)
- **Stars**: 2
- **Language**: Python 3.12+
- **Auth**: PRAW (full credentials) + redditwarp
- **Tools (5)**: `get_saved_posts`, `search_reddit`, `get_comments`, `reply_to_comment`, `fetch_reddit_post_content`
- **Notable**: **Only implementation exposing `get_saved_posts`** (authenticated user's saved posts — a personal data tool)

---

## Tier 4: Hosted / Platform Services

### 14. Apify Reddit MCP Server
- **URL**: [apify.com/mcp/reddit-mcp-server](https://apify.com/mcp/reddit-mcp-server)
- **Platform**: Apify Cloud (hosted at mcp.apify.com)
- **Auth**: Apify API token or OAuth2
- **Features**: Subreddit posts with comments, user details/profiles, community info with member counts, media elements/timestamps
- **Ecosystem**: Part of broader Apify MCP platform with multiple Reddit-specific actors:
  - Reddit Scraper (trudax) — general scraping
  - Reddit Scraper Lite — lightweight version
  - Reddit Community Posts Scraper Pro — community-focused
  - Reddit User Profile Scraper — user activity
  - Reddit Ads Scraper — advertising data
- **Limitation**: Cloud-hosted dependency, Apify pricing applies, not self-hostable

### 15. axelfooley/ai-reddit-mod
- **URL**: [github.com/AxelFooley](https://github.com/AxelFooley) (ai-reddit-mod repo)
- **Listed on**: PulseMCP as "Reddit Mod"
- **Features**: AI-assisted moderation with human-in-the-loop approval
- **Notable**: **Only implementation specifically targeting moderation** — but appears to be early stage with limited public documentation

### 16. Additional Notable Entries from PulseMCP Directory (39 total Reddit servers)
| Name | Author | Notable Feature |
|------|--------|----------------|
| Reddit Insights (lignertys) | lignertys | AI-powered semantic search across millions of posts |
| Reddit Ads (modelslab) | modelslab | Programmatic Reddit Ads API v3 — 98 MCP tools (94 API ops + 4 auth helpers) |
| Reddit (Strider Labs) | Strider Labs | Browser automation for Reddit interaction |
| Reddit Extractor (Andi Ellison) | Andi Ellison | API + HTML parsing for metadata extraction |
| Reddit (Matt Hesketh) | Matt Hesketh | Java-based OAuth integration |
| PuchAI Reddit & Productivity | datavorous | Multi-subreddit scraping + productivity features |
| FreshContext | PrinceGabriel-lgtm | Real-time aggregation from GitHub + HN + Reddit + arXiv |
| Decodo Web Scraper | Decodo | Professional scraping with geo-targeting for Reddit |
| Anysite | Anysite | Multi-platform API (LinkedIn, Instagram, Twitter, Reddit) |
| Rolli | rolli | Social media search across X, Reddit, Bluesky |

---

## User Feedback & Issues (from GitHub Issues)

### Critical Policy Issue Affecting All Implementations

**Reddit API access is no longer self-service.** Two open issues across repos flag this:
- [reddit-mcp-buddy #34](https://github.com/karanb192/reddit-mcp-buddy/issues/34): "NEW REDDIT POLICY: can't use reddit API without approval" (Nov 2025)
- [reddit-mcp-buddy #39](https://github.com/karanb192/reddit-mcp-buddy/issues/39): "Reddit API credentials no longer self-service - New Responsible Builder Policy" (Feb 2026)

**Impact**: Any implementation requiring Reddit API credentials now has a higher barrier to entry. Zero-config/anonymous implementations (eliasbiondo, reddit-mcp-buddy anonymous mode) gain relative advantage.

### Bug Reports Across Repos

| Repo | Issue | Description |
|------|-------|-------------|
| Hawstein | [#6](https://github.com/Hawstein/mcp-server-reddit/issues/6) | `get_subreddit_info` crashes with `KeyError: 'active_user_count'` — missing field handling |
| Hawstein | [#5](https://github.com/Hawstein/mcp-server-reddit/issues/5) | Dockerfile won't build |
| Hawstein | [#2](https://github.com/Hawstein/mcp-server-reddit/issues/2) | Smithery integration: "Error: No connection configuration found" |
| adhikasp | [#3](https://github.com/adhikasp/mcp-reddit/issues/3) | Connection instability with Cursor via Smithery |
| Arindam200 | [#1](https://github.com/Arindam200/reddit-mcp/issues/1) | "User authentication required" — auth not working |

### Feature Requests

| Repo | Issue | Request |
|------|-------|---------|
| Arindam200 | [#3](https://github.com/Arindam200/reddit-mcp/issues/3) | Detailed post content including comments |
| adhikasp | [#7](https://github.com/adhikasp/mcp-reddit/issues/7) | Personalized daily feed from subscriptions |
| adhikasp | [#10](https://github.com/adhikasp/mcp-reddit/issues/10) | Security vulnerability scan needed |

### Common Themes in User Feedback
1. **Connection instability** with Smithery integration (multiple repos)
2. **Missing error handling** for Reddit API response variations (KeyError crashes)
3. **Auth complexity** — users struggle with Reddit API credential setup
4. **Desire for more tools** — users want comments, subscriptions, personalized feeds
5. **Docker/deployment issues** — Dockerfiles breaking across environments
6. **Security concerns** — no security audits in any implementation

---

## Architectural Patterns & Tool Naming Conventions

### Authentication Approaches
| Approach | Implementations | Pros | Cons |
|----------|----------------|------|------|
| No auth (scraping/public API) | eliasbiondo, adhikasp, Hawstein, reddit-mcp-buddy (anon) | Zero friction | Low rate limits (~10 req/min), read-only |
| App-only OAuth (client credentials) | GeLi2001, PyPI market research | 60 req/min, no user context needed | No write access, still requires Reddit app registration |
| Full OAuth (user + password) | jordanburke, Arindam200, netixc | Write access, 100 req/min, full API | Requires all credentials, highest setup friction |
| Server-managed OAuth | Dialog (Descope) | Best UX, no user setup | Hosted dependency, privacy concerns |
| None (3rd-party API) | PullPush | Access deleted content | Third-party dependency, no official API |

### Technology Choices
| Stack | Count | Implementations | Notes |
|-------|-------|-----------------|-------|
| **Python + PRAW** | 5 | Arindam200, GeLi2001, netixc, PyPI market research, sbmeaper | Dominant pattern |
| **Python + redditwarp** | 1 | Hawstein | Lighter weight alternative |
| **Python + redd** | 1 | eliasbiondo | No auth needed |
| **Python + FastMCP** | 3 | GeLi2001, Dialog, sbmeaper | Growing framework |
| **TypeScript + custom HTTP** | 2 | jordanburke, reddit-mcp-buddy | Direct API calls |
| **TypeScript + MCP SDK** | 3 | jordanburke, reddit-mcp-buddy, PullPush | Official TS SDK |
| **C# + .NET MCP SDK** | 1 | mkerchenski | Niche |

### Tool Naming Conventions Observed

**Dominant pattern**: `get_` + `resource` (e.g., `get_hot_posts`, `get_user_info`, `get_subreddit_info`)

| Convention | Examples | Used By |
|-----------|----------|---------|
| `get_[resource]` | `get_frontpage_posts`, `get_post_comments` | Hawstein, Arindam200, GeLi2001, PyPI |
| `[action]_reddit` | `search_reddit`, `browse_subreddit` | reddit-mcp-buddy, jordanburke |
| `[action]_[resource]` | `fetch_hot_threads`, `create_post` | adhikasp, jordanburke |
| `[resource]_analysis` | `user_analysis` | reddit-mcp-buddy |
| `[verb]_[object]` | `discover_subreddits`, `execute_operation` | Dialog |

**Best practice observed**: jordanburke and reddit-mcp-buddy use consistent, LLM-friendly naming with clear action verbs.

### MCP Primitive Usage
| Primitive | Implementations Using It |
|-----------|------------------------|
| **Tools** | All 15 (100%) |
| **Resources** | Dialog only (`reddit://server-info`) |
| **Prompts** | Dialog only (`reddit_research`) |

**Key insight**: Only Dialog uses MCP resources and prompts. Every other implementation is tools-only. This is a missed opportunity — resources could expose subreddit data, and prompts could guide common workflows.

---

## Cross-Implementation Comparison Matrix

| Feature | reddit-mcp-buddy | adhikasp | Arindam200 | Hawstein | eliasbiondo | jordanburke | Dialog | PyPI market | PullPush |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Read Posts** | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| **Read Comments** | Y | Y | - | Y | Y | Y | Y | Y | Y |
| **Search** | Y | - | Y | - | Y | Y | Y | Y | Y |
| **User Profiles** | Y | - | Y | - | Y | Y | - | Y | - |
| **Subreddit Info** | - | - | Y | Y | - | Y | Y | Y | - |
| **Trending** | - | - | Y | - | - | Y | - | Y | - |
| **Create Post** | - | - | Y | - | - | Y | - | - | - |
| **Reply/Comment** | - | - | Y | - | - | Y | - | - | - |
| **Edit Content** | - | - | - | - | - | Y | - | - | - |
| **Delete Content** | - | - | - | - | - | Y | - | - | - |
| **Subreddit Rules** | - | - | - | - | - | - | - | Y | - |
| **Subreddit Mods** | - | - | - | - | - | - | - | Y | - |
| **Subreddit Traffic** | - | - | - | - | - | - | - | Y | - |
| **Subreddit Wiki** | - | - | - | - | - | - | - | Y | - |
| **Saved Posts** | - | - | - | - | - | - | - | - | - |
| **Semantic Search** | - | - | - | - | - | - | Y | - | - |
| **Historical Data** | - | - | - | - | - | - | - | - | Y |
| **Data Export** | - | - | - | - | - | - | Y | Y | - |
| **MCP Resources** | - | - | - | - | - | - | Y | - | - |
| **MCP Prompts** | - | - | - | - | - | - | Y | - | - |
| **Safety Mode** | - | - | - | - | - | Y | - | - | - |
| **Bot Disclosure** | - | - | - | - | - | Y | - | - | - |
| **Zero-Config** | Y | Y | - | Y | Y | Y | Y | - | Y |
| **Docker** | Y | Y | - | Y | - | Y | - | - | - |
| **Multiple Transports** | - | - | - | - | Y | Y | Y | - | - |
| **Language** | TS | Py | Py | Py | Py | TS | Py | Py | TS |
| **Stars** | 570 | 377 | 272 | 152 | 123 | 28 | 94 | 3 | 2 |
| **Commits** | recent | 16 | 27 | 15 | 11 | 132 | 94 | ~12 | 4 |

---

## Gap Analysis: What EVERY Implementation Misses

### Completely Missing Features (No implementation covers these):

**Moderation & Admin (highest-value gap)**:
1. **Mod Queue** — No modqueue access, no reports listing, no mod log
2. **Moderation Actions** — No ban, mute, remove, approve, spam, distinguish
3. **AutoModerator** — No config reading/writing
4. **User Notes** — No mod user notes (Toolbox-style)
5. **Ban Evasion Filters** — No access to ban evasion detection
6. **Crowd Control** — No crowd control settings management

**Content Management**:
7. **Flair Management** — No setting/editing user or post flair (CRUD)
8. **Polls** — No creating or reading poll data
9. **Crossposting** — No cross-post support
10. **Content Tagging** — No NSFW/spoiler marking tools
11. **Post Pinning** — No sticky/pin management
12. **Scheduled Posts** — No scheduling functionality
13. **Collections** — No subreddit collections management
14. **Post Requirements** — No reading/enforcing submission requirements

**Community Management**:
15. **Community Settings** — No subreddit settings read/write
16. **Subreddit Styling** — No style/banner/icon management
17. **Widget Management** — No sidebar widget CRUD
18. **Emojis** — No custom subreddit emoji management

**Communication**:
19. **Private Messages** — No inbox/PM access (some intentionally exclude)
20. **Chat** — No Reddit chat integration
21. **Notifications** — No notification management

**User Features**:
22. **Voting** — No upvoting/downvoting (intentionally excluded by all due to Reddit policy)
23. **Awards/Gilding** — No awarding or award info
24. **Friends/Blocked** — No friend/block list management
25. **Saved/Hidden Management** — Only netixc has `get_saved_posts`; none manage hidden
26. **User Trophies** — No trophy/karma breakdown info
27. **Multireddits** — No multi management

**Content Types**:
28. **Live Threads** — No live thread creation, updates, or monitoring
29. **Wiki Management** — Only PyPI `reddit-mcp-server` can *read* wikis; none can edit
30. **Report Management** — No reporting functionality

### Partially Covered Features:

1. **Subreddit Metadata** — Most get basic info; only PyPI version gets rules/mods/traffic/wiki
2. **User Analysis** — Basic profile info; no karma breakdown, trophy, account age analysis
3. **Write Operations** — Only 2 of 15 implementations (jordanburke, Arindam200) support create/edit/delete
4. **Comment Threading** — Most support comments but with depth limits (typically 10 levels)
5. **Multiple Sort Types** — Hawstein has the most sort variety (hot/new/top/rising/frontpage)
6. **Batch Operations** — Only Dialog supports batch/concurrent fetching

---

## Innovative Approaches Worth Adopting

| Innovation | Source | Value | Adoption Difficulty |
|-----------|--------|-------|-------------------|
| **Semantic vector search** across 20K+ subreddits | Dialog (ChromaDB) | Unique differentiator for discovery | High (requires vector DB) |
| **Safe mode** with configurable anti-spam levels | jordanburke | Essential for policy compliance | Low |
| **Bot disclosure footer** | jordanburke | Reddit policy compliance | Trivial |
| **Hexagonal architecture** | eliasbiondo | Clean, testable, maintainable | Medium |
| **LLM-optimized output** formatting | reddit-mcp-buddy | Better AI consumption of data | Low |
| **MCP Resources + Prompts** (not just tools) | Dialog | Richer MCP integration | Low |
| **Historical content access** via PullPush | pullpush-mcp | Unique data source | Low |
| **3-tier auth** (anonymous → app → user) | jordanburke, reddit-mcp-buddy | Maximum flexibility | Medium |
| **Subreddit deep metadata** (rules, mods, traffic, wiki) | PyPI market research | Comprehensive subreddit intel | Low (PRAW supports this) |
| **Feed management** for persistent research | Dialog | Research workflow support | Medium |
| **Data export** (JSON/CSV) | PyPI market research, Dialog | Analysis pipeline integration | Low |

---

## Recommendations for Our Implementation

### What Would Make Ours Definitively Better

**The answer is clear: COMPREHENSIVE COVERAGE.** Every existing implementation covers 5-20 tools focusing on the same features. Our server should cover 50-100+ tools spanning the full Reddit API.

### Priority 1: Immediate Differentiators (What nobody has)
1. **Full Moderation Suite** — mod queue, ban/mute/unban, approve/remove, mod log, AutoModerator config, user notes, distinguished comments
2. **Flair Management** — user flair CRUD, post flair CRUD, flair templates
3. **Wiki CRUD** — read AND write/edit wiki pages
4. **Content Moderation Actions** — NSFW/spoiler marking, lock/unlock, sticky/unsticky, distinguish
5. **Private Messages** — inbox management (read, send, reply, mark read)
6. **Scheduled Posts** — create and manage scheduled submissions
7. **Collections** — subreddit collections management
8. **Crossposting** — cross-post to other subreddits
9. **Multireddit Support** — create, edit, manage multireddits
10. **Poll Creation** — create and read poll data

### Priority 2: Must-Have Baseline (Match the best existing implementations)
1. Full CRUD (create, read, edit, delete) for posts and comments
2. Multi-sort browsing (hot, new, top, rising, controversial, best)
3. Search (subreddit-scoped and site-wide)
4. User profiles and activity history
5. Subreddit metadata (info, rules, moderators, traffic, wiki)
6. Trending subreddits discovery
7. Zero-config anonymous mode + authenticated mode (3-tier)
8. LLM-optimized output formatting
9. Anti-spam safety guardrails (safe mode)
10. Multiple transports (stdio + HTTP/SSE)

### Priority 3: Nice-to-Have Advanced Features
1. MCP Resources for subreddit data and user profiles
2. MCP Prompts for guided workflows (research, moderation, content creation)
3. Historical data via PullPush integration
4. Reddit Ads API integration
5. Data export (JSON/CSV)
6. Batch operations for efficiency
7. Subreddit analytics dashboard data
8. Community settings management
9. Widget/sidebar management
10. Custom emoji management

### Architecture Recommendations
- **Use all three MCP primitives**: Tools + Resources + Prompts (only Dialog does this currently)
- **Adopt hexagonal architecture** (a la eliasbiondo) for clean separation of concerns
- **Implement 3-tier auth** (anonymous → app → user) with graceful degradation
- **Build in safety from day one** (a la jordanburke) — configurable safe mode, rate limiting, bot disclosure
- **LLM-optimized output** — structured, token-efficient responses designed for AI consumption

---

## Sources

### Primary Repositories Analyzed (12)
1. [karanb192/reddit-mcp-buddy](https://github.com/karanb192/reddit-mcp-buddy) — TypeScript, 570+ stars (accessed 2026-03-27)
2. [adhikasp/mcp-reddit](https://github.com/adhikasp/mcp-reddit) — Python, 377 stars (accessed 2026-03-27)
3. [Arindam200/reddit-mcp](https://github.com/Arindam200/reddit-mcp) — Python, 272 stars (accessed 2026-03-27)
4. [Hawstein/mcp-server-reddit](https://github.com/Hawstein/mcp-server-reddit) — Python, 152 stars (accessed 2026-03-27)
5. [eliasbiondo/reddit-mcp-server](https://github.com/eliasbiondo/reddit-mcp-server) — Python, 123 stars (accessed 2026-03-27)
6. [king-of-the-grackles/reddit-research-mcp](https://github.com/king-of-the-grackles/reddit-research-mcp) — Python, 94 stars (accessed 2026-03-27)
7. [jordanburke/reddit-mcp-server](https://github.com/jordanburke/reddit-mcp-server) — TypeScript, 28 stars (accessed 2026-03-27)
8. [GeLi2001/reddit-mcp](https://github.com/GeLi2001/reddit-mcp) — Python, 3 stars (accessed 2026-03-27)
9. [netixc/reddit-mcp-server](https://github.com/netixc/reddit-mcp-server) — Python, 2 stars (accessed 2026-03-27)
10. [jacklenzotti/pullpush-mcp](https://github.com/jacklenzotti/pullpush-mcp) — TypeScript, 2 stars (accessed 2026-03-27)
11. [sbmeaper/reddit-ad-mcp](https://github.com/sbmeaper/reddit-ad-mcp) — Python, 0 stars (accessed 2026-03-27)
12. [mkerchenski/RedditAdsMcp](https://github.com/mkerchenski/RedditAdsMcp) — C#, 1 star (accessed 2026-03-27)

### GitHub Issues Analyzed (5 repos)
13. [reddit-mcp-buddy issues](https://github.com/karanb192/reddit-mcp-buddy/issues) — 2 open (API policy) (accessed 2026-03-27)
14. [mcp-reddit issues](https://github.com/adhikasp/mcp-reddit/issues) — 3 open (security, feeds, stability) (accessed 2026-03-27)
15. [reddit-mcp issues](https://github.com/Arindam200/reddit-mcp/issues) — 2 open (comments, auth) (accessed 2026-03-27)
16. [mcp-server-reddit issues](https://github.com/Hawstein/mcp-server-reddit/issues) — 3 open (KeyError, Docker, Smithery) (accessed 2026-03-27)
17. [jordanburke issues](https://github.com/jordanburke/reddit-mcp-server/issues) — 0 open (clean!) (accessed 2026-03-27)

### Package Registries (5)
18. [reddit-mcp-server on npm](https://www.npmjs.com/package/reddit-mcp-server) — v1.2.1 (accessed 2026-03-27)
19. [systemprompt-mcp-reddit on npm](https://www.npmjs.com/package/systemprompt-mcp-reddit) (accessed 2026-03-27)
20. [reddit-mcp-server on PyPI](https://pypi.org/project/reddit-mcp-server/) — v1.2.0 (accessed 2026-03-27)
21. [mcp-server-reddit on PyPI](https://pypi.org/project/mcp-server-reddit/) (accessed 2026-03-27)
22. [reddit-mcp-tool on PyPI](https://pypi.org/project/reddit-mcp-tool/) (accessed 2026-03-27)

### Directories & Listings (5)
23. [PulseMCP Reddit servers](https://www.pulsemcp.com/servers?q=reddit) — 39 Reddit-related servers listed (accessed 2026-03-27)
24. [Glama MCP Registry](https://glama.ai/mcp/servers) (accessed 2026-03-27)
25. [Awesome MCP Servers (wong2)](https://github.com/wong2/awesome-mcp-servers) (accessed 2026-03-27)
26. [MCP Servers Directory](https://mcpservers.org/) (accessed 2026-03-27)
27. [Apify Reddit MCP Server](https://apify.com/mcp/reddit-mcp-server) (accessed 2026-03-27)

### Community & Analysis
28. [Awesome MCP Servers directory](https://mcp-awesome.com/) — 1200+ servers cataloged (accessed 2026-03-27)
29. [Apify MCP platform](https://mcp.apify.com/) — Multiple Reddit actors (accessed 2026-03-27)
