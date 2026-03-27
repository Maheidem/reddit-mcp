# Research #5: Reddit Moderation, Admin Tools, and Automation APIs

> **Researcher**: researcher-5
> **Date**: 2026-03-27
> **Status**: Complete
> **Confidence**: High

---

## Table of Contents

1. [Mod Actions](#1-mod-actions)
2. [AutoModerator](#2-automoderator)
3. [Mod Queue](#3-mod-queue)
4. [Mod Mail (New System)](#4-mod-mail-new-system)
5. [Ban/Mute Management](#5-banmute-management)
6. [Flair Management](#6-flair-management)
7. [Subreddit Settings](#7-subreddit-settings)
8. [Traffic Stats](#8-traffic-stats)
9. [Mod Log](#9-mod-log)
10. [User Notes / Mod Notes](#10-user-notes--mod-notes)
11. [Removal Reasons](#11-removal-reasons)
12. [Scheduled Posts](#12-scheduled-posts)
13. [Bot-Specific Concerns](#13-bot-specific-concerns)
14. [Crowd Control & Safety](#14-crowd-control--safety)
15. [Additional Mod Endpoints](#15-additional-mod-endpoints)
16. [OAuth Scopes Reference](#16-oauth-scopes-reference)
17. [Capability Matrix](#17-capability-matrix)
18. [Devvit Developer Platform](#18-devvit-developer-platform)
19. [MCP Server Implementation Recommendations](#19-mcp-server-implementation-recommendations)
20. [Sources](#20-sources)

---

## 1. Mod Actions

All content moderation actions operate on fullnames (e.g., `t3_abc123` for posts, `t1_xyz789` for comments).

### 1.1 Core Content Actions

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/api/approve` | POST | modposts | `id` (fullname) | Approve a link or comment. Removes from modqueue/spam |
| `/api/remove` | POST | modposts | `id` (fullname), `spam` (bool) | Remove content. `spam=true` trains the spam filter |
| `/api/distinguish` | POST | modposts | `id` (fullname), `how` (yes/no/admin/special), `sticky` (bool, optional) | Add mod distinction (green shield). `how=yes` = mod, `how=no` = remove, `admin`/`special` require admin privileges. `sticky=true` pins comment to top (top-level only) |
| `/api/ignore_reports` | POST | modposts | `id` (fullname) | Ignore all future user reports on this item |
| `/api/unignore_reports` | POST | modposts | `id` (fullname) | Re-enable reports on this item |

### 1.2 Post-Specific Moderation

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/api/lock` | POST | modposts | `id` (fullname) | Lock — prevents new comments |
| `/api/unlock` | POST | modposts | `id` (fullname) | Unlock a locked post |
| `/api/marknsfw` | POST | modposts | `id` (fullname) | Mark as Not Safe For Work |
| `/api/unmarknsfw` | POST | modposts | `id` (fullname) | Remove NSFW flag |
| `/api/spoiler` | POST | modposts | `id` (fullname) | Mark as spoiler (blurs thumbnail) |
| `/api/unspoiler` | POST | modposts | `id` (fullname) | Remove spoiler tag |
| `/api/set_contest_mode` | POST | modposts | `id` (fullname), `state` (bool) | Enable/disable contest mode. Randomizes comment sort order, hides scores, collapses replies behind "[show replies]" buttons |
| `/api/set_suggested_sort` | POST | modposts | `id` (fullname), `sort` (string) | Set suggested comment sort. Values: `confidence`, `top`, `new`, `controversial`, `old`, `random`, `qa`, `blank` (blank = clear) |
| `/api/set_subreddit_sticky` | POST | modposts | `id` (fullname), `state` (bool), `num` (1 or 2), `to_profile` (bool) | Sticky/unsticky a post. `num=1` = top slot, `num=2` = second. Max 2 stickied posts per subreddit |

### 1.3 Comment-Specific Moderation

Comments use the same `/api/approve`, `/api/remove`, `/api/distinguish`, `/api/lock`, `/api/unlock` endpoints as posts. The `sticky` parameter on `/api/distinguish` pins a **top-level** comment to the top of the thread (only one sticky comment per post). Non-top-level comments silently ignore the `sticky` parameter.

**Sources**: [JRAW ENDPOINTS.md](https://github.com/mattbdean/JRAW/blob/master/ENDPOINTS.md), [OCaml Reddit API Kernel](https://leviroth.github.io/ocaml-reddit-api/reddit_api_kernel/Reddit_api_kernel/Endpoint/index.html), [Reddit.NET LinksAndComments](https://sirkris.github.io/Reddit.NET/reference/html/class_reddit_1_1_models_1_1_links_and_comments.html)

---

## 2. AutoModerator

### 2.1 How It Works

AutoModerator is a **rule-based** moderation system. Rules are defined in YAML and stored in a **subreddit wiki page**. There is **no dedicated AutoModerator API endpoint**. All interaction is through the wiki system.

### 2.2 Configuration Location

- **Wiki page**: `/r/{subreddit}/wiki/config/automoderator`
- **Access**: Edit via wiki API (`/r/{subreddit}/api/wiki/edit`)
- **Scopes required**: `wikiedit` + `modwiki`

### 2.3 Programmatic Management Pattern

```
1. GET /r/{subreddit}/wiki/config/automoderator  → Read current rules (YAML)
2. Parse the YAML, modify rules
3. POST /r/{subreddit}/api/wiki/edit              → Write updated YAML back
     params: page=config/automoderator, content=<new_yaml>, reason="Updated via bot"
```

### 2.4 Rule Format (YAML)

Rules are separated by `---`. Each rule has:

```yaml
---
type: submission          # submission, comment, or both (default: both)
# Conditions:
title (includes): ["spam keyword", "buy now"]
body (regex): "bitcoin.*wallet"
author:
  account_age: "< 7 days"
  combined_karma: "< 10"
  is_contributor: false
domain (includes): ["spamsite.com"]
# Actions:
action: remove            # approve, remove, filter, spam, report
action_reason: "AutoMod: {{match}} triggered rule"
comment: |
  Your post was removed for violating Rule 1.
  Please read our sidebar.
comment_stickied: true
set_flair:
  text: "Removed"
  css_class: "removed"
modmail: "AutoMod removed a post by {{author}} — {{title}}"
---
```

### 2.5 Key Rule Properties

**Conditions** (check attributes):
- `title`, `body`, `domain`, `url`, `flair_text`, `flair_css_class`
- `author` sub-properties: `name`, `flair_text`, `flair_css_class`, `account_age`, `post_karma`, `comment_karma`, `combined_karma`, `is_contributor`, `is_moderator`, `is_gold`, `satisfy_any_threshold`
- Match modifiers: `(includes)`, `(includes-word)`, `(includes-regex)`, `(regex)`, `(starts-with)`, `(ends-with)`, `(full-exact)`, `(full-text)`

**Actions**:
- `action`: `approve`, `remove`, `filter`, `spam`, `report`
- `set_flair`, `set_sticky`, `set_nsfw`, `set_spoiler`, `set_contest_mode`, `set_suggested_sort`, `set_locked`
- `comment`, `comment_stickied`, `modmail`, `modmail_subject`, `message`, `message_subject`
- `action_reason` (internal mod note), `report_reason`

### 2.6 Important Notes for MCP Server

- An MCP tool could offer "read AutoMod rules" and "update AutoMod rules" by wrapping wiki read/write
- Parsing YAML rules is non-trivial — the format has Reddit-specific syntax
- Changes take effect immediately upon wiki page save
- The wiki page revision history serves as an audit trail for config changes

**Sources**: [AutoModerator - Reddit Help](https://support.reddithelp.com/hc/en-us/articles/15484574206484-Automoderator), [reddit-archive automoderator.py](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/automoderator.py)

---

## 3. Mod Queue

Mod queues are **listing endpoints** that return paginated content requiring moderator attention.

### 3.1 Queue Endpoints

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/modqueue` | GET | modposts + read | All items needing review: user-reported items + spam-filtered items combined |
| `/r/{subreddit}/about/reports` | GET | modposts + read | Only user-reported items |
| `/r/{subreddit}/about/spam` | GET | modposts + read | Only items caught by the spam filter |
| `/r/{subreddit}/about/unmoderated` | GET | modposts + read | Items not yet reviewed (approved/removed) by any moderator |
| `/r/{subreddit}/about/edited` | GET | modposts + read | Items edited after initial posting |

### 3.2 Common Parameters

All queue endpoints accept:

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter: `links` (posts only), `comments` (comments only). Omit for both |
| `limit` | int | Number of items per page (max 100) |
| `after` | string | Fullname for forward pagination |
| `before` | string | Fullname for backward pagination |
| `show` | string | Set to `all` to show items even if the user has opted out of receiving reports |

### 3.3 Response Format

Standard Reddit listing. Each item includes standard post/comment fields plus:
- `num_reports` — Number of user reports
- `mod_reports` — Array of mod-initiated reports `[[reason, mod_name], ...]`
- `user_reports` — Array of user reports `[[reason, count], ...]`
- `approved_by` — Username who approved (null if not approved)
- `banned_by` — Username/string who removed (null if not removed, `true` for spam filter)
- `mod_reason_title` — Removal reason title (if set)
- `mod_reason_by` — Moderator who set the removal reason
- `mod_note` — Moderator note associated with removal

**Sources**: [OCaml Reddit API Kernel](https://leviroth.github.io/ocaml-reddit-api/reddit_api_kernel/Reddit_api_kernel/Endpoint/index.html), [PRAW SubredditModeration](https://praw.readthedocs.io/en/stable/code_overview/other/subredditmoderation.html)

---

## 4. Mod Mail (New System)

Reddit's **new modmail** (mod.reddit.com) replaces the legacy PM-based system with a conversation-based threading model.

### 4.1 Core Conversation Endpoints

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/api/mod/conversations` | GET | modmail | `sort`, `state`, `entity`, `limit`, `after` | List conversations |
| `/api/mod/conversations` | POST | modmail | `to`, `subject`, `body`, `srName`, `isAuthorHidden` | Create new conversation |
| `/api/mod/conversations/{id}` | GET | modmail | — | Get conversation details with all messages |
| `/api/mod/conversations/{id}` | POST | modmail | `body`, `isInternal`, `isAuthorHidden` | Reply to conversation |

### 4.2 Conversation Management

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/api/mod/conversations/{id}/archive` | POST | modmail | Archive conversation |
| `/api/mod/conversations/{id}/unarchive` | POST | modmail | Unarchive conversation |
| `/api/mod/conversations/{id}/highlight` | POST | modmail | Highlight (flag for attention) |
| `/api/mod/conversations/{id}/unhighlight` | DELETE | modmail | Remove highlight |
| `/api/mod/conversations/{id}/mute` | POST | modmail | Mute conversation author (default 72h) |
| `/api/mod/conversations/{id}/unmute` | POST | modmail | Unmute author |

### 4.3 Bulk & Status Operations

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/api/mod/conversations/read` | POST | modmail | Mark specific conversations as read (`conversationIds` comma-separated) |
| `/api/mod/conversations/unread` | POST | modmail | Mark as unread |
| `/api/mod/conversations/bulk/read` | POST | modmail | Bulk mark as read. **`entity` is required** — cannot use 'all'; must specify subreddit(s) individually |
| `/api/mod/conversations/unread/count` | GET | modmail | Get unread counts by state |
| `/api/mod/conversations/subreddits` | GET | modmail | List subreddits user moderates (for modmail context) |
| `/api/mod/conversations/{id}/user` | GET | modmail | Get user info for conversation participant |

### 4.4 Filter Parameters for GET `/api/mod/conversations`

| Parameter | Values | Description |
|-----------|--------|-------------|
| `sort` | `recent` (default), `mod`, `user`, `unread` | Sort order |
| `state` | `new`, `inprogress`, `archived`, `all` (default, excludes archived+mod), `mod`, `notifications`, `highlighted` | Filter by state |
| `entity` | Subreddit fullname (t5_xxxxx) | Filter to specific subreddit. Omit for all moderated subs |
| `limit` | int (up to ~1998) | Items per page |
| `after` | string | Pagination cursor |

### 4.5 Conversation State Codes (Internal)

| Code | State |
|------|-------|
| 0 | new |
| 1 | inprogress |
| 2 | archived |

### 4.6 Mod Action Codes (Internal)

| Code | Action |
|------|--------|
| 0 | highlight |
| 1 | un-highlight |
| 2 | archive |
| 3 | un-archive |
| 5 | mute |
| 6 | un-mute |

### 4.7 Key Implementation Notes

- `isInternal: true` creates a **private mod-only** message within the conversation (invisible to the user)
- `isAuthorHidden: true` hides the moderator's identity (shows as subreddit name instead)
- The `to` parameter in POST requires a **display name** (not a fullname)
- Conversations span across all moderated subreddits by default unless `entity` is specified
- **Unread counts** response returns: `{ highlighted, notifications, archived, new, inprogress, mod }`

### 4.8 Legacy Modmail (Deprecated)

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/api/mute_message_author` | POST | modcontributors | Mute author of a legacy modmail message |
| `/api/unmute_message_author` | POST | modcontributors | Unmute author |

These legacy endpoints still work but the new modmail system is strongly preferred.

**Sources**: [Modmail API Tips Gist](https://gist.github.com/leviroth/dafcf1331737e2b55dd6fb86257dcb8d), [PRAW modmail PR #776](https://github.com/praw-dev/praw/pull/776), [Reddit.NET Modmail](https://sirkris.github.io/Reddit.NET/reference/html/class_reddit_1_1_models_1_1_modmail.html)

---

## 5. Ban/Mute Management

Reddit uses a **relationship-based** system through `/api/friend` and `/api/unfriend`.

### 5.1 Adding Relationships (Ban, Mute, Contributor, etc.)

**Endpoint**: `POST /r/{subreddit}/api/friend`
**Scope**: `modcontributors` (for ban/mute/contributor), `modothers` (for moderator)

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | **Required**. Relationship type (see table below) |
| `name` | string | **Required**. Username to act on |
| `duration` | int | Ban duration in days (1-999). Omit for permanent ban |
| `ban_reason` | string | Internal mod-only reason (max 300 chars, not shown to user) |
| `ban_message` | string | Message sent to the banned user |
| `note` | string | Additional mod note |
| `ban_context` | string | Fullname of content that triggered the ban |
| `permissions` | string | For moderator invites: comma-separated permission flags |

### 5.2 Removing Relationships

**Endpoint**: `POST /r/{subreddit}/api/unfriend`
**Scope**: Same as adding

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | **Required**. Relationship type |
| `name` | string | **Required**. Username |

### 5.3 Relationship Types

| Type | Add Scope | Description |
|------|-----------|-------------|
| `banned` | modcontributors | Ban from subreddit |
| `muted` | modcontributors | Mute (cannot send modmail). Duration: 3, 7, 28 days, or permanent |
| `contributor` | modcontributors | Add to approved submitters list |
| `moderator_invite` | modothers | Invite as moderator |
| `moderator` | modothers | Direct add as moderator |
| `wikibanned` | modcontributors + modwiki | Ban from wiki editing |
| `wikicontributor` | modcontributors + modwiki | Approve for wiki editing |

### 5.4 Listing Relationships

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/banned` | GET | modcontributors | List banned users with ban details |
| `/r/{subreddit}/about/muted` | GET | modcontributors | List muted users |
| `/r/{subreddit}/about/contributors` | GET | modcontributors | List approved submitters |
| `/r/{subreddit}/about/moderators` | GET | read | List moderators with permissions |
| `/r/{subreddit}/about/wikibanned` | GET | modcontributors + modwiki | List wiki-banned users |
| `/r/{subreddit}/about/wikicontributors` | GET | modcontributors + modwiki | List wiki contributors |

All listing endpoints accept `limit`, `after`, `before`, and `user` (filter by username) parameters.

### 5.5 Banned User Object (from `/about/banned`)

```json
{
  "name": "username",
  "date": 1679000000.0,
  "note": "Internal mod note",
  "days_left": 14,
  "id": "t2_abc123"
}
```

- `days_left`: null = permanent ban, number = days remaining on temporary ban
- `note`: The ban_reason set by the moderator (mod-only)
- `date`: Unix timestamp when the ban was applied

### 5.6 Moderator Permissions

When inviting/managing moderators, these permission flags apply:

| Permission | Description |
|-----------|-------------|
| `access` | Manage the mod access list |
| `config` | Edit subreddit settings |
| `flair` | Manage user/link flair |
| `mail` | Access modmail |
| `posts` | Manage posts and comments |
| `wiki` | Manage wiki |
| `chat_config` | Manage chat settings |
| `chat_operator` | Moderate chat |

**Endpoint**: `POST /r/{subreddit}/api/setpermissions` — Scope: `modothers`

**Sources**: [Reddit.NET Users](https://sirkris.github.io/Reddit.NET/reference/html/class_reddit_1_1_models_1_1_users.html), [Reddit Help - Banning and Muting](https://support.reddithelp.com/hc/en-us/articles/15484464549524-User-Management-banning-and-muting), [reddit-archive PR #1475](https://github.com/reddit-archive/reddit/pull/1475)

---

## 6. Flair Management

### 6.1 Setting Individual Flair

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/api/flair` | POST | modflair | `name` (username), `text`, `css_class`, `flair_template_id` | Set flair on a specific user |
| `/r/{subreddit}/api/selectflair` | POST | flair | `name` (user), `link` (post fullname), `flair_template_id`, `text`, `background_color`, `text_color` | Apply a flair template (usable by mods or self-service) |
| `/r/{subreddit}/api/deleteflair` | POST | modflair | `name` (username) | Remove a user's flair |

### 6.2 Bulk Flair (CSV)

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/api/flaircsv` | POST | modflair | `flair_csv` (CSV text) | Bulk set user flairs. Format: `username,flair_text,css_class` — up to **100 rows** per request |

### 6.3 Flair Templates

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/api/flairtemplate_v2` | POST | modflair | `flair_template_id` (for edit), `text`, `css_class`, `text_editable` (bool), `allowable_content` (all/emoji/text), `text_color` (dark/light), `background_color`, `mod_only` (bool), `flair_type` (USER_FLAIR/LINK_FLAIR) | Create or update a flair template |
| `/r/{subreddit}/api/flairtemplate` | POST | modflair | (legacy parameters) | Legacy template creation |
| `/r/{subreddit}/api/clearflairtemplates` | POST | modflair | `flair_type` (USER_FLAIR/LINK_FLAIR) | **Delete ALL** templates of a type |
| `/r/{subreddit}/api/deleteflairtemplate` | POST | modflair | `flair_template_id` | Delete a single template |
| `PATCH /api/flair_template_order` | PATCH | modflair | `subreddit`, `flair_type`, `flair_template_id_list` (ordered array) | Reorder flair templates |

### 6.4 Listing Flairs

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/api/flairlist` | GET | modflair | `name` (filter by user), `limit`, `after`, `before` | List all users with flair |
| `/r/{subreddit}/api/link_flair_v2` | GET | flair | — | List all link (post) flair templates |
| `/r/{subreddit}/api/user_flair_v2` | GET | flair | — | List all user flair templates |

### 6.5 Flair Configuration

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/api/flairconfig` | POST | modflair | `flair_enabled`, `flair_position` (left/right), `flair_self_assign_enabled`, `link_flair_position` (left/right/none), `link_flair_self_assign_enabled` | Configure subreddit-wide flair settings |

**Sources**: [JRAW ENDPOINTS.md](https://github.com/mattbdean/JRAW/blob/master/ENDPOINTS.md), [PRAW SubredditFlair](https://praw.readthedocs.io/en/latest/code_overview/other/subredditflair.html)

---

## 7. Subreddit Settings

### 7.1 Read Settings

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/edit` | GET | modconfig | Returns current subreddit configuration. 302 if subreddit doesn't exist, 404 if no permission |

### 7.2 Update Settings

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `POST /api/site_admin` | POST | modconfig | Create or **fully** configure subreddit. **Requires ALL values** on each request — missing fields reset to defaults |
| `PATCH /api/v1/subreddit/update_settings` | PATCH | modconfig | **Partially** update settings. Only send changed key/value pairs. Input: JSON with `sr` (subreddit fullname) + setting pairs. **Preferred method** |

### 7.3 Key Setting Categories

**General**:
- `title` — Subreddit display name
- `public_description` — Short description for search/listings
- `description` — Sidebar content (markdown, old Reddit)
- `submit_text` — Text shown on submission page
- `submission_type` — `any`, `link`, `self`

**Content Controls**:
- `link_type` — `any`, `link`, `self`
- `allow_images` (bool), `allow_videos` (bool), `allow_polls` (bool)
- `spoilers_enabled` (bool), `original_content_tag_enabled` (bool)

**Spam Filter Strength**:
- `spam_links` — `low`, `high`, `all`
- `spam_selfposts` — `low`, `high`, `all`
- `spam_comments` — `low`, `high`, `all`

**Wiki**:
- `wikimode` — `disabled`, `modonly`, `anyone`
- `wiki_edit_karma` — Minimum karma to edit wiki
- `wiki_edit_age` — Minimum account age (days) to edit wiki

**Community Type**:
- `type` — `public`, `private`, `restricted`, `gold_restricted`, `archived`, `employees_only`

**Safety / Crowd Control**:
- `crowd_control_level` — Crowd control strictness for comments
- `crowd_control_mode` — Crowd control mode
- `crowd_control_chat_level` — Crowd control for chat

**Misc**:
- `public_traffic` (bool) — Make traffic stats public
- `free_form_reports` (bool) — Allow custom report reasons
- `restrict_posting` (bool), `restrict_commenting` (bool)
- `key_color` — Theme color hex
- `header_hover_text` — Header mouseover text

### 7.4 Subreddit About / Info

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about` | GET | read | Public subreddit info (subscribers, description, etc.) |
| `/api/v1/{subreddit}/post_requirements` | GET | submit | Moderator-designated posting requirements |
| `/r/{subreddit}/api/submit_text` | GET | submit | Get the submission form text set by mods |

**Sources**: [Pyprohly reddit-api-doc-notes](https://github.com/Pyprohly/reddit-api-doc-notes/blob/main/docs/api-reference/subreddit.rst)

---

## 8. Traffic Stats

### 8.1 Endpoint

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/traffic` | GET | modconfig | Get subreddit traffic statistics |

### 8.2 Response Structure

```json
{
  "day": [
    [1679270400, 1234, 5678, 42]
  ],
  "hour": [
    [1679270400, 234, 890]
  ],
  "month": [
    [1677628800, 45000, 120000]
  ]
}
```

| Key | Entry Format | Description |
|-----|-------------|-------------|
| `day` | `[timestamp, uniques, pageviews, subscriptions]` | Daily stats |
| `hour` | `[timestamp, uniques, pageviews]` | Hourly stats |
| `month` | `[timestamp, uniques, pageviews]` | Monthly stats |

- Timestamps are Unix epoch (start of period)
- **Access restriction**: Returns 404 if traffic is not public AND the user is not a moderator
- Data is typically available for ~90 days of history

**Sources**: [PRAW Subreddit.traffic()](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)

---

## 9. Mod Log

### 9.1 Endpoint

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/r/{subreddit}/about/log` | GET | modlog | `action`, `mod`, `limit`, `after`, `before` | Retrieve moderation log entries |

**Data retention**: 90 days.

### 9.2 Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Filter by action type (see complete list below) |
| `mod` | string | Filter by moderator username |
| `limit` | int | Results per page (max 500) |
| `after`/`before` | string | Pagination |

### 9.3 Complete Mod Log Action Types (43+)

From the [Reddit source code (modaction.py)](https://github.com/reddit-archive/reddit/blob/master/r2/r2/models/modaction.py):

**Content Actions (15)**:

| Action | Description |
|--------|-------------|
| `removelink` | Remove a post |
| `approvelink` | Approve a post |
| `removecomment` | Remove a comment |
| `approvecomment` | Approve a comment |
| `marknsfw` | Mark post as NSFW |
| `distinguish` | Add/remove mod distinction |
| `sticky` | Sticky a post |
| `unsticky` | Unsticky a post |
| `lock` | Lock post/comment |
| `unlock` | Unlock post/comment |
| `setcontestmode` | Enable contest mode |
| `unsetcontestmode` | Disable contest mode |
| `setsuggestedsort` | Set suggested sort |
| `ignorereports` | Ignore reports |
| `unignorereports` | Unignore reports |

**User Management (8)**:

| Action | Description |
|--------|-------------|
| `banuser` | Ban a user |
| `unbanuser` | Unban a user |
| `muteuser` | Mute a user |
| `unmuteuser` | Unmute a user |
| `addcontributor` | Add approved submitter |
| `removecontributor` | Remove approved submitter |
| `setpermissions` | Change mod permissions |
| `editflair` | Edit user/link flair |

**Moderator Management (5)**:

| Action | Description |
|--------|-------------|
| `addmoderator` | Add moderator |
| `removemoderator` | Remove moderator |
| `invitemoderator` | Invite moderator |
| `uninvitemoderator` | Uninvite moderator |
| `acceptmoderatorinvite` | Accept invite |

**Settings (1)**:

| Action | Description |
|--------|-------------|
| `editsettings` | Edit subreddit settings |

**Wiki (7)**:

| Action | Description |
|--------|-------------|
| `wikirevise` | Edit a wiki page |
| `wikibanned` | Ban user from wiki |
| `wikiunbanned` | Unban user from wiki |
| `wikicontributor` | Add wiki contributor |
| `removewikicontributor` | Remove wiki contributor |
| `wikipagelisted` | Delist/relist wiki page |
| `wikipermlevel` | Change wiki page permissions |

**Rules (3)**:

| Action | Description |
|--------|-------------|
| `createrule` | Create subreddit rule |
| `editrule` | Edit subreddit rule |
| `deleterule` | Delete subreddit rule |

**Likely Additional Actions** (post-archive, unconfirmed exact strings):
- `spamlink` / `spamcomment` — Mark as spam
- `snooze_reports` / `unsnooze_reports` — Report snoozing
- `addnote` / `deletenote` — Mod notes
- `create_scheduled_post` / `edit_scheduled_post` / `delete_scheduled_post`
- `addremovalreason`

### 9.4 Mod Log Entry Object

```json
{
  "action": "banuser",
  "created_utc": 1679000000.0,
  "description": "",
  "details": "permanent",
  "id": "ModAction_abc123",
  "mod": "mod_username",
  "mod_id36": "abc123",
  "sr_id36": "def456",
  "subreddit": "test",
  "target_author": "banned_user",
  "target_body": "",
  "target_fullname": "t2_xyz789",
  "target_permalink": "",
  "target_title": ""
}
```

**Sources**: [reddit-archive modaction.py](https://github.com/reddit-archive/reddit/blob/master/r2/r2/models/modaction.py), [Reddit Help - Moderation Log](https://support.reddithelp.com/hc/en-us/articles/15484543117460-Moderation-Log)

---

## 10. User Notes / Mod Notes

### 10.1 Native Mod Notes API

Reddit now has a **first-party Mod Notes system** (replacing the community-built Toolbox usernotes stored in wiki pages).

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/api/mod/notes` | GET | modnote | `subreddit`, `user`, `filter` (by label), `before` | Read notes for a user |
| `/api/mod/notes` | POST | modnote | `subreddit`, `user`, `note` (text), `label`, `reddit_id` (optional: fullname of linked content) | Create a mod note |
| `/api/mod/notes` | DELETE | modnote | `subreddit`, `user`, `note_id` | Delete a specific note |
| `/api/mod/notes/recent` | GET | modnote | `subreddit`, `users` (comma-separated) | Bulk read — returns **most recent note** per user |

### 10.2 Note Labels

| Label | Typical Use |
|-------|-------------|
| `BOT_BAN` | Bot account banned |
| `PERMA_BAN` | Permanently banned |
| `BAN` | Temporarily banned |
| `ABUSE_WARNING` | Warned for abusive behavior |
| `SPAM_WARNING` | Warned for spam |
| `SPAM_WATCH` | Being watched for spam patterns |
| `SOLID_CONTRIBUTOR` | Reliable community member |
| `HELPFUL_USER` | Helpful contributor |
| `None` / omitted | No label — plain note |

### 10.3 Constraints

- **Text limit**: 250 characters per note
- **Note limit**: 1,000 notes per user per subreddit
- **Rate limit**: 30 requests/minute (separate from the standard 100 QPM)
- **Permission**: Requires "Manage Users" moderator permission
- **Auto-generated**: Certain mod actions (bans, etc.) automatically create a note entry

### 10.4 Legacy Toolbox User Notes

Before native mod notes, the community-built [Moderator Toolbox](https://www.reddit.com/r/toolbox/) stored notes in a subreddit wiki page (`/r/{subreddit}/wiki/usernotes`). This data is compressed JSON and can be read via wiki endpoints. A [migration tool](https://github.com/fsvreddit/toolboxnotesxfer) exists to transfer Toolbox notes to native mod notes.

**Important for MCP**: The native mod notes API is preferred. Toolbox notes support could be a bonus feature for subreddits that haven't migrated.

**Sources**: [Reddit Help - Mod Notes](https://support.reddithelp.com/hc/en-us/articles/15484640563860-Mod-Notes-and-User-Mod-Log), [PRAW SubredditModNotes](https://praw.readthedocs.io/en/stable/code_overview/other/subreddit_mod_notes.html), [Toolbox usernotes transfer](https://github.com/fsvreddit/toolboxnotesxfer)

---

## 11. Removal Reasons

Pre-configured messages sent to users when their content is removed.

### 11.1 Endpoints

| Endpoint | Method | Scope | Parameters | Description |
|----------|--------|-------|------------|-------------|
| `/api/v1/{subreddit}/removal_reasons` | GET | modconfig | — | List all removal reasons (returns `data` + `order` array) |
| `/api/v1/{subreddit}/removal_reasons` | POST | modconfig | `title`, `message` | Create a new removal reason |
| `/api/v1/{subreddit}/removal_reasons/{id}` | PUT | modconfig | `title`, `message` | Update a removal reason |
| `/api/v1/{subreddit}/removal_reasons/{id}` | DELETE | modconfig | — | Delete a removal reason |

### 11.2 Response Format

```json
{
  "data": {
    "reason_id_1": {
      "id": "reason_id_1",
      "title": "Rule 1: No Spam",
      "message": "Your post was removed because it violates Rule 1."
    }
  },
  "order": ["reason_id_1"]
}
```

### 11.3 Historical Note

This endpoint was **historically undocumented** but is now accessible at `https://oauth.reddit.com/api/v1/{subreddit}/removal_reasons.json`. It became more widely known through community research.

**Sources**: [PRAW Issue #1047](https://github.com/praw-dev/praw/issues/1047), [Toolbox Issue #97](https://github.com/toolbox-team/reddit-moderator-toolbox/issues/97)

---

## 12. Scheduled Posts

### 12.1 API Status: NOT AVAILABLE

**There is no public API endpoint for creating, editing, or listing scheduled/recurring posts.** This feature is **web-only**.

### 12.2 Web UI Capabilities (For Reference)

- Schedule posts for future publication
- Recurrence: Hourly, Daily, Weekly, Monthly, Custom intervals
- Requires "Manage Posts & Comments" permission
- Can view, edit, delete scheduled posts from mod tools panel

### 12.3 Bot-Based Workarounds

Developers implement scheduling externally:
1. External scheduler (cron, cloud scheduler)
2. `POST /api/submit` at target time
3. Optionally `POST /api/set_subreddit_sticky` to pin
4. Track state in external database or wiki page

**Sources**: [Scheduled and Recurring Posts - Reddit Help](https://support.reddithelp.com/hc/en-us/articles/15484443169556-Scheduled-and-Recurring-Posts)

---

## 13. Bot-Specific Concerns

### 13.1 API Access Requirements (2025+)

- **Pre-approval required**: All new OAuth apps need manual Reddit review
- **Mod bots get favorable treatment**: Explicitly supported use case
- **Free tier**: 100 queries per minute, averaged over 10-minute window

### 13.2 Rate Limits

| Category | Limit | Notes |
|----------|-------|-------|
| Standard OAuth | 100 QPM | Averaged over 10-minute sliding window |
| Mod notes | 30 QPM | Separate rate limit |
| Pre-2023 legacy | 60 QPM | Historical baseline |

### 13.3 Required User-Agent

```
<platform>:<app_id>:<version> (by /u/<reddit_username>)
```
Example: `python:com.example.mymodbot:v1.2.3 (by /u/modbot_account)`

### 13.4 Bot Account Considerations

- Bot accounts are regular Reddit accounts — no special account type
- Should be clearly identified as bots (username, profile description)
- `u/AutoModerator` is Reddit-internal — external bots cannot replicate its privileged behavior
- Bots need mod status with appropriate permissions per subreddit
- Each subreddit independently grants permissions

### 13.5 Responsible Builder Policy

- Purpose and scope must be clearly specified
- Only access needed subreddits and actions
- Minimize data fetched; keep caches short-lived
- Request only necessary OAuth permissions
- Avoid bulk historical pulls without moderation justification

### 13.6 AutoModerator vs. External Bots

| Aspect | AutoModerator | External Bot |
|--------|--------------|-------------|
| Execution | Internal, real-time | Polling-based |
| Rate limits | None (internal) | 100 QPM |
| Logic | YAML rules only | Arbitrary code (ML, API calls, etc.) |
| Config | Wiki page | External configuration |
| Best for | Simple pattern matching | Complex logic, cross-sub coordination |

External bots complement AutoMod for complex use cases.

**Sources**: [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy), [OAuth2 Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)

---

## 14. Crowd Control & Safety

### 14.1 Crowd Control

Crowd Control manages influxes of comments from non-community members.

**How it works**:
- Automatically collapses or filters comments from non-trusted users
- Trust based on membership history, subreddit karma, account attributes
- Comments: collapsed (visible behind click) or sent to modqueue
- Posts: filtered into modqueue for review

**Configuration levels**:

| Level | Description |
|-------|-------------|
| Off | Disabled |
| Lenient | Only users with very negative subreddit karma |
| Moderate | New/non-members with low subreddit karma |
| Strict | All non-members of the community |

**Applies to**: Comments (global), Posts (global), Chat rooms (separate setting)

**Per-post override**: Moderators can set crowd control level on individual posts.

### 14.2 API Access for Crowd Control

**Subreddit-level** (via subreddit settings):
- `crowd_control_level` — Read/write via `GET /r/{sub}/about/edit` and `PATCH /api/v1/subreddit/update_settings`
- `crowd_control_mode` — Mode configuration
- `crowd_control_chat_level` — Chat-specific level

**Post-level**: Available via PRAW's `update_crowd_control_level()` method (underlying endpoint exists but not well-documented).

### 14.3 Safety Filters

Reddit provides additional safety filters. These are **NOT configurable via API** — they are internal Reddit systems:

| Filter | Description | API Access |
|--------|-------------|:----------:|
| **Ban Evasion** | Filters content from suspected ban evaders | No |
| **Reputation** | Filters content from potential spammers | No |
| **Harassment** | Filters likely harassing comments | No |
| **Mature Content** | Filters sexual/graphic visual content | No |

### 14.4 Content Restriction Workarounds

While safety filters aren't API-accessible, moderators can achieve similar restrictions via:
- **AutoModerator rules**: Account age, karma requirements, keyword filtering
- **Subreddit settings**: `spam_links`/`spam_selfposts`/`spam_comments` filter strength
- **Subreddit type**: Private/restricted for access control
- **Post requirements**: Title/body restrictions, flair requirements

**Sources**: [Crowd Control - Reddit Help](https://support.reddithelp.com/hc/en-us/articles/15484545006996-Crowd-Control), [Safety Filters - Reddit Help](https://support.reddithelp.com/hc/en-us/articles/15484574845460-Safety), [PRAW Changelog](https://praw.readthedocs.io/en/stable/package_info/change_log.html)

---

## 15. Additional Mod Endpoints

### 15.1 Subreddit Rules (CRUD)

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/rules` | GET | read | Get all rules |
| `/r/{subreddit}/api/add_subreddit_rule` | POST | modconfig | Create rule |
| `/r/{subreddit}/api/remove_subreddit_rule` | POST | modconfig | Delete rule |
| `/r/{subreddit}/api/update_subreddit_rule` | POST | modconfig | Update rule |
| `/r/{subreddit}/api/reorder_subreddit_rules` | POST | modconfig | Reorder rules |

### 15.2 Wiki Management

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/wiki/{page}` | GET | wikiread | Read wiki page |
| `/r/{subreddit}/api/wiki/edit` | POST | wikiedit | Edit/create wiki page |
| `/r/{subreddit}/wiki/pages` | GET | wikiread | List all wiki pages |
| `/r/{subreddit}/wiki/revisions/{page}` | GET | wikiread | Page revision history |
| `/r/{subreddit}/api/wiki/revert` | POST | modwiki | Revert to revision |
| `/r/{subreddit}/api/wiki/hide` | POST | modwiki | Toggle revision visibility |
| `/r/{subreddit}/api/wiki/alloweditor/add` | POST | modwiki | Add page editor |
| `/r/{subreddit}/api/wiki/alloweditor/del` | POST | modwiki | Remove page editor |
| `/r/{subreddit}/wiki/settings/{page}` | GET/POST | modwiki | Get/update page permissions (`permlevel`: 0=default, 1=approved editors, 2=mods only) |

### 15.3 Custom Emojis

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/api/v1/{subreddit}/emojis/all` | GET | read | List all custom emojis |
| `/api/v1/{subreddit}/emoji.json` | POST | modconfig | Create emoji |
| `/api/v1/{subreddit}/emoji/{name}` | DELETE | modconfig | Delete emoji |
| `/api/v1/{subreddit}/emoji/{name}` | PUT | modconfig | Update emoji properties |

### 15.4 Collections

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/api/v1/collections/collection` | GET | read | Get a collection |
| `/api/v1/collections/subreddit_collections` | GET | read | List all collections |
| `/api/v1/collections/create_collection` | POST | modposts | Create collection |
| `/api/v1/collections/delete_collection` | POST | modposts | Delete collection |
| `/api/v1/collections/add_post_to_collection` | POST | modposts | Add post |
| `/api/v1/collections/remove_post_in_collection` | POST | modposts | Remove post |
| `/api/v1/collections/reorder_collection` | POST | modposts | Reorder posts |
| `/api/v1/collections/update_collection_title` | POST | modposts | Update title |
| `/api/v1/collections/update_collection_description` | POST | modposts | Update description |
| `/api/v1/collections/update_collection_display_layout` | POST | modposts | Set layout (TIMELINE/GALLERY) |

### 15.5 Stylesheet (Old Reddit)

| Endpoint | Method | Scope | Description |
|----------|--------|-------|-------------|
| `/r/{subreddit}/about/stylesheet` | GET | modconfig | Get stylesheet |
| `/r/{subreddit}/api/subreddit_stylesheet` | POST | modconfig | Update stylesheet |
| `/r/{subreddit}/api/upload_sr_img` | POST | modconfig | Upload image |
| `/r/{subreddit}/api/delete_sr_img` | POST | modconfig | Delete image |

---

## 16. OAuth Scopes Reference

| Scope | Description | Used For |
|-------|-------------|----------|
| `modposts` | Approve, remove, mark NSFW, distinguish | Content moderation, queues, collections |
| `modconfig` | Configuration, sidebar, CSS | Settings, rules, removal reasons, emojis, traffic |
| `modflair` | Manage and assign flair | User flair, link flair, templates |
| `modlog` | Access moderation log | Mod log reading |
| `modcontributors` | Manage users (ban, mute, contributor) | User management |
| `modmail` | Access new modmail | Conversations, messages |
| `modwiki` | Manage wiki pages | Wiki permissions, reverts, editors |
| `modself` | Accept/leave mod invitations | Self-management |
| `modothers` | Manage other moderators | Invite, remove, permissions |
| `modnote` | Mod notes CRUD | Create, read, delete notes |
| `flair` | Select flair | Self-service flair |
| `wikiedit` | Edit wiki pages | Wiki content (incl. AutoMod) |
| `wikiread` | Read wiki pages | Wiki reading |
| `read` | Public content access | Rules, about, etc. |

---

## 17. Capability Matrix

| Feature | API | Web Only | Notes |
|---------|:---:|:--------:|-------|
| Approve/Remove content | Yes | — | modposts |
| Ban/Unban/Mute/Unmute | Yes | — | modcontributors |
| Mod queue/reports/spam | Yes | — | modposts + read |
| Flair management (full) | Yes | — | modflair |
| Mod log (90 days) | Yes | — | modlog |
| Mod notes (CRUD) | Yes | — | modnote |
| New modmail (full) | Yes | — | modmail |
| Subreddit settings | Yes | — | modconfig |
| Traffic stats | Yes | — | modconfig |
| Wiki/AutoMod config | Yes | — | wikiedit + modwiki |
| Rules (CRUD) | Yes | — | modconfig |
| Removal reasons (CRUD) | Yes | — | modconfig |
| Emojis | Yes | — | modconfig |
| Collections | Yes | — | modposts |
| Crowd control (sub-level) | Yes | — | modconfig |
| Crowd control (per-post) | Yes | — | modposts |
| Lock/Unlock/Distinguish/Sticky | Yes | — | modposts |
| **Scheduled/Recurring posts** | **No** | **Yes** | No API endpoint |
| **Full Mod Insights** | **No** | **Yes** | Only traffic via API |
| **Chat moderation** | **No** | **Yes** | No public API |
| **Ban evasion filter** | **No** | **Yes** | Internal system |
| **Safety filters** | **No** | **Yes** | Internal system |

---

## 18. Devvit Developer Platform

### 18.1 Overview

- **Language**: TypeScript | **Runtime**: Reddit-hosted | **Storage**: Redis
- **Status**: Beta (March 2026)
- Event-driven triggers: `PostSubmit`, `PostReport`, `CommentReport`, `ModAction`, `PostCreate`, `PostUpdate`, `PostDelete`, etc.
- Scheduler: `Devvit.addSchedulerJob()` for recurring tasks
- Menu Items: Custom buttons in post/comment context menus
- Settings: Per-community configuration UI

### 18.2 Relevance to MCP

An MCP server uses the traditional API, not Devvit. But Devvit shows Reddit's strategic direction (event-driven mod tools).

**Sources**: [Devvit GitHub](https://github.com/reddit/devvit), [Reddit Developer Funds 2026](https://support.reddithelp.com/hc/en-us/articles/27958169342996-Reddit-Developer-Funds-2026-Terms)

---

## 19. MCP Server Implementation Recommendations

### Tier 1 — Core Moderation (Must Have)

| Tool | Endpoints | Priority |
|------|----------|----------|
| `approve_content` | POST /api/approve | Critical |
| `remove_content` | POST /api/remove | Critical |
| `get_modqueue` | GET /r/{sub}/about/modqueue | Critical |
| `get_reports` | GET /r/{sub}/about/reports | Critical |
| `ban_user` / `unban_user` | POST /r/{sub}/api/friend + unfriend | Critical |
| `mute_user` / `unmute_user` | POST /r/{sub}/api/friend + unfriend | Critical |
| `get_mod_log` | GET /r/{sub}/about/log | Critical |
| `lock_post` / `unlock_post` | POST /api/lock + unlock | High |
| `distinguish` | POST /api/distinguish | High |
| `sticky_post` | POST /api/set_subreddit_sticky | High |

### Tier 2 — Communication & Notes (Should Have)

| Tool | Endpoints | Priority |
|------|----------|----------|
| `list_modmail` | GET /api/mod/conversations | High |
| `read_modmail` | GET /api/mod/conversations/{id} | High |
| `reply_modmail` | POST /api/mod/conversations/{id} | High |
| `create_mod_note` | POST /api/mod/notes | High |
| `get_mod_notes` | GET /api/mod/notes | High |
| `get_removal_reasons` | GET /api/v1/{sub}/removal_reasons | Medium |

### Tier 3 — Configuration (Nice to Have)

| Tool | Endpoints | Priority |
|------|----------|----------|
| `manage_flair` | Various /api/flair* | Medium |
| `manage_rules` | Various /api/*_subreddit_rule | Medium |
| `get_subreddit_settings` | GET /r/{sub}/about/edit | Medium |
| `update_settings` | PATCH /api/v1/subreddit/update_settings | Medium |
| `get_traffic` | GET /r/{sub}/about/traffic | Medium |
| `manage_wiki` | Various /wiki/* | Low |

---

## 20. Sources

### Official Reddit
1. [OAuth2 - Reddit Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)
2. [Reddit Help - Moderation Log](https://support.reddithelp.com/hc/en-us/articles/15484543117460-Moderation-Log)
3. [Reddit Help - Mod Notes](https://support.reddithelp.com/hc/en-us/articles/15484640563860-Mod-Notes-and-User-Mod-Log)
4. [Reddit Help - Scheduled Posts](https://support.reddithelp.com/hc/en-us/articles/15484443169556-Scheduled-and-Recurring-Posts)
5. [Reddit Help - AutoModerator](https://support.reddithelp.com/hc/en-us/articles/15484574206484-Automoderator)
6. [Reddit Help - Crowd Control](https://support.reddithelp.com/hc/en-us/articles/15484545006996-Crowd-Control)
7. [Reddit Help - Safety Filters](https://support.reddithelp.com/hc/en-us/articles/15484574845460-Safety)
8. [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)
9. [Developer Platform](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data)
10. [Devvit GitHub](https://github.com/reddit/devvit)

### Community Documentation
11. [reddit-archive modaction.py](https://github.com/reddit-archive/reddit/blob/master/r2/r2/models/modaction.py) — 43 mod log action types
12. [Pyprohly reddit-api-doc-notes](https://github.com/Pyprohly/reddit-api-doc-notes/blob/main/docs/api-reference/subreddit.rst)
13. [JRAW ENDPOINTS.md](https://github.com/mattbdean/JRAW/blob/master/ENDPOINTS.md) — 182 endpoints catalog
14. [OCaml Reddit API Kernel](https://leviroth.github.io/ocaml-reddit-api/reddit_api_kernel/Reddit_api_kernel/Endpoint/index.html)
15. [Modmail API Tips Gist](https://gist.github.com/leviroth/dafcf1331737e2b55dd6fb86257dcb8d)
16. [ContextMod Mod Actions](https://contextmod.dev/subreddit-configuration/in-depth/modActions/)
17. [Reddit.NET Users Class](https://sirkris.github.io/Reddit.NET/reference/html/class_reddit_1_1_models_1_1_users.html)
18. [PRAW Issue #1047 - Removal Reasons](https://github.com/praw-dev/praw/issues/1047)
19. [Toolbox usernotes transfer](https://github.com/fsvreddit/toolboxnotesxfer)

### PRAW Documentation
20. [SubredditModeration](https://praw.readthedocs.io/en/stable/code_overview/other/subredditmoderation.html)
21. [SubredditFlair](https://praw.readthedocs.io/en/latest/code_overview/other/subredditflair.html)
22. [SubredditModNotes](https://praw.readthedocs.io/en/stable/code_overview/other/subreddit_mod_notes.html)
23. [WikiPage](https://praw.readthedocs.io/en/latest/code_overview/models/wikipage.html)
24. [Subreddit](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)
25. [Emoji](https://praw.readthedocs.io/en/latest/code_overview/other/emoji.html)
