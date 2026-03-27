# E03: Authentication System

## Status: Not Started

## Goal
Implement the 3-tier progressive auth system (anonymous, app-only, full OAuth) with in-memory token management and 50-minute auto-refresh.

## Dependencies
- E02 (Core Infrastructure) — must be Done

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 3
- research/01-reddit-official-api.md (OAuth section)
- research/06-oauth-and-mcp-architecture.md
- research/09-typescript-mcp-sdk-deep-dive.md

## Tasks

### E03-T01: Configuration and environment loading
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02-T01
- **Description**: Build `src/reddit/config.ts`: load `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT` from env vars. Determine auth tier based on which vars are present.
- **Acceptance Criteria**:
  1. Missing all vars = Tier 1 (anonymous)
  2. CLIENT_ID + CLIENT_SECRET only = Tier 2 (app-only)
  3. All 4 credential vars = Tier 3 (full OAuth)
  4. Throws if CLIENT_SECRET present without CLIENT_ID
  5. USER_AGENT has fallback default
- **Out of Scope**: Encrypted credential storage
- **Notes**: Never persist tokens to disk (Trail of Bits finding)

### E03-T02: Auth manager core with token lifecycle
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03-T01
- **Description**: Build `src/reddit/auth.ts`: `RedditAuthManager` class with `getAccessToken()`. Cached tokens. Refresh at 50 min (not 60). In-memory only.
- **Acceptance Criteria**:
  1. `getAccessToken()` returns cached token when not expired
  2. Auto-refreshes at 50-minute mark
  3. Tokens never written to disk
  4. Refresh failures throw clear error with retry guidance
  5. Unit test with mocked time verifies refresh timing
- **Out of Scope**: Specific grant type implementations (T03-T05)
- **Notes**: Refresh tokens are permanent for script apps (never expire)

### E03-T03: Tier 1 anonymous auth
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03-T02
- **Description**: Implement anonymous path: installed client credentials grant (no secret needed, read-only, ~10 RPM). Fallback to unauthenticated `.json` suffix if that fails.
- **Acceptance Criteria**:
  1. Works with zero env vars configured
  2. Can fetch public subreddit data
  3. Correctly identifies as read-only tier
  4. Graceful degradation to `.json` suffix fallback
- **Out of Scope**: Write operations at this tier
- **Notes**: Base URL changes to `https://www.reddit.com` with `.json` suffix for fallback

### E03-T04: Tier 2 app-only auth (client credentials)
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E03-T02
- **Description**: Implement `client_credentials` grant for script apps (CLIENT_ID + CLIENT_SECRET). 100 QPM, read-only.
- **Acceptance Criteria**:
  1. Authenticates with `grant_type=client_credentials`
  2. Uses HTTP Basic Auth with CLIENT_ID:CLIENT_SECRET
  3. Returns usable access token
  4. Auto-refreshes before expiry
- **Out of Scope**: User-context operations
- **Notes**: Cannot upload media at this tier

### E03-T05: Tier 3 full OAuth (password grant)
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03-T02
- **Description**: Implement password grant (all 4 vars). 100 QPM, full read/write/mod. Request all Phase 1 scopes.
- **Acceptance Criteria**:
  1. Authenticates with `grant_type=password`
  2. Requests all 12 Phase 1 scopes: `read identity submit edit vote privatemessages history wikiread modposts modcontributors modlog modnote`
  3. Returns access token that works for write endpoints
  4. `getAuthTier()` returns `"user"`
  5. Scope list configurable for Phase 2/3 expansion
- **Out of Scope**: Web app auth code grant (that's Phase 2+ / E09-T05)
- **Notes**: Username+password sent in POST body, not URL

### E03-T06: Auth-aware tool guard
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E03-T02
- **Description**: Build `src/reddit/auth-guard.ts`: utility to verify current auth tier supports required operation. Returns clear error if insufficient.
- **Acceptance Criteria**:
  1. `requireAuth("user")` throws if tier is anon/app-only
  2. `requireAuth("anon")` always succeeds
  3. Error messages name specific env vars needed
  4. Can check for specific OAuth scopes
- **Out of Scope**: Per-tool scope configuration (tools declare their own)
- **Notes**: Error message example: "This tool requires user authentication. Set REDDIT_USERNAME and REDDIT_PASSWORD."

### E03-T07: Wire auth into HTTP client
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02-T06, E03-T02
- **Description**: Integrate `RedditAuthManager` into `RedditClient`. Every request gets `Authorization: Bearer {token}` header. Token refresh is transparent.
- **Acceptance Criteria**:
  1. All requests include Bearer token header
  2. Token refresh happens transparently mid-session
  3. Auth tier determines callable endpoints
  4. Integration test verifies header injection with mocked auth
- **Out of Scope**: Tier-specific endpoint routing
- **Notes**: Anonymous tier may use different base URL
