# E05: Phase 1 Write Tools

## Status: Not Started

## Goal
Implement all 7 Phase 1 write tools plus the safety layer (content validation, bot disclosure, duplicate detection).

## Dependencies
- E02 (Core Infrastructure) — must be Done
- E03 (Authentication System) — must be Done
- E04 (Read Tools) — soft dependency (patterns established)

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 4.4, 11
- research/08-reddit-content-formatting.md
- research/07-api-edge-cases-and-gotchas.md
- research/10-tool-inventory.md (Phase 1 Write Tools)

## Tasks

### E05-T01: Safety layer — content validation
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E02
- **Description**: Build `src/utils/safety.ts`: validate content lengths (title<=300, body<=40K, comment<=10K, message<=10K). Count Unicode characters not bytes. Validate title non-empty. Check for Snudown-incompatible markdown.
- **Acceptance Criteria**:
  1. Rejects title > 300 chars with specific error
  2. Rejects body > 40,000 chars with specific error
  3. Counts Unicode chars correctly (emoji = 1 char, not 2+ bytes)
  4. Returns specific error identifying which limit was exceeded
  5. Unit tests cover boundary cases (exactly at limit, 1 over)
- **Out of Scope**: Markdown rendering or preview
- **Notes**: Premium users get 80K body limit, but validate at 40K (standard) by default

### E05-T02: Safety layer — bot disclosure and duplicate detection
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E05-T01
- **Description**: Bot disclosure: auto-append configurable footer to all posts/comments per Reddit Responsible Builder Policy. Duplicate detection: hash recent submissions (title+subreddit), prevent re-posts within configurable window.
- **Acceptance Criteria**:
  1. Footer appended to all submitted content
  2. Footer text configurable via `REDDIT_BOT_FOOTER` env var
  3. Duplicate detection catches identical title+subreddit within 5 minutes
  4. Duplicate bypass with explicit `force: true` parameter
- **Out of Scope**: Spam detection, content moderation
- **Notes**: Default footer: `\n\n---\n*I am a bot. This action was performed automatically.*`

### E05-T03: `create_post` tool
- **Status**: Not Started
- **Size**: L
- **Dependencies**: E05-T01, E05-T02, E03
- **Description**: Submit text or link post. Params: `subreddit`, `title`, `text` (self), `url` (link), `flair_id` (optional), `nsfw` (optional), `spoiler` (optional). Uses `POST /api/submit`.
- **Acceptance Criteria**:
  1. Text post created with content validation applied
  2. Link post created with URL
  3. Bot footer appended to text posts
  4. Duplicate detection active
  5. Returns post fullname and URL on success
  6. Handles Reddit errors (rate limit, subreddit restrictions, banned)
- **Out of Scope**: Image/video/gallery/poll posts (Phase 2)
- **Notes**: `kind` param: `self` for text, `link` for URL. Response is in wrapped JSON format.

### E05-T04: `create_comment` and `reply_message` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E05-T01, E05-T02, E03
- **Description**: Reply to post or comment. Reply to private message. Both use `POST /api/comment`.
- **Acceptance Criteria**:
  1. Comment on post by fullname (t3_xxx)
  2. Reply to comment by fullname (t1_xxx)
  3. Bot footer appended
  4. Content length validated (10K max)
  5. `reply_message` uses `privatemessages` scope
  6. Returns comment/reply fullname
- **Out of Scope**: Rich text / RTJSON format
- **Notes**: Both use the same endpoint but different parent types

### E05-T05: `edit_text` and `delete_content` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03
- **Description**: Edit self-post body or comment text (`POST /api/editusertext`). Delete own post or comment (`POST /api/del`).
- **Acceptance Criteria**:
  1. Edit replaces body text with content validation
  2. Edit preserves bot footer
  3. Delete removes own content
  4. Both require `edit` scope
  5. Error on attempting to edit/delete others' content
- **Out of Scope**: Editing titles (Reddit doesn't allow this)
- **Notes**: Reddit returns `{"json": {"data": {...}}}` on success

### E05-T06: `vote` and `send_message` tools
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E03
- **Description**: Vote (up/down/clear) on post/comment (`POST /api/vote`). Send private message (`POST /api/compose`).
- **Acceptance Criteria**:
  1. Vote accepts `dir` as 1, -1, or 0
  2. Vote accepts fullname (t1_xxx or t3_xxx)
  3. Message validates recipient username exists
  4. Message validates subject + body length
  5. `vote` scope for voting, `privatemessages` for messaging
- **Out of Scope**: Bulk voting, message threads
- **Notes**: Vote response is empty `{}` on success

### E05-T07: Write tools registration and integration test
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E05-T03 through E05-T06
- **Description**: Register all 7 write tools. Wire into server. Integration test verifying validation → auth guard → API call → response.
- **Acceptance Criteria**:
  1. All 7 tools listed by MCP Inspector
  2. Auth guard rejects all write tools when tier is anon/app-only
  3. Integration test proves content validation runs before API call
  4. Zod schemas have descriptions for all params
- **Out of Scope**: E2E testing (E08)
- **Notes**: Write tools should be clearly distinguishable from read tools in descriptions
