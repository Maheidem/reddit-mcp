# Research #10: Complete MCP Tool Inventory

> **Researcher**: researcher-5
> **Date**: 2026-03-27
> **Status**: Complete
> **Based On**: Docs 01 (Official API), 04 (Content Capabilities), 05 (Moderation APIs), 06 (Architecture), 09 (SDK)

---

## Auth Tiers

| Tier | Description | OAuth Flow |
|------|-------------|------------|
| **anon** | No user identity. Public read-only data | Client Credentials / Installed Client grant |
| **app-only** | App context, no user. Public reads + search | Client Credentials grant |
| **user** | Full user context. Read + write + moderate | Authorization Code or Password grant |

---

## Phase 1 — Core (25 Tools, Launch Target)

The essential 25 tools providing read, write, and basic moderation capabilities. Covers the ~80% use case.

### Read Tools (12)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 1 | `search` | Search posts across Reddit or within a subreddit | anon | `GET /search` or `GET /r/{sub}/search` | `read` |
| 2 | `get_post` | Get a post by ID with full details | anon | `GET /r/{sub}/comments/{id}` | `read` |
| 3 | `get_comments` | Get comment tree for a post (with sort and depth control) | anon | `GET /r/{sub}/comments/{id}` | `read` |
| 4 | `get_subreddit` | Get subreddit info — description, rules, subscribers, settings | anon | `GET /r/{sub}/about` | `read` |
| 5 | `get_subreddit_posts` | List posts from a subreddit feed (hot/new/top/rising) | anon | `GET /r/{sub}/{sort}` | `read` |
| 6 | `get_subreddit_rules` | Get subreddit rules list | anon | `GET /r/{sub}/about/rules` | `read` |
| 7 | `get_user` | Get user profile — karma, account age, trophies | anon | `GET /user/{username}/about` | `read` |
| 8 | `get_user_posts` | List a user's submitted posts | anon | `GET /user/{username}/submitted` | `history` |
| 9 | `get_user_comments` | List a user's comments | anon | `GET /user/{username}/comments` | `history` |
| 10 | `get_trending` | Get popular/trending subreddits | anon | `GET /subreddits/popular` | `read` |
| 11 | `get_wiki_page` | Read a subreddit wiki page | anon | `GET /r/{sub}/wiki/{page}` | `wikiread` |
| 12 | `get_me` | Get authenticated user's own profile | user | `GET /api/v1/me` | `identity` |

### Write Tools (7)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 13 | `create_post` | Submit a new text or link post to a subreddit | user | `POST /api/submit` | `submit` |
| 14 | `create_comment` | Reply to a post or comment | user | `POST /api/comment` | `submit` |
| 15 | `edit_text` | Edit a self-post body or comment text | user | `POST /api/editusertext` | `edit` |
| 16 | `delete_content` | Delete own post or comment | user | `POST /api/del` | `edit` |
| 17 | `vote` | Upvote, downvote, or clear vote on post/comment | user | `POST /api/vote` | `vote` |
| 18 | `send_message` | Send a private message to a user | user | `POST /api/compose` | `privatemessages` |
| 19 | `reply_message` | Reply to a private message | user | `POST /api/comment` | `privatemessages` |

### Moderation Tools (6)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 20 | `get_modqueue` | List items needing moderator review (reported + spam-filtered) | user | `GET /r/{sub}/about/modqueue` | `modposts` + `read` |
| 21 | `approve` | Approve a post or comment from the modqueue | user | `POST /api/approve` | `modposts` |
| 22 | `remove` | Remove a post or comment (with optional spam flag) | user | `POST /api/remove` | `modposts` |
| 23 | `ban_user` | Ban a user from a subreddit (temp or permanent) | user | `POST /r/{sub}/api/friend` | `modcontributors` |
| 24 | `get_mod_log` | Get moderation action history with filters | user | `GET /r/{sub}/about/log` | `modlog` |
| 25 | `get_mod_notes` | Read moderator notes for a user | user | `GET /api/mod/notes` | `modnote` |

### Phase 1 Scope Summary

- **12 read** + **7 write** + **6 mod** = **25 tools**
- Minimum scopes needed: `read`, `identity`, `submit`, `edit`, `vote`, `privatemessages`, `history`, `wikiread`, `modposts`, `modcontributors`, `modlog`, `modnote`
- Covers: browsing, searching, posting, commenting, voting, messaging, basic moderation

---

## Phase 2 — Extended (18 Tools)

Adds flair management, modmail, collections, media, polls, and content moderation controls.

### Flair Management (3)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 26 | `get_flair_templates` | List available user or link flair templates for a subreddit | anon | `GET /r/{sub}/api/link_flair_v2` or `user_flair_v2` | `flair` |
| 27 | `set_flair` | Set user or post flair (mod action) | user | `POST /r/{sub}/api/flair` or `selectflair` | `modflair` / `flair` |
| 28 | `manage_flair_template` | Create, update, or delete a flair template | user | `POST /r/{sub}/api/flairtemplate_v2` | `modflair` |

### Modmail (3)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 29 | `list_modmail` | List modmail conversations with state/sort filters | user | `GET /api/mod/conversations` | `modmail` |
| 30 | `read_modmail` | Read a specific modmail conversation with all messages | user | `GET /api/mod/conversations/{id}` | `modmail` |
| 31 | `reply_modmail` | Reply to a modmail conversation (public or internal mod-only) | user | `POST /api/mod/conversations/{id}` | `modmail` |

### Collections (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 32 | `get_collections` | List collections in a subreddit or get a specific collection | anon | `GET /api/v1/collections/subreddit_collections` | `read` |
| 33 | `manage_collection` | Create, delete, or modify a collection (add/remove/reorder posts) | user | `POST /api/v1/collections/*` | `modposts` |

### Media Posts (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 34 | `upload_media` | Upload image or video and get CDN URL for post submission | user | `POST /api/media/asset.json` + S3 upload | `submit` |
| 35 | `create_gallery_post` | Submit a gallery post with multiple pre-uploaded images | user | `POST /api/submit_gallery_post.json` | `submit` |

### Polls (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 36 | `create_poll` | Submit a poll post with 2-6 options and duration | user | `POST /api/submit_poll_post` | `submit` |

### Content Moderation (5)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 37 | `mark_nsfw` | Mark or unmark a post as NSFW | user | `POST /api/marknsfw` or `unmarknsfw` | `modposts` |
| 38 | `mark_spoiler` | Mark or unmark a post as spoiler | user | `POST /api/spoiler` or `unspoiler` | `modposts` |
| 39 | `lock` | Lock or unlock a post (prevents new comments) | user | `POST /api/lock` or `unlock` | `modposts` |
| 40 | `sticky_post` | Sticky or unsticky a post (slot 1 or 2) | user | `POST /api/set_subreddit_sticky` | `modposts` |
| 41 | `distinguish` | Distinguish a comment as mod (with optional sticky) | user | `POST /api/distinguish` | `modposts` |

### Crossposting (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 42 | `crosspost` | Crosspost an existing post to another subreddit | user | `POST /api/submit` (kind=crosspost) | `submit` |

### Inbox (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 43 | `get_inbox` | Get inbox messages (all/unread/sent/mentions) | user | `GET /message/{where}` | `privatemessages` |

### Phase 2 Scope Summary

- **18 additional tools** (total: 43)
- Additional scopes: `modflair`, `modmail`
- Covers: flair CRUD, modmail conversations, collections, media upload, polls, content moderation flags, crossposting

---

## Phase 3 — Power User (17 Tools)

Advanced features for power moderators, bot developers, and subreddit admins.

### Wiki CRUD (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 44 | `edit_wiki_page` | Create or edit a subreddit wiki page | user | `POST /r/{sub}/api/wiki/edit` | `wikiedit` |
| 45 | `list_wiki_pages` | List all wiki pages in a subreddit | anon | `GET /r/{sub}/wiki/pages` | `wikiread` |

### AutoModerator (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 46 | `manage_automod` | Read or update AutoModerator rules (via wiki config page) | user | `GET/POST /r/{sub}/wiki/config/automoderator` | `wikiedit` + `modwiki` |

### Removal Reasons (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 47 | `manage_removal_reasons` | List, create, update, or delete removal reasons | user | `GET/POST/PUT/DELETE /api/v1/{sub}/removal_reasons` | `modconfig` |

### Subreddit Settings (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 48 | `get_subreddit_settings` | Get full subreddit configuration (mod-only) | user | `GET /r/{sub}/about/edit` | `modconfig` |
| 49 | `update_subreddit_settings` | Partially update subreddit settings | user | `PATCH /api/v1/subreddit/update_settings` | `modconfig` |

### Traffic Stats (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 50 | `get_traffic` | Get subreddit traffic stats (day/hour/month) | user | `GET /r/{sub}/about/traffic` | `modconfig` |

### Mod Notes CRUD (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 51 | `create_mod_note` | Create a mod note on a user with label and linked content | user | `POST /api/mod/notes` | `modnote` |
| 52 | `delete_mod_note` | Delete a specific mod note | user | `DELETE /api/mod/notes` | `modnote` |

### Emoji Management (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 53 | `manage_emojis` | List, create, update, or delete custom subreddit emojis | user | `GET/POST/PUT/DELETE /api/v1/{sub}/emoji*` | `modconfig` |

### User Management (3)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 54 | `unban_user` | Unban a user from a subreddit | user | `POST /r/{sub}/api/unfriend` (type=banned) | `modcontributors` |
| 55 | `mute_user` | Mute a user (prevents modmail for 3/7/28 days or permanently) | user | `POST /r/{sub}/api/friend` (type=muted) | `modcontributors` |
| 56 | `manage_contributor` | Add or remove an approved submitter | user | `POST /r/{sub}/api/friend` or `unfriend` (type=contributor) | `modcontributors` |

### Moderation Queues (2)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 57 | `get_reports` | List user-reported items only | user | `GET /r/{sub}/about/reports` | `modposts` + `read` |
| 58 | `get_spam` | List items caught by the spam filter | user | `GET /r/{sub}/about/spam` | `modposts` + `read` |

### Rules Management (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 59 | `manage_rules` | Create, update, delete, or reorder subreddit rules | user | `POST /r/{sub}/api/*_subreddit_rule*` | `modconfig` |

### Modmail Advanced (1)

| # | Name | Description | Auth | Endpoint | Scope |
|---|------|-------------|------|----------|-------|
| 60 | `create_modmail` | Create a new modmail conversation to a user | user | `POST /api/mod/conversations` | `modmail` |

### Phase 3 Scope Summary

- **17 additional tools** (total: 60)
- Additional scopes: `modconfig`, `modwiki`
- Full OAuth scope set: `read`, `identity`, `submit`, `edit`, `vote`, `privatemessages`, `history`, `wikiread`, `wikiedit`, `flair`, `modflair`, `modposts`, `modcontributors`, `modlog`, `modmail`, `modnote`, `modconfig`, `modwiki`

---

## Tool Count Summary

| Phase | Tools | Running Total | Focus |
|-------|-------|---------------|-------|
| Phase 1 | 25 | 25 | Core read/write/mod — launch target |
| Phase 2 | 18 | 43 | Extended features — flair, modmail, media, content flags |
| Phase 3 | 17 | 60 | Power user — wiki, automod, settings, advanced mod |

**Note**: The SDK research (doc 09) recommends 20-25 tools as the sweet spot before model confusion. Phase 1 targets exactly 25. Phase 2 and 3 should be opt-in via configuration or separate tool groups, not loaded by default.

---

## Auth Tier Distribution

| Tier | Phase 1 | Phase 2 | Phase 3 | Total |
|------|---------|---------|---------|-------|
| anon (read-only) | 11 | 2 | 2 | 15 |
| user (write/mod) | 14 | 16 | 15 | 45 |
| **Total** | **25** | **18** | **17** | **60** |

---

## Complete OAuth Scope Requirements

### Phase 1 (Minimum)

```
read identity submit edit vote privatemessages history
wikiread modposts modcontributors modlog modnote
```

### Phase 2 (Extended)

```
+ flair modflair modmail
```

### Phase 3 (Full)

```
+ modconfig modwiki wikiedit
```

---

## Naming Convention

Following doc 06 and 09's guidance (`reddit_{action}_{resource}` pattern or `domain_noun_verb`):

| Pattern | Example |
|---------|---------|
| Read single | `get_post`, `get_user`, `get_subreddit` |
| Read list | `get_subreddit_posts`, `get_user_comments`, `get_modqueue` |
| Create | `create_post`, `create_comment`, `create_poll` |
| Update | `edit_text`, `set_flair`, `update_subreddit_settings` |
| Delete | `delete_content`, `delete_mod_note` |
| Toggle | `lock`, `mark_nsfw`, `mark_spoiler`, `sticky_post` |
| Action | `approve`, `remove`, `ban_user`, `vote`, `distinguish` |
| Multi-op | `manage_collection`, `manage_rules`, `manage_automod` |

The `manage_*` prefix is used for tools that combine CRUD operations into a single tool with an `action` parameter (create/update/delete/list), keeping tool count manageable while maintaining full functionality.

---

## Competitive Advantage Analysis

Based on doc 03's gap analysis of existing MCP servers:

| Feature | Existing Servers | Our Phase |
|---------|:----------------:|:---------:|
| Search posts | Yes (all) | 1 |
| Read posts/comments | Yes (all) | 1 |
| Create post/comment | Yes (some) | 1 |
| Vote | Yes (some) | 1 |
| **Modqueue** | **None** | **1** |
| **Ban/unban** | **None** | **1** |
| **Mod log** | **None** | **1** |
| **Mod notes** | **None** | **1** |
| **Flair CRUD** | **None** | **2** |
| **Modmail** | **None** | **2** |
| **Collections** | **None** | **2** |
| **Media upload** | **None** | **2** |
| **Polls** | **None** | **2** |
| **Content flags (NSFW/lock/sticky)** | **None** | **2** |
| **Wiki CRUD** | **None** | **3** |
| **AutoMod management** | **None** | **3** |
| **Removal reasons** | **None** | **3** |
| **Subreddit settings** | **None** | **3** |
| **Traffic stats** | **None** | **3** |
| **Rules management** | **None** | **3** |

**Result**: Phase 1 alone gives us 4 unique mod tools no other MCP server has. By Phase 3, we offer 16+ features unavailable anywhere else.

---

## Sources

- Doc 01: `research/01-reddit-official-api.md` — Endpoint catalog, OAuth scopes, data model
- Doc 04: `research/04-reddit-content-capabilities.md` — Media upload, polls, collections, live threads
- Doc 05: `research/05-reddit-moderation-apis.md` — All moderation endpoints, mod notes, modmail, flair
- Doc 06: `research/06-oauth-and-mcp-architecture.md` — Auth tiers, tool naming, tool count guidance
- Doc 09: `research/09-typescript-mcp-sdk-deep-dive.md` — SDK patterns, 25-tool sweet spot, naming convention
