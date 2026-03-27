# Reddit API Libraries, SDKs, and Wrappers — Comprehensive Research

> **Date:** 2026-03-27
> **Researcher:** researcher-2
> **Task:** #2 — Survey all major Reddit API libraries across languages
> **Status:** Complete

---

## Executive Summary

This document provides a comprehensive survey of Reddit API libraries and SDK wrappers across all major programming languages, with specific focus on their suitability for building an MCP (Model Context Protocol) server. After evaluating 20+ libraries across 12 languages, **the recommendation is to build the MCP server in TypeScript or Python**, with the following top candidates:

1. **TypeScript (Direct HTTP)** — Best for MCP: TypeScript has first-class MCP SDK support, and since snoowrap is archived, a thin direct-HTTP approach gives maximum control.
2. **Python (PRAW / AsyncPRAW)** — Best library ecosystem: PRAW is the most mature, actively maintained, and feature-complete Reddit wrapper available in any language. Python also has official MCP SDK support via FastMCP.
3. **Go (go-reddit)** — Viable alternative if the team prefers Go, though the MCP SDK ecosystem is less mature.

---

## Table of Contents

1. [Library Comparison Matrix](#1-library-comparison-matrix)
2. [Download Statistics](#2-download-statistics)
3. [Python Libraries](#3-python-libraries)
4. [JavaScript / TypeScript Libraries](#4-javascript--typescript-libraries)
5. [Java / Kotlin Libraries](#5-java--kotlin-libraries)
6. [Go Libraries](#6-go-libraries)
7. [Rust Libraries](#7-rust-libraries)
8. [C# / .NET Libraries](#8-c--net-libraries)
9. [Ruby Libraries](#9-ruby-libraries)
10. [Other Languages](#10-other-languages)
11. [Pushshift-Based Libraries (Historical Data)](#11-pushshift-based-libraries-historical-data)
12. [Error Handling Patterns by Library](#12-error-handling-patterns-by-library)
13. [Reddit's Official Developer Platform (Devvit)](#13-reddits-official-developer-platform-devvit)
14. [Reddit API Access & Rate Limits (Post-2023)](#14-reddit-api-access--rate-limits-post-2023)
15. [MCP Server Language Recommendation](#15-mcp-server-language-recommendation)
16. [Sources](#16-sources)

---

## 1. Library Comparison Matrix

| Library | Language | Latest Version | Last Active | Stars | OAuth2 | Streaming | Rate Limiting | Async | API Coverage | Maintained? |
|---------|----------|---------------|-------------|-------|--------|-----------|---------------|-------|-------------|-------------|
| **PRAW** | Python | v7.8.1 (Oct 2024) | Active | 4,100 | Yes | Yes | Auto | No (sync) | ~95% | **Yes** |
| **AsyncPRAW** | Python | v7.8.1 (Dec 2024) | Active | 144 | Yes | Yes | Auto | **Yes** | ~95% | **Yes** |
| **RedditWarp** | Python | Latest on PyPI | Jun 2024 | 55 | Yes | Yes | Auto | **Yes** | Comprehensive | Partial |
| **PMAW** | Python | v3.0.0 | Maintained | 78 commits | N/A (Pushshift) | No | Auto (60 RPM) | No | Pushshift only | **Dead (Pushshift shut down)** |
| **snoowrap** | JavaScript | v1.23.0 (May 2021) | **Archived Mar 2024** | 1,000+ | Yes | WebSocket | Auto | Yes (Promises) | ~90% | **No** |
| **raw.js** | JavaScript | v0.6.0 (9 yrs ago) | **Dead** | Minimal | Yes | No | Unknown | No | Beta/partial | **No** |
| **TRAW** | TypeScript | WIP (Mar 2023) | Stalled | 4 | Yes | Unknown | Unknown | Unknown | Partial | **No** |
| **Snoostorm** | TypeScript | Unreleased | Early 2023 | 93 | Via snoowrap | **Yes (events)** | Via snoowrap | Yes | Streaming only | **No** |
| **JRAW** | Kotlin/Java | v1.1.0 (May 2018) | Inactive | 360 | Yes | No | Unknown | No | ~49% | **No** |
| **jReddit** | Java | Legacy | Inactive | — | No (cookies) | No | No | No | Limited | **No** |
| **go-reddit** | Go | v2.0.0 (Feb 2021) | Moderate | 332 | Yes | No | No built-in | No | Moderate | **Partial** |
| **graw** | Go | Legacy | Inactive | — | Yes | Yes | Unknown | No | Limited | **No** |
| **roux** | Rust | On crates.io | Maintained | 112 | Yes | Via roux-stream | Unknown | **Yes** | Common endpoints | **Partial** |
| **Reddit.NET** | C# | Dec 2022 | Inactive | 506 | Yes | Events | Auto (60/min) | Yes | 171/204 endpoints | **No** |
| **RedditSharp** | C# | Legacy | **Unmaintained** | — | Yes | No | Yes | No | Partial | **No** |
| **Redd** | Ruby | v0.7.5 (Feb 2015) | Inactive (2019) | 191 | Yes | Yes | Auto | No | Most endpoints | **No** |
| **reddift** | Swift | Legacy | Unknown | — | Yes | No | Unknown | No | Limited | **No** |

**Key takeaway:** Only **PRAW** and **AsyncPRAW** are actively and reliably maintained with comprehensive API coverage. Everything else is either archived, stalled, or in maintenance-only mode.

---

## 2. Download Statistics

Real-world adoption as measured by package registry downloads (as of March 2026):

### Python (PyPI)

| Package | Daily | Weekly | Monthly | Trend |
|---------|-------|--------|---------|-------|
| **PRAW** | ~64,000 | ~353,000 | **~1,187,000** | Steady growth, Python 3.11/3.12 dominant |
| **AsyncPRAW** | ~3,600 | ~24,800 | **~115,500** | Growing, ~10% of PRAW volume |
| **RedditWarp** | — | — | Minimal | Niche adoption |
| **PMAW** | — | — | Declining | Pushshift shutdown impact |

**Sources:** [pypistats.org/packages/praw](https://pypistats.org/packages/praw), [pypistats.org/packages/asyncpraw](https://pypistats.org/packages/asyncpraw)

### JavaScript/TypeScript (npm)

| Package | Weekly | Monthly | Trend |
|---------|--------|---------|-------|
| **snoowrap** | ~15,800 | **~72,000** | Down 10% weekly despite being archived |
| **raw.js** | Negligible | Negligible | Dead |
| **Snoostorm** | — | Minimal | Niche |

**Source:** [npmcharts.com/compare/snoowrap](https://npmcharts.com/compare/snoowrap)

### Key Insight

PRAW dominates with **1.2M monthly downloads** — more than 16x the combined JS ecosystem. Even the archived snoowrap still sees ~72K monthly downloads, indicating the JS/TS Reddit developer community has no viable alternative and continues using archived software.

---

## 3. Python Libraries

### 3.1 PRAW (Python Reddit API Wrapper)

**The gold standard for Reddit API interaction.**

- **Repository:** [github.com/praw-dev/praw](https://github.com/praw-dev/praw)
- **Documentation:** [praw.readthedocs.io](https://praw.readthedocs.io/)
- **PyPI:** `pip install praw`
- **Version:** 7.8.1 (October 25, 2024)
- **Stars:** 4,100+ | **Used by:** 26,600+ projects | **Monthly downloads:** ~1.2M
- **License:** Simplified BSD (v4.0.0+)
- **Python:** 3.9+

#### Key Features
- **Automatic rate limiting** — no manual `sleep()` calls needed; internally follows all Reddit API rules
- **Full OAuth2** — supports script, web, and installed app types
- **Streaming** — `subreddit.stream.comments()` and `subreddit.stream.submissions()` for real-time monitoring
  - Yields oldest first, up to 100 historical items initially
  - `skip_existing=True` parameter to start fresh
  - Multi-subreddit support via `+` syntax (e.g., `"python+learnpython"`)
  - `r/all` streaming supported (may drop items under high volume)
- **Comprehensive coverage** — submissions, comments, moderation, wiki, flair, multireddits, live threads, user management
- **Lazy loading** — minimizes unnecessary API calls
- **Comment tree traversal** — `replace_more()` to expand collapsed comments
- **Read-only mode** — for unauthenticated public data access
- **`praw.ini` support** — credential management across environments

#### Auth Handling
```python
import praw
reddit = praw.Reddit(
    client_id="my_client_id",
    client_secret="my_client_secret",
    user_agent="my_bot/0.1",
    username="my_username",
    password="my_password"
)
```
Also supports `praw.ini` files and environment variables for credential management.

#### Error Handling
See [Section 12: Error Handling Patterns](#12-error-handling-patterns-by-library) for detailed breakdown.

#### Limitations
- **Synchronous only** — blocks during API calls
- Not ideal for async frameworks (Discord bots, web servers)
- For async environments, use AsyncPRAW instead

#### MCP Suitability: **HIGH**
PRAW's comprehensive API coverage and automatic rate limiting make it excellent for an MCP server backend. However, its synchronous nature means it may not handle concurrent MCP tool calls efficiently.

---

### 3.2 AsyncPRAW (Asynchronous Python Reddit API Wrapper)

**The async version of PRAW — identical API surface with `async`/`await`.**

- **Repository:** [github.com/praw-dev/asyncpraw](https://github.com/praw-dev/asyncpraw)
- **Documentation:** [asyncpraw.readthedocs.io](https://asyncpraw.readthedocs.io/)
- **PyPI:** `pip install asyncpraw`
- **Version:** 7.8.1 (December 21, 2024)
- **Stars:** 144 | **Commits:** 4,261 | **Monthly downloads:** ~115K
- **License:** Simplified BSD (v7.1.1+)
- **Python:** 3.9+
- **Dependencies:** aiohttp, aiofiles, aiosqlite, asyncprawcore

#### Key Differences from PRAW
- Full `async`/`await` support throughout
- Non-blocking API interactions enable concurrent operations
- Async streaming via `async for` loops
- Same API surface as PRAW — easy migration
- Uses `aiohttp` instead of `requests` for HTTP

#### Streaming Example
```python
import asyncpraw

async def stream_comments():
    reddit = asyncpraw.Reddit(...)
    subreddit = await reddit.subreddit("python")
    async for comment in subreddit.stream.comments(skip_existing=True):
        print(comment.body)
```

#### Error Handling
Same exception hierarchy as PRAW — `PRAWException`, `RedditAPIException`, `ClientException`, plus `asyncprawcore` exceptions. See [Section 12](#12-error-handling-patterns-by-library).

#### MCP Suitability: **HIGHEST**
AsyncPRAW is the top Python choice for MCP servers. Async support means the MCP server can handle multiple tool calls concurrently without blocking. The MCP Python SDK (FastMCP) is also async-native, making them a natural fit.

---

### 3.3 RedditWarp

**A type-complete alternative with formal data structures.**

- **Repository:** [github.com/Pyprohly/redditwarp](https://github.com/Pyprohly/redditwarp)
- **Documentation:** [redditwarp.readthedocs.io](https://redditwarp.readthedocs.io/)
- **Stars:** 55
- **Python:** 3.8+ (type annotations use 3.9+ features)
- **License:** MIT
- **Last significant activity:** June 2024

#### Key Features
- **Full type annotations** — "modern type-complete codebase" with static typing
- Both sync and async I/O models
- Automatic rate limit handling
- OAuth2 tooling and CLI utilities
- Event-based listing endpoint streaming framework
- Formal comment tree traversal structures
- Client-based architecture: `client.p.subreddit.fetch_by_name()`

#### MCP Suitability: **MODERATE**
Strong type safety is appealing for MCP tool definitions, but the smaller community (~55 stars) and less battle-tested status make it riskier than PRAW/AsyncPRAW.

---

## 4. JavaScript / TypeScript Libraries

### 4.1 snoowrap

**Formerly the best JS Reddit wrapper — now archived.**

- **Repository:** [github.com/not-an-aardvark/snoowrap](https://github.com/not-an-aardvark/snoowrap) (**ARCHIVED March 17, 2024**)
- **npm:** `npm install snoowrap` | **Weekly downloads:** ~15,800
- **Version:** 1.23.0 (May 15, 2021)
- **Stars:** 1,000+ | **Commits:** 732
- **License:** MIT
- **Node.js:** 4+ (Proxy support in Node 6+)

#### Key Features
- Non-blocking async calls returning Bluebird Promises
- Independent snoowrap objects for multi-account operations
- Automatic OAuth token refresh
- Built-in rate-limit protection with request queuing
- WebSocket support for live threads via EventEmitter
- Lazy-loading via ES6 Proxies
- Method chaining
- Default retry on 502/503/504/522 (up to 3 attempts for GET/DELETE/PUT)

#### Why It's Archived
The original maintainer (`not-an-aardvark`) archived the repository in March 2024. No new maintenance, bug fixes, or feature additions should be expected.

#### TypeScript Support
Minimal — only 1.1% of the codebase is TypeScript. Community-maintained type definitions exist on DefinitelyTyped (`@types/snoowrap`).

#### Error Handling
See [Section 12](#12-error-handling-patterns-by-library) for detailed patterns.

#### Active Forks
- [please-wait/snoowrap](https://github.com/please-wait/snoowrap) — Node.js-focused fork
- [alex-kelso/snoowrap](https://github.com/alex-kelso/snoowrap) — community fork
- [AleDema/snoowrap](https://github.com/AleDema/snoowrap) — community fork

None of the forks have gained significant traction (all < 50 stars).

#### MCP Suitability: **LOW (archived)**
Despite being feature-rich, the archived status is a dealbreaker for a new MCP server project. Security vulnerabilities will never be patched.

---

### 4.2 raw.js

**Legacy Node.js Reddit API wrapper — dead project.**

- **Repository:** [github.com/DoctorMcKay/raw.js](https://github.com/DoctorMcKay/raw.js)
- **npm:** `npm install raw.js`
- **Version:** 0.6.0 (**last published ~9 years ago**)
- **Status:** Beta, some features missing
- **License:** MIT

#### Features
- OAuth2 support (web app, installed app, script types)
- Unauthenticated request support
- Listed as "stable" on Reddit API wrappers wiki

#### MCP Suitability: **NONE**
Dead project. Last update nearly a decade ago. Only 3 dependents on npm.

---

### 4.3 TRAW (TypeScript Reddit API Wrapper)

**A TypeScript successor to snoowrap — but incomplete.**

- **Repository:** [github.com/jamesrswift/traw](https://github.com/jamesrswift/traw)
- **Stars:** 4
- **Last Commit:** March 2023
- **License:** MIT
- **Language:** 100% TypeScript

#### Key Differences from snoowrap
- Full TypeScript implementation
- Addresses snoowrap's security concerns from outdated dependencies
- Uses Axios instead of `request` (deprecated npm package)
- Modernized function signatures

#### Status
Incomplete roadmap: still reimplementing snoowrap features, establishing tests, adding mod notes. Only mod notes feature marked complete. Development stalled since March 2023.

#### MCP Suitability: **VERY LOW**
Too immature (4 stars, stalled development) for production use.

---

### 4.4 Snoostorm (Event-Based Streaming)

**An event-based wrapper around snoowrap for streaming.**

- **Repository:** [github.com/brenapp/Snoostorm](https://github.com/brenapp/Snoostorm)
- **Stars:** 93
- **Last Commit:** Early 2023
- **License:** MIT
- **Language:** 100% TypeScript

#### Key Features
- Event-based streaming for comments, submissions, inbox, modmail
- Built on top of snoowrap (dependency)
- Extensible polling architecture — can extend `Poll` class for custom objects
- TypeScript types preinstalled

#### MCP Suitability: **LOW**
Depends on the archived snoowrap. Useful concept for streaming but not viable as a standalone solution.

---

### 4.5 Other JS/TS Libraries (npm)

From the [npm Reddit API category](https://socket.dev/npm/category/apis/social-api/reddit-api):
- **reddit-client-api** ([github.com/jamiegood/reddit-client-api](https://github.com/jamiegood/reddit-client-api)) — Node.js/TypeScript client, minimal adoption
- **npm-reddit-ts** ([github.com/aelysiaa/npm-reddit-ts](https://github.com/aelysiaa/npm-reddit-ts)) — TypeScript Reddit API, minimal adoption
- **TypeScript-Reddit-API** ([github.com/pwdonald/TypeScript-Reddit-API](https://github.com/pwdonald/TypeScript-Reddit-API)) — Legacy TS module

None of these have significant adoption or community backing.

---

### 4.6 Direct HTTP Approach (TypeScript) — RECOMMENDED

Since snoowrap is archived and alternatives are immature, building an MCP server in TypeScript should use **direct HTTP calls to the Reddit API** using `fetch` or `axios`. This approach offers:

- Full control over API interactions
- Native TypeScript types for all Reddit API responses
- No dependency on unmaintained libraries
- Perfect integration with the official MCP TypeScript SDK (`@modelcontextprotocol/sdk`)
- Only wrap the specific endpoints the MCP tools expose (not the entire Reddit API)

**Why this works for MCP:**
1. MCP tools are individually defined — you only need to wrap specific endpoints
2. The TypeScript MCP SDK is the most mature and widely used
3. Reddit's REST API is well-documented and returns JSON
4. OAuth2 token management is straightforward with `fetch`
5. Rate limiting can be implemented with a simple token bucket

---

## 5. Java / Kotlin Libraries

### 5.1 JRAW (Java Reddit API Wrapper)

- **Repository:** [github.com/mattbdean/JRAW](https://github.com/mattbdean/JRAW)
- **Documentation:** [mattbdean.gitbooks.io/jraw](https://mattbdean.gitbooks.io/jraw)
- **Version:** 1.1.0 (May 2018) — **over 7 years old**
- **Stars:** 360 | **Commits:** 1,221
- **Language:** Kotlin 73.9%, Java 23.8%, Groovy 2.3%
- **License:** MIT

#### Features
- OAuth2 authentication via `OAuthHelper.automatic()`
- Full multireddit and captcha support
- Mini HTTP framework wrapping OkHttp
- Android extension library available
- ~49% API coverage (per project badges)
- Spek test framework with Expekt assertions
- RedditClient as the primary internet-accessing class

#### MCP Suitability: **VERY LOW**
Last release was 2018. No active maintenance. Java/Kotlin MCP SDK support is limited compared to TypeScript/Python.

### 5.2 jReddit

- **Repository:** [github.com/jReddit/jReddit](https://github.com/jReddit/jReddit)
- **Status:** Legacy, cookie-based auth (no OAuth2)
- **MCP Suitability:** None — uses deprecated cookie authentication (pre-August 2015)

---

## 6. Go Libraries

### 6.1 go-reddit

- **Repository:** [github.com/vartanbeno/go-reddit](https://github.com/vartanbeno/go-reddit)
- **Go Packages:** [pkg.go.dev/github.com/vartanbeno/go-reddit](https://pkg.go.dev/github.com/vartanbeno/go-reddit)
- **Version:** v2.0.0 (February 2021)
- **Stars:** 332 | **Forks:** 86
- **License:** MIT
- **Design:** Inspired by Google's GitHub API client and DigitalOcean's API client

#### Features
- OAuth2 authentication (client credentials + password grant)
- Read-only mode via `NewReadonlyClient()` for unauthenticated access
- Context-based API calls (`context.Context`) for timeout/cancellation
- Custom HTTP client configuration
- Environment variable credential loading

#### API Coverage
- Comments, Posts, Subreddits, Users, Flairs, Collections
- **No built-in streaming** (must poll manually)
- **No built-in rate limiting** (must implement manually)

#### Active Forks
- [kmulvey/reddit](https://github.com/kmulvey/reddit) — actively maintained fork
- [loganintech/go-reddit/v2](https://pkg.go.dev/github.com/loganintech/go-reddit/v2) — published Jul 2024

#### MCP Suitability: **MODERATE**
Go is fast and concurrent (goroutines are natural for MCP), but the library needs manual rate limiting and has no streaming. The Go MCP SDK exists but is less mature than TypeScript/Python.

### 6.2 graw

- **Repository:** [github.com/turnage/graw](https://github.com/turnage/graw)
- **Status:** Inactive/legacy
- **Features:** Bot framework with streaming support
- **MCP Suitability:** Low — inactive project

---

## 7. Rust Libraries

### 7.1 roux

- **Repository:** [github.com/halcyonnouveau/roux](https://github.com/halcyonnouveau/roux)
- **Crate:** [crates.io/crates/roux](https://crates.io/crates/roux)
- **Stars:** 112 | **Forks:** 45
- **License:** MIT

#### Features
- Synchronous and asynchronous (tokio-based) operation modes
- `blocking` cargo feature for sync mode
- OAuth2 authentication for write operations (text/link post submission)
- Read-only subreddit and user access without auth

#### Companion: roux-stream
- [github.com/torfsen/roux-stream](https://github.com/torfsen/roux-stream) — streaming API for subreddit posts and comments

#### Status
"Not in active development but is still being maintained" — covers most common endpoints. Accepts bug reports and PRs.

#### MCP Suitability: **LOW**
Rust MCP SDK support is nascent. The library covers only common endpoints, and Rust's compile times slow development iteration.

---

## 8. C# / .NET Libraries

### 8.1 Reddit.NET

- **Repository:** [github.com/sirkris/Reddit.NET](https://github.com/sirkris/Reddit.NET)
- **Stars:** 506 | **Forks:** 76
- **Last Commit:** December 2022
- **License:** MIT
- **Target:** .NET Standard (cross-platform)

#### Features
- **171 of 204 API endpoints** covered (84%)
- 392 passing integration tests
- Event-based monitoring with automatic scaling (monitoring delay adjusts per concurrent threads)
- Full async support
- Rate limit handling: auto-retry for waits < 60 seconds, exception for longer waits
- Built-in 60-request-per-minute safety limit
- **AuthTokenRetriever** utility app for OAuth2 token acquisition
- **AuthTokenRetrieverLib** for programmatic token retrieval

#### MCP Suitability: **LOW-MODERATE**
Best API coverage of any non-Python library (84%), but inactive since 2022. C# MCP SDK support exists but is community-driven, not official.

### 8.2 RedditSharp

- **Original:** [github.com/ddevault/RedditSharp](https://github.com/ddevault/RedditSharp) — Marked **[Unmaintained]**
- **Forks:** Fragmented across [CrustyJew](https://github.com/CrustyJew/RedditSharp-DEPRECATED-), [chuggafan](https://github.com/chuggafan/RedditSharp-1), [calico-crusade](https://github.com/calico-crusade/RedditSharp), [corylulu](https://github.com/corylulu/RedditSharp-1)
- Features LINQ-style paging, rate limiting, RefreshTokenWebAgentPool
- **MCP Suitability:** None — unmaintained original, fragmented forks

---

## 9. Ruby Libraries

### 9.1 Redd

- **Repository:** [github.com/avinashbot/redd](https://github.com/avinashbot/redd)
- **RubyGems:** [rubygems.org/gems/redd](https://rubygems.org/gems/redd/versions/0.8.8)
- **Version:** 0.7.5 (February 2015) — gem version 0.8.8 may be newer
- **Last Commit:** March 2019
- **Stars:** 191 | **Forks:** 76

#### Features
- "Batteries-included" — supports most Reddit API endpoints
- Live threads and beta mod-mail
- Streaming for new posts and comments
- Automatic retrying of failed requests
- Rate limiting handling + refresh token management
- 5xx error protection
- Rack middleware for web application integration
- OAuth2 (allows 2x request rate vs. cookie auth: 1 req/sec)

#### MCP Suitability: **VERY LOW**
Last release was 2015, last commit 2019. Ruby MCP SDK support is minimal.

---

## 10. Other Languages

### 10.1 Dart
- **Library:** `reddit` | **Maintainer:** /u/sroose | **License:** MIT | **Status:** Stable (per wiki)
- No significant community or recent activity found.

### 10.2 Swift
- **Library:** `reddift` | **License:** MIT | **Status:** Stable (per wiki)
- iOS/macOS focused, not relevant for server-side MCP.

### 10.3 Perl
- **Reddit::Client** — GPL/Artistic license, stable per wiki
- **Mojo::Snoo** — BSD 2-Clause, unstable

### 10.4 PHP
- **Phapper for reddit** — Maintainer: /u/rotorcowboy, MIT license, stable per wiki
- **PHP Reddit API Wrapper** — Maintainer: /u/jcleblanc, MIT license, unstable

### 10.5 Common Lisp
- **cl-reddit** — BSD-2-Clause, non-OAuth (legacy/cookie-based)

### 10.6 PowerShell
- **PoSh Reddit** — WTFPL license, non-OAuth (legacy)

### 10.7 Objective-C
- **RedditKit** — Maintainer: /u/samsymons, MIT license (non-OAuth, legacy)

**MCP Suitability for all above:** None practical — no MCP SDK support and minimal community.

---

## 11. Pushshift-Based Libraries (Historical Data)

> **CRITICAL NOTE:** Pushshift's public API was **shut down by Reddit in 2024** after legal pressure (CFAA violation claims). Limited access was reinstated for verified Reddit moderators only for moderation use cases. These libraries are listed for historical context but **cannot be used for general MCP server development**.

### 11.1 PMAW (Pushshift Multithread API Wrapper)

- **Repository:** [github.com/mattpodolak/pmaw](https://github.com/mattpodolak/pmaw)
- **PyPI:** `pip install pmaw` | **Version:** 3.0.0
- **Python:** 3.5+

#### Features (when Pushshift was active)
- **Multithreading** — default 10 workers, recommended 10-20 threads
- **Rate limiting** — rate-averaging (default 60 RPM) or exponential backoff (full, equal, decorrelated jitter)
- **Caching** — `mem_safe=True` caches every ~20 batches to reduce RAM
- **Safe exit** — preserves interrupted requests/responses
- **PRAW enrichment** — pass a PRAW instance to enrich Pushshift results with live Reddit metadata

#### Current Status: **EFFECTIVELY DEAD**
Pushshift public API is shut down. PMAW cannot function without it.

### 11.2 PSAW (Python Pushshift.io API Wrapper)

- **Repository:** [github.com/dmarx/psaw](https://github.com/dmarx/psaw)
- **Status:** Stale — PMAW recommended as replacement
- Handles rate limiting and exponential backoff (min 1 req/sec)
- Handles paging for `created_utc` sort
- Optional PRAW integration for fetching objects after getting IDs

### 11.3 pushshift.py

- **PyPI:** [pypi.org/project/pushshift.py](https://pypi.org/project/pushshift.py/)
- **Repository:** [github.com/shivros/pushshift.py](https://github.com/shivros/pushshift.py)
- **Version:** 0.1.2
- Minimalist wrapper for searching public Reddit content
- No issues found in security scan (as of June 2025)
- **Status:** Functional code but useless without Pushshift API

### 11.4 Pushshift Successor: Arctic Shift
- Academic project hosting Reddit data dumps via Academic Torrents
- Publishes monthly archives of Reddit data (posts, comments, metadata)
- For bulk historical analysis only, not real-time API access

**MCP Relevance:** None for real-time MCP tools. Could theoretically be used for a historical data tool, but requires downloading multi-GB torrents.

---

## 12. Error Handling Patterns by Library

### 12.1 PRAW / AsyncPRAW Error Handling

**Exception Hierarchy:**
```
PRAWException (base)
├── RedditAPIException  — server-side errors from Reddit's API
│   └── Contains list of RedditErrorItem(error_type, message, field)
└── ClientException     — client-side errors
    ├── DuplicateReplaceException  — duplicate MoreComments replacement
    ├── InvalidFlairTemplateID     — bad flair template ID
    ├── TooLargeMediaException     — media upload too large
    ├── WebSocketException         — WebSocket errors
    └── MissingRequiredAttributeException
```

**Important:** PRAW does NOT wrap all `prawcore` exceptions. HTTP-level errors (403 Forbidden, 503 Service Unavailable) may require catching `prawcore` exceptions directly:
```python
import prawcore

try:
    submission.reply("Hello")
except praw.exceptions.RedditAPIException as e:
    for item in e.items:
        print(f"Reddit error: {item.error_type} - {item.message}")
except prawcore.exceptions.Forbidden:
    print("403 - Not authorized")
except prawcore.exceptions.ServerError:
    print("5xx - Reddit server error")
```

**Source:** [PRAW Exceptions Documentation](https://praw.readthedocs.io/en/stable/code_overview/exceptions.html)

### 12.2 snoowrap Error Handling

**Rate Limit Handling:**
```javascript
const r = new snoowrap({...});
r.config({ continueAfterRatelimitError: true }); // Queue requests during rate limit
```

**HTTP Error Catching:**
```javascript
r.getSubmission('abc123').fetch()
  .catch({statusCode: 429}, () => {
    // Handle rate limit specifically
  })
  .catch(err => {
    // General error handler
  });
```

**Automatic Retries:** Retries GET, DELETE, PUT up to 3 times on status codes 502, 503, 504, 522.

**Known Issues:**
- Unhandled Promise rejections from implicit lazy-loading calls ([issue #153](https://github.com/not-an-aardvark/snoowrap/issues/153))
- `continueAfterRatelimitError: true` may still throw if Promises aren't properly chained ([issue #105](https://github.com/not-an-aardvark/snoowrap/issues/105))

### 12.3 go-reddit Error Handling

Uses Go's idiomatic `error` return pattern with `context.Context` for cancellation:
```go
client, err := reddit.NewClient(credentials)
if err != nil {
    log.Fatal(err)
}

posts, resp, err := client.Subreddit.TopPosts(ctx, "golang", &reddit.ListPostOptions{...})
if err != nil {
    // Handle API error - check resp.StatusCode for HTTP-level issues
}
```

**No built-in retry logic** — must implement manually.

### 12.4 Reddit.NET Error Handling

- Auto-retry on rate limits under 60 seconds
- Exceptions thrown for rate limits exceeding 60 seconds
- Built-in safety limit of 60 requests per minute prevents API violations
- Event-based monitoring handles errors via event callbacks

### 12.5 roux (Rust) Error Handling

Uses Rust's `Result<T, RouxError>` pattern:
```rust
match subreddit.hot(25, None).await {
    Ok(submissions) => { /* process */ },
    Err(e) => { /* handle RouxError */ }
}
```

### 12.6 Error Handling Comparison

| Library | Rate Limit Recovery | HTTP Retry | Error Types | Granularity |
|---------|-------------------|------------|-------------|-------------|
| **PRAW** | Auto (transparent) | Via prawcore | Typed hierarchy | High — per-error-type |
| **AsyncPRAW** | Auto (transparent) | Via asyncprawcore | Typed hierarchy | High — per-error-type |
| **snoowrap** | Configurable (queue/reject) | Auto 3x on 5xx | Promise rejection | Medium |
| **go-reddit** | None (manual) | None (manual) | Go error interface | Low |
| **Reddit.NET** | Auto < 60s | Auto < 60s | .NET exceptions | Medium |
| **roux** | Unknown | Unknown | Rust Result type | Medium |

---

## 13. Reddit's Official Developer Platform (Devvit)

### What is Devvit?

Devvit is Reddit's **official open-source developer platform** for building custom Reddit applications (interactive games, utilities, moderation tools).

- **Repository:** [github.com/reddit/devvit](https://github.com/reddit/devvit)
- **Stars:** 186 | **License:** BSD-3-Clause
- **Language:** TypeScript (99.6%)
- **Node.js:** v22.2.0+ with Yarn
- **Build system:** Turborepo monorepo

### Key Components
- UI toolkit (Blocks and Web modes — React/Vue/Angular for Web)
- Redis data storage
- Scheduler, realtime support
- Community-specific settings
- App hosting by Reddit
- Helper library: `@devvit/web` (single dependency for media, realtime, Reddit API client, Redis, scheduler, settings)

### Developer Funds Program (2026)
- Runs April 1, 2025 to June 30, 2026
- Payments for qualifying Devvit apps meeting Daily Qualified Engager / Qualified Installs thresholds
- Up to 3 apps per developer

**Source:** [Reddit Developer Funds 2026 Terms](https://support.reddithelp.com/hc/en-us/articles/27958169342996-Reddit-Developer-Funds-2026-Terms)

### Devvit MCP Server
Reddit has published an **official MCP server for Devvit app development**:
- **Repository:** [github.com/reddit/devvit-mcp](https://github.com/reddit/devvit-mcp)
- **npm:** `@devvit/mcp`
- **Config:** `{"mcpServers": {"devvit-mcp": {"command": "npx", "args": ["-y", "@devvit/mcp"]}}}`
- **Status:** Experimental — all APIs may change

**Important distinction:** Devvit is for building Reddit-hosted apps, NOT for general Reddit API access. The Devvit MCP server helps write Devvit apps, not interact with Reddit's data API. This is **not** what we're building.

---

## 14. Reddit API Access & Rate Limits (Post-2023)

### The 2023 API Pricing Changes

On April 18, 2023, Reddit announced paid API access, effective June 19, 2023. This caused massive disruption:
- Third-party apps like Apollo, Reddit is Fun, and Sync shut down
- Estimated $20M/year cost for apps like Apollo
- 8,000+ subreddits went dark in protest
- Many library maintainers reduced or stopped maintenance
- Pushshift was shut down under CFAA legal pressure

**Source:** [Reddit API Controversy — Wikipedia](https://en.wikipedia.org/wiki/Reddit_API_controversy)

### Current Pricing Tiers (2024-2026)

| Tier | Rate Limit | Cost | Requirements |
|------|-----------|------|-------------|
| **Free (OAuth)** | 100 QPM per OAuth client ID | Free | Non-commercial use, personal projects, academic research |
| **Free (Unauthenticated)** | 10 QPM (mostly rejected) | Free | Very limited, not viable |
| **Paid (Commercial)** | Negotiated | $0.24 per 1K API calls | Prior approval from Reddit required |

**Sources:** [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki), [Reddit API Limits — Data365](https://data365.co/blog/reddit-api-limits)

### Key Changes (Late 2024 - 2025)
- **Self-service access removed** — must submit a request and wait for Reddit approval
- Free usage quotas significantly reduced
- Stricter limitations on API call frequency
- Rate limits averaged over a **10-minute window** (allows bursts)
- OAuth authentication **required** for any meaningful access

**Source:** [Reddit's 2025 API Crackdown](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown)

### Impact on Libraries
- **PRAW and AsyncPRAW** — continue to work fully with updated API; handle rate limits automatically
- **snoowrap** — still works technically but archived; no patches for API changes
- **Pushshift libraries (PMAW, PSAW)** — broken, Pushshift API shut down
- All libraries must respect the 100 QPM OAuth limit
- Libraries **without** built-in rate limiting (go-reddit, raw.js) are riskier to use

---

## 15. MCP Server Language Recommendation

### Decision Matrix

| Factor | TypeScript | Python | Go |
|--------|-----------|--------|-----|
| **MCP SDK Maturity** | **Best** (official SDK, most examples, most MCP servers) | Strong (FastMCP, official SDK) | Emerging |
| **Reddit Library Quality** | Poor (snoowrap archived, no viable alternative) | **Excellent** (PRAW/AsyncPRAW, 1.2M monthly downloads) | Moderate (go-reddit, no rate limiting) |
| **Async Support** | Native (Promises, async/await) | AsyncPRAW + asyncio | Native (goroutines) |
| **Type Safety** | **Excellent** (native TS types) | Good (type hints, mypy) | **Excellent** (static types) |
| **Community Examples** | Most MCP servers are TypeScript | Many MCP servers exist | Few MCP server examples |
| **Development Speed** | Fast | Fast | Moderate |
| **Direct API Viability** | **Excellent** (fetch/axios + TS interfaces) | Good (httpx/aiohttp) | Good (net/http) |
| **Error Handling for MCP** | Try/catch with typed errors | Exception hierarchy (PRAWException) | Idiomatic error returns |
| **Download Stats Confidence** | snoowrap: 72K/mo (declining, archived) | PRAW: 1.2M/mo (growing) | go-reddit: N/A |

### Recommendation: Two Viable Paths

#### Path A: TypeScript with Direct HTTP (Recommended)
- Use the official MCP TypeScript SDK (`@modelcontextprotocol/sdk`)
- Call Reddit's REST API directly with `fetch`
- Build type-safe Reddit API interfaces for each MCP tool
- Implement a thin OAuth2 + rate-limiting layer (~200 lines)
- **Pros:** Best MCP tooling, no dependency on unmaintained Reddit libs, full TypeScript types, most MCP examples/community
- **Cons:** Must implement Reddit API abstraction layer (but only for endpoints the MCP tools need)
- **Risk:** Low — Reddit's REST API is stable, well-documented JSON

#### Path B: Python with AsyncPRAW
- Use the MCP Python SDK (FastMCP)
- Wrap AsyncPRAW for Reddit API access
- **Pros:** Most mature Reddit library (1.2M downloads/mo), comprehensive API coverage (~95%), streaming built-in, automatic rate limiting, battle-tested error handling
- **Cons:** Slightly less mature MCP SDK than TypeScript, Python typing less strict, dependency on asyncprawcore for some error types

#### Not Recommended
- **Go:** go-reddit lacks streaming, rate limiting, and error granularity; MCP SDK is early-stage
- **Java/Kotlin:** JRAW is dead (last release 2018); no practical MCP SDK
- **Rust:** roux is maintenance-only; MCP SDK is nascent; slow dev iteration
- **C#:** Reddit.NET inactive since 2022; MCP SDK is community-only
- **JS (snoowrap):** Archived since March 2024; security vulnerabilities will never be patched; use TypeScript direct HTTP instead

---

## 16. Sources

### Primary Sources (Official Documentation)
1. **[PRAW Documentation](https://praw.readthedocs.io/)** — Accessed: 2026-03-27 — Type: Official Docs — Reliability: 5/5
2. **[AsyncPRAW Documentation](https://asyncpraw.readthedocs.io/)** — Accessed: 2026-03-27 — Type: Official Docs — Reliability: 5/5
3. **[PRAW Exceptions Documentation](https://praw.readthedocs.io/en/stable/code_overview/exceptions.html)** — Accessed: 2026-03-27 — Type: Official Docs — Reliability: 5/5
4. **[SubredditStream PRAW Docs](https://praw.readthedocs.io/en/stable/code_overview/other/subredditstream.html)** — Accessed: 2026-03-27 — Type: Official Docs — Reliability: 5/5
5. **[Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)** — Accessed: 2026-03-27 — Type: Official Reddit — Reliability: 5/5
6. **[Reddit API Wrappers Wiki](https://github.com/reddit-archive/reddit/wiki/api-wrappers)** — Accessed: 2026-03-27 — Type: Archived Wiki — Reliability: 4/5

### GitHub Repositories
7. **[PRAW GitHub](https://github.com/praw-dev/praw)** — v7.8.1, 4.1k stars, active — Reliability: 5/5
8. **[AsyncPRAW GitHub](https://github.com/praw-dev/asyncpraw)** — v7.8.1, 144 stars, active — Reliability: 5/5
9. **[snoowrap GitHub](https://github.com/not-an-aardvark/snoowrap)** — Archived Mar 2024, 1k+ stars — Reliability: 4/5
10. **[JRAW GitHub](https://github.com/mattbdean/JRAW)** — v1.1.0, last release May 2018 — Reliability: 3/5
11. **[go-reddit GitHub](https://github.com/vartanbeno/go-reddit)** — v2.0.0, 332 stars — Reliability: 4/5
12. **[roux GitHub](https://github.com/halcyonnouveau/roux)** — 112 stars, maintained — Reliability: 4/5
13. **[Reddit.NET GitHub](https://github.com/sirkris/Reddit.NET)** — 506 stars, last commit Dec 2022 — Reliability: 3/5
14. **[Redd GitHub](https://github.com/avinashbot/redd)** — 191 stars, last commit Mar 2019 — Reliability: 2/5
15. **[RedditWarp GitHub](https://github.com/Pyprohly/redditwarp)** — 55 stars, type-complete — Reliability: 3/5
16. **[TRAW GitHub](https://github.com/jamesrswift/traw)** — 4 stars, stalled — Reliability: 2/5
17. **[Snoostorm GitHub](https://github.com/brenapp/Snoostorm)** — 93 stars, early 2023 — Reliability: 3/5
18. **[PMAW GitHub](https://github.com/mattpodolak/pmaw)** — v3.0.0, Pushshift wrapper — Reliability: 3/5
19. **[PSAW GitHub](https://github.com/dmarx/psaw)** — Pushshift wrapper, stale — Reliability: 2/5
20. **[raw.js GitHub](https://github.com/DoctorMcKay/raw.js)** — v0.6.0, ~9 years old — Reliability: 1/5
21. **[RedditSharp GitHub](https://github.com/ddevault/RedditSharp)** — Marked [Unmaintained] — Reliability: 2/5
22. **[Devvit GitHub](https://github.com/reddit/devvit)** — Official Reddit platform, 186 stars — Reliability: 5/5
23. **[Devvit MCP GitHub](https://github.com/reddit/devvit-mcp)** — Official Reddit MCP server — Reliability: 5/5
24. **[roux-stream GitHub](https://github.com/torfsen/roux-stream)** — Streaming for roux — Reliability: 3/5

### Download Statistics
25. **[PyPI Stats: PRAW](https://pypistats.org/packages/praw)** — Accessed: 2026-03-27 — ~1.2M monthly — Reliability: 5/5
26. **[PyPI Stats: AsyncPRAW](https://pypistats.org/packages/asyncpraw)** — Accessed: 2026-03-27 — ~115K monthly — Reliability: 5/5
27. **[npm Charts: snoowrap](https://npmcharts.com/compare/snoowrap)** — Accessed: 2026-03-27 — ~72K monthly — Reliability: 5/5

### Secondary Sources (Articles & Analysis)
28. **[MCP SDK Comparison: Python vs TypeScript vs Go](https://www.stainless.com/mcp/mcp-sdk-comparison-python-vs-typescript-vs-go-implementations)** — Accessed: 2026-03-27 — Reliability: 4/5
29. **[Building MCP Servers: TypeScript or Python?](https://medium.com/@balazskocsis/building-model-context-protocol-servers-typescript-or-python-a1a235f789d7)** — Accessed: 2026-03-27 — Reliability: 3/5
30. **[Reddit API Pricing Guide](https://data365.co/blog/reddit-api-pricing)** — Accessed: 2026-03-27 — Reliability: 3/5
31. **[Reddit API Changes — Nordic APIs](https://nordicapis.com/everything-you-need-to-know-about-the-reddit-api-changes/)** — Accessed: 2026-03-27 — Reliability: 4/5
32. **[Reddit's 2025 API Crackdown](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown)** — Accessed: 2026-03-27 — Reliability: 3/5
33. **[Reddit API Limits — Data365](https://data365.co/blog/reddit-api-limits)** — Accessed: 2026-03-27 — Reliability: 3/5
34. **[Pushshift Reddit Dataset Overview](https://www.emergentmind.com/topics/pushshift-reddit-dataset)** — Accessed: 2026-03-27 — Reliability: 3/5

### Community Sources
35. **[Reddit Developer Funds 2026 Terms](https://support.reddithelp.com/hc/en-us/articles/27958169342996-Reddit-Developer-Funds-2026-Terms)** — Accessed: 2026-03-27 — Reliability: 5/5
36. **[Reddit API Controversy — Wikipedia](https://en.wikipedia.org/wiki/Reddit_API_controversy)** — Accessed: 2026-03-27 — Reliability: 4/5
37. **[How to Get Reddit API Credentials in 2025](https://www.wappkit.com/blog/reddit-api-credentials-guide-2025)** — Accessed: 2026-03-27 — Reliability: 3/5
38. **[Pushshift Access Request — Reddit Help](https://support.reddithelp.com/hc/en-us/articles/16470271632404-Pushshift-Access-Request)** — Accessed: 2026-03-27 — Reliability: 5/5
39. **[snoowrap Rate Limit Issue #105](https://github.com/not-an-aardvark/snoowrap/issues/105)** — Accessed: 2026-03-27 — Reliability: 4/5
40. **[snoowrap Unhandled Rejection Issue #153](https://github.com/not-an-aardvark/snoowrap/issues/153)** — Accessed: 2026-03-27 — Reliability: 4/5
