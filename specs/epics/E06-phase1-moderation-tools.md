# E06: Phase 1 Moderation Tools

## Status: Not Started

## Goal
Implement the 6 moderation tools that are our primary competitive differentiator — no other Reddit MCP server has any of these.

## Dependencies
- E02 (Core Infrastructure) — must be Done
- E03 (Authentication System) — must be Done

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 9
- research/05-reddit-moderation-apis.md
- research/10-tool-inventory.md (Phase 1 Moderation Tools)

## Tasks

### E06-T01: `get_modqueue` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: List items needing mod review (reported + spam-filtered). Params: `subreddit`, `type` (links/comments/all), `limit`, `after`. Uses `GET /r/{sub}/about/modqueue`.
- **Acceptance Criteria**:
  1. Returns list of items pending review with report reasons
  2. Filters by type (links vs comments vs all)
  3. Pagination via `after` cursor works
  4. Requires `modposts` + `read` scopes
  5. Clear error when user is not a mod of the subreddit
- **Out of Scope**: Batch actions on modqueue items
- **Notes**: Non-mods get 403. Items include both reported and auto-filtered content.

### E06-T02: `approve` and `remove` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Approve item from modqueue. Remove item with optional `spam` flag. Uses `POST /api/approve` and `POST /api/remove`.
- **Acceptance Criteria**:
  1. Approve accepts fullname (t1_xxx or t3_xxx)
  2. Remove accepts fullname with optional `spam: true`
  3. Both require `modposts` scope
  4. Returns confirmation of action taken
  5. Handles "already approved/removed" gracefully (not crash)
- **Out of Scope**: Removal reasons (Phase 3)
- **Notes**: Both return empty `{}` on success. `spam: true` trains Reddit's spam filter.

### E06-T03: `ban_user` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Ban user from subreddit. Params: `subreddit`, `username`, `duration` (days, 0=permanent), `reason` (mod note), `message` (sent to user). Uses `POST /r/{sub}/api/friend` with `type=banned`.
- **Acceptance Criteria**:
  1. Temporary ban with duration (1-999 days)
  2. Permanent ban (duration=0 or omitted)
  3. Ban message sent to user
  4. Mod note attached to ban
  5. Requires `modcontributors` scope
  6. Error on invalid duration or already-banned user
- **Out of Scope**: Unban (Phase 3), mute (Phase 3)
- **Notes**: Reddit's relationship API (`/api/friend`) is used for bans, mutes, contributors. `type` parameter distinguishes them.

### E06-T04: `get_mod_log` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Get moderation action history. Params: `subreddit`, `mod` (filter by moderator), `type` (43 action types), `limit`, `after`. Uses `GET /r/{sub}/about/log`.
- **Acceptance Criteria**:
  1. Returns mod actions with timestamps, moderator, target, details
  2. Filters by action type (e.g., `banuser`, `removelink`, `approvecomment`)
  3. Filters by moderator username
  4. Pagination works
  5. Requires `modlog` scope
- **Out of Scope**: Aggregated mod stats
- **Notes**: 43 action types exist. Common: `banuser`, `unbanuser`, `removelink`, `removecomment`, `approvelink`, `approvecomment`, `spamlink`, `spamcomment`

### E06-T05: `get_mod_notes` tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02, E03
- **Description**: Read moderator notes for a user in a subreddit. Handle special 30 QPM rate limit. Params: `subreddit`, `user`. Uses `GET /api/mod/notes`.
- **Acceptance Criteria**:
  1. Returns mod notes for user+subreddit pair
  2. Rate limiter enforces 30 QPM for this endpoint (not 100)
  3. Note labels correctly parsed (BOT_BAN, PERMA_BAN, BAN, ABUSE_WARNING, SPAM_WARNING, SPAM_WATCH, SOLID_CONTRIBUTOR, HELPFUL_USER)
  4. Requires `modnote` scope
  5. Pagination supported
- **Out of Scope**: Creating/deleting mod notes (Phase 3)
- **Notes**: Max 250 chars per note. Special rate limit requires per-endpoint limiter config.

### E06-T06: Mod tools registration and integration
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E06-T01 through E06-T05
- **Description**: Register all 6 mod tools. Wire auth guards requiring `user` tier. Integration tests verifying scope requirements.
- **Acceptance Criteria**:
  1. All 6 tools listed by MCP Inspector
  2. Auth guard rejects all when not Tier 3
  3. Scope errors are specific ("requires modposts scope")
  4. Tool descriptions explicitly mention mod-only access
- **Out of Scope**: Phase 2/3 mod tools
- **Notes**: These 6 tools are our biggest competitive advantage — zero other MCP servers have them
