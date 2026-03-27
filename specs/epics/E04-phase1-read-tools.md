# E04: Phase 1 Read Tools

## Status: Not Started

## Goal
Implement all 12 Phase 1 read tools — the foundation of the server's value that works at all auth tiers.

## Dependencies
- E02 (Core Infrastructure) — must be Done
- E03 (Authentication System) — must be Done

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 2, 8, 10, 11
- research/10-tool-inventory.md (Phase 1 Read Tools table)
- research/01-reddit-official-api.md
- research/07-api-edge-cases-and-gotchas.md

## Tasks

### E04-T01: `search` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Search posts across Reddit or within a subreddit. Params: `q`, `subreddit` (optional), `sort` (relevance/hot/top/new), `time` (hour/day/week/month/year/all), `limit`, `after`. Uses `GET /search` or `GET /r/{sub}/search`.
- **Acceptance Criteria**:
  1. Returns posts matching query with title, score, author, url, subreddit
  2. Subreddit-scoped search works
  3. Sort and time filters apply correctly
  4. Pagination via `after` cursor works
  5. Zod schema validates all params with descriptions
- **Out of Scope**: Comment search (Reddit doesn't support it via API)
- **Notes**: `restrict_sr=true` needed for subreddit-scoped search

### E04-T02: `get_post` and `get_comments` tools
- **Status**: Not Started
- **Size**: L
- **Dependencies**: E02, E03
- **Description**: Get post by ID with full details. Get comment tree with sort and depth control. Handle the `replies` field quirk. Uses `GET /r/{sub}/comments/{id}`.
- **Acceptance Criteria**:
  1. Post retrieved by fullname (`t3_xxx`) or bare ID
  2. Comments sorted by best/top/new/controversial/old
  3. Depth parameter respected
  4. `replies: ""` handled without crash
  5. "More" comment stubs indicated in response
- **Out of Scope**: Expanding "more comments" (that's a separate API call, potentially Phase 2)
- **Notes**: API returns [post_listing, comment_listing] — a 2-element array. Comment replies field is `""` when empty, not null/undefined.

### E04-T03: `get_subreddit` and `get_subreddit_rules` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Get subreddit info and rules. Handle private/banned/nonexistent subreddit edge cases. Uses `GET /r/{sub}/about` and `GET /r/{sub}/about/rules`.
- **Acceptance Criteria**:
  1. Returns subscriber count, description, created date, NSFW status
  2. Rules returned as structured list with kind and description
  3. Private subreddit returns clear "private" error (not crash)
  4. Nonexistent subreddit returns clear "not found" error
- **Out of Scope**: Subreddit settings (mod-only, Phase 3)
- **Notes**: Private subs may return 302 redirect instead of 403. Check `over18` (no underscore!) for subreddits.

### E04-T04: `get_subreddit_posts` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: List posts from a subreddit feed. Params: `subreddit`, `sort` (hot/new/top/rising/controversial), `time` (for top/controversial), `limit`, `after`. Uses `GET /r/{sub}/{sort}`.
- **Acceptance Criteria**:
  1. All 5 sort modes work
  2. Time filter applies to top/controversial only
  3. Returns normalized post list with pagination cursor
  4. Post type detected (text/link/image/video/gallery/poll)
- **Out of Scope**: Frontpage (r/all, r/popular) — can be added if needed
- **Notes**: `rising` has no time filter. Default limit is 25, max 100.

### E04-T05: `get_user`, `get_user_posts`, `get_user_comments` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Get user profile, posts, and comments. Uses `GET /user/{username}/about`, `/submitted`, `/comments`.
- **Acceptance Criteria**:
  1. Profile includes karma breakdown, cake day, account age
  2. Posts and comments support sort (hot/new/top) and pagination
  3. Suspended/deleted users handled gracefully
  4. `history` scope used for posts/comments endpoints
- **Out of Scope**: User's saved/hidden/upvoted content (requires target user's auth)
- **Notes**: Suspended users return minimal data. Shadow-banned users return 404.

### E04-T06: `get_trending` and `get_wiki_page` tools
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02, E03
- **Description**: Get popular subreddits and read wiki pages. Uses `GET /subreddits/popular` and `GET /r/{sub}/wiki/{page}`.
- **Acceptance Criteria**:
  1. Trending returns list with subscriber counts and descriptions
  2. Wiki page content returned as markdown text
  3. Wiki page not found returns clear error
  4. `wikiread` scope used for wiki endpoint
- **Out of Scope**: Wiki editing (Phase 3), subreddit discovery/search
- **Notes**: Wiki page names are case-sensitive. Some subreddits have wiki disabled.

### E04-T07: `get_me` tool
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E02, E03
- **Description**: Get authenticated user's own profile. Requires Tier 3 auth. Uses `GET /api/v1/me`.
- **Acceptance Criteria**:
  1. Returns current user's profile data (username, karma, preferences)
  2. Auth guard enforces `user` tier
  3. Returns helpful error when called without user auth
  4. `identity` scope used
- **Out of Scope**: Updating preferences
- **Notes**: This is the only Phase 1 read tool that requires user auth

### E04-T08: Tool registration and barrel export
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E04-T01 through E04-T07
- **Description**: Register all 12 read tools in `src/tools/read/index.ts`. Wire into `server.ts`. Verify all appear in MCP Inspector.
- **Acceptance Criteria**:
  1. All 12 tools listed by MCP Inspector
  2. Tool descriptions are clear and concise (under 200 chars)
  3. Zod schemas have proper descriptions for all parameters
  4. No duplicate tool names
- **Out of Scope**: Write or mod tool registration
- **Notes**: Tool descriptions are what the LLM reads to decide which tool to use — make them count
