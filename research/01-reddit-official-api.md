---
title: Reddit Official API — Comprehensive Reference
date: 2026-03-27
tags: [reddit, api, oauth2, endpoints, rate-limits, authentication]
status: completed
confidence: high
---

# Reddit Official API — Comprehensive Reference

## Executive Summary

Reddit's official API provides comprehensive programmatic access to all Reddit functionality: reading and writing posts/comments, managing subreddits, moderation, private messaging, wiki management, flair, search, multireddits, collections, and user account management. All API access requires OAuth2 authentication through `https://oauth.reddit.com`. The API uses a JSON-based "thing" object model with typed prefixes (t1-t6) and supports pagination through listing structures. Rate limits are 60 requests/minute for authenticated clients (100 QPM per some sources) with explicit rate-limit headers. As of 2025-2026, Reddit requires pre-approval for new API applications and has tiered pricing for commercial use.

---

## 1. Authentication & OAuth2

### 1.1 Application Types

Register apps at: `https://www.reddit.com/prefs/apps`

| Type              | Description                                           | Keeps Secret? | Auth Flows                                            |
| ----------------- | ----------------------------------------------------- | ------------- | ----------------------------------------------------- |
| **Web App**       | Server-controlled backend with secret capability      | Yes           | Authorization Code, Client Credentials, Refresh Token |
| **Installed App** | User-device apps (mobile, desktop) — non-confidential | No            | Implicit Grant, Installed Client Grant                |
| **Script App**    | Personal single-account automation, simplest setup    | Yes           | Password Grant (username/password directly)           |

**Sources:**

- [OAuth2 App Types — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/oauth2-app-types)
- [OAuth2 — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)

### 1.2 OAuth2 Grant Flows

#### Authorization Code Flow (Web Apps & Script Apps)

**Step 1 — Redirect user to authorize:**

```
GET https://www.reddit.com/api/v1/authorize
  ?client_id=CLIENT_ID
  &response_type=code
  &state=RANDOM_STRING
  &redirect_uri=REDIRECT_URI
  &duration=permanent|temporary
  &scope=SPACE_SEPARATED_SCOPES
```

**Step 2 — Exchange code for token:**

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=CODE&redirect_uri=REDIRECT_URI
```

**Response:**

```json
{
  "access_token": "TOKEN",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "identity edit ...",
  "refresh_token": "REFRESH_TOKEN"
}
```

#### Implicit Grant Flow (Installed Apps Only)

```
GET https://www.reddit.com/api/v1/authorize
  ?client_id=CLIENT_ID
  &response_type=token
  &state=RANDOM_STRING
  &redirect_uri=REDIRECT_URI
  &scope=SCOPES
```

Token returned in URL fragment: `#access_token=TOKEN&token_type=bearer&expires_in=3600&scope=SCOPES&state=STATE`

- No `duration` parameter (temporary only)
- No backend exchange required

#### Client Credentials Flow (Application-Only, Confidential Clients)

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)

grant_type=client_credentials
```

Returns app-only context (no user). Useful for read-only public data.

#### Installed Client Grant (Non-Confidential Apps)

```
POST https://www.reddit.com/api/v1/access_token

grant_type=https://oauth.reddit.com/grants/installed_client
&device_id=UNIQUE_DEVICE_ID
```

- `device_id`: 20-30 char unique identifier per device
- Use `DO_NOT_TRACK_THIS_DEVICE` for anonymous access

#### Password Grant (Script Apps Only)

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)

grant_type=password&username=USERNAME&password=PASSWORD
```

Simplest flow — no browser redirect. Single-account only.

### 1.3 Token Management

| Operation                 | Details                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- | -------------- |
| **Access Token Lifetime** | 3600 seconds (1 hour)                                                           |
| **Refresh Token**         | Only with `duration=permanent`; persistent                                      |
| **Authorization Code**    | One-time use, expires immediately after exchange                                |
| **Token Refresh**         | `POST /api/v1/access_token` with `grant_type=refresh_token&refresh_token=TOKEN` |
| **Token Revocation**      | `POST /api/v1/revoke_token` with `token=TOKEN&token_type_hint=access_token      | refresh_token` |

**Revoking a refresh token also revokes all associated access tokens.**

### 1.4 OAuth2 Scopes — Full Reference

| Scope              | Description                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- |
| `identity`         | Access my reddit username and signup date                                             |
| `edit`             | Edit and delete my comments and submissions                                           |
| `flair`            | Select my subreddit flair, change link flair on my submissions                        |
| `history`          | Access my voting history and comments/submissions I've saved or hidden                |
| `modconfig`        | Manage the configuration, sidebar, and CSS of subreddits I moderate                   |
| `modcontributors`  | Add/remove users to approved submitter lists; ban/unban/mute/unmute users             |
| `modflair`         | Manage and assign flair in subreddits I moderate                                      |
| `modlog`           | Access the moderation log in subreddits I moderate                                    |
| `modmail`          | Access and manage modmail via mod.reddit.com                                          |
| `modposts`         | Approve, remove, mark NSFW, and distinguish content in subreddits I moderate          |
| `modself`          | Accept invitations to moderate; remove myself as mod/contributor                      |
| `modtraffic`       | Access traffic stats in subreddits I moderate                                         |
| `modwiki`          | Change editors and permissions of wiki pages in subreddits I moderate                 |
| `mysubreddits`     | Access the list of subreddits I moderate, contribute to, and subscribe to             |
| `privatemessages`  | Access my inbox and send private messages to other users                              |
| `read`             | Access posts, comments, and listings (public and private subreddits I have access to) |
| `report`           | Report content for rules violations                                                   |
| `save`             | Save and unsave comments and submissions                                              |
| `structuredstyles` | Edit structured styles for subreddits I moderate                                      |
| `submit`           | Submit links and comments from my account                                             |
| `subscribe`        | Manage my subreddit subscriptions; subscribe/unsubscribe                              |
| `vote`             | Submit and change my votes on comments and submissions                                |
| `wikiedit`         | Edit wiki pages on my behalf                                                          |
| `wikiread`         | Read wiki pages through my account                                                    |

**Full scope reference endpoint:** `https://www.reddit.com/api/v1/scopes`
**Scope-to-endpoint mapping:** `https://www.reddit.com/dev/api/oauth`

**Sources:**

- [OAuth2 — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [OAuth2 Quick Start Example](https://github.com/reddit-archive/reddit/wiki/OAuth2-Quick-Start-Example)
- [PRAW Authentication Guide](https://praw.readthedocs.io/en/stable/getting_started/authentication.html)

### 1.5 Making Authenticated Requests

**All API requests must go to `https://oauth.reddit.com`** (NOT www.reddit.com).

Required headers:

```
Authorization: bearer ACCESS_TOKEN
User-Agent: platform:app_id:version (by /u/reddit_username)
```

### 1.6 API Access & Registration (2025-2026 Policy)

- **Self-service API access has been removed.** You must submit a request and wait for approval.
- **Personal/research projects**: Approval typically takes a few days.
- **Commercial use**: May take weeks; may be denied.
- **Mod bots**: Continue to have free access.
- **Accessibility apps** (e.g., RedReader, Dystopia): Free access maintained.

**Sources:**

- [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [Reddit API Pre-Approval 2025](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown)
- [How to Get Reddit API Credentials in 2025](https://www.wappkit.com/blog/reddit-api-credentials-guide-2025)

---

## 2. Data Model — Things, Fullnames, and Listings

### 2.1 Thing Types

Every Reddit object is a "thing" with a base structure:

```json
{
  "kind": "t3",
  "data": { ... }
}
```

| Kind      | Type                   | Example Fullname  |
| --------- | ---------------------- | ----------------- |
| `t1`      | Comment                | `t1_abc123`       |
| `t2`      | Account/User           | `t2_def456`       |
| `t3`      | Link/Post/Submission   | `t3_ghi789`       |
| `t4`      | Message                | `t4_jkl012`       |
| `t5`      | Subreddit              | `t5_mno345`       |
| `t6`      | Award                  | `t6_pqr678`       |
| `Listing` | Paginated collection   | N/A (no fullname) |
| `more`    | Collapsed comment stub | N/A               |

**Fullname format:** `{kind_prefix}_{id36}` where `id36` is a base-36 encoded identifier.

### 2.2 Listing Structure (Pagination)

```json
{
  "kind": "Listing",
  "data": {
    "modhash": "csrf_token_string",
    "dist": 25,
    "children": [ { "kind": "t3", "data": {...} }, ... ],
    "after": "t3_abc123",
    "before": null
  }
}
```

| Field      | Description                                                                        |
| ---------- | ---------------------------------------------------------------------------------- |
| `after`    | Fullname of the item after the last item in this page (use for forward pagination) |
| `before`   | Fullname of the item before the first item (use for backward pagination)           |
| `dist`     | Number of items returned                                                           |
| `modhash`  | CSRF prevention token                                                              |
| `children` | Array of thing objects                                                             |

**Pagination parameters:** `?after=FULLNAME&limit=25&count=25`

- `limit`: Max 100 items per request
- `after`/`before`: Cannot be used together

### 2.3 Shared Traits

**Votable** (Comments & Posts): `ups`, `downs`, `likes` (true=upvoted, false=downvoted, null=no vote)

**Created**: `created` (epoch local), `created_utc` (epoch UTC)

### 2.4 "more" Object (Collapsed Comments)

```json
{
  "kind": "more",
  "data": {
    "children": ["comment_id_1", "comment_id_2", ...],
    "count": 42,
    "parent_id": "t1_parent_id"
  }
}
```

Requires separate API call to expand (via `GET /api/morechildren`).

**Sources:**

- [Reddit JSON Wiki](https://github.com/reddit-archive/reddit/wiki/json)
- [Reddit API JSON Documentation — JC Chouinard](https://www.jcchouinard.com/documentation-on-reddit-apis-json/)
- [PRAW Glossary](https://praw.readthedocs.io/en/stable/package_info/glossary.html)

---

## 3. API Endpoints — Complete Reference

### 3.1 Account / Identity

| Method | Endpoint              | Scope          | Description                       |
| ------ | --------------------- | -------------- | --------------------------------- |
| GET    | `/api/v1/me`          | `identity`     | Authenticated user's account info |
| GET    | `/api/v1/me/karma`    | `mysubreddits` | Karma breakdown by subreddit      |
| GET    | `/api/v1/me/prefs`    | `identity`     | User preferences                  |
| PATCH  | `/api/v1/me/prefs`    | `account`      | Update user preferences           |
| GET    | `/api/v1/me/trophies` | `identity`     | User's trophies                   |
| GET    | `/api/v1/me/friends`  | `mysubreddits` | Friends list                      |

### 3.2 Subreddits

| Method | Endpoint                                | Scope          | Description                                                                 |
| ------ | --------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| GET    | `/r/{subreddit}/about`                  | `read`         | Subreddit info (kind: t5)                                                   |
| GET    | `/r/{subreddit}/about/edit`             | `modconfig`    | Subreddit settings                                                          |
| POST   | `/api/site_admin`                       | `modconfig`    | Create or configure subreddit                                               |
| PATCH  | `/api/v1/subreddit/update_settings`     | `modconfig`    | Update subreddit settings (JSON body)                                       |
| GET    | `/r/{subreddit}/about/rules`            | `read`         | Subreddit rules                                                             |
| GET    | `/api/v1/{subreddit}/post_requirements` | `submit`       | Post requirements (title limits, blacklisted strings, flair required, etc.) |
| GET    | `/r/{subreddit}/api/submit_text`        | `submit`       | Submission text/guidelines                                                  |
| POST   | `/api/subscribe`                        | `subscribe`    | Subscribe/unsubscribe (action: `sub`/`unsub`)                               |
| GET    | `/api/similar_subreddits`               | any            | Find similar subreddits                                                     |
| GET    | `/subreddits/search`                    | `read`         | Search subreddits by name/description                                       |
| GET    | `/api/search_reddit_names`              | `read`         | Autocomplete subreddit names                                                |
| POST   | `/api/search_reddit_names`              | `read`         | Autocomplete subreddit names (POST variant)                                 |
| GET    | `/subreddits/mine/subscriber`           | `mysubreddits` | My subscribed subreddits                                                    |
| GET    | `/subreddits/mine/contributor`          | `mysubreddits` | Subreddits I'm approved on                                                  |
| GET    | `/subreddits/mine/moderator`            | `mysubreddits` | Subreddits I moderate                                                       |
| GET    | `/subreddits/popular`                   | `read`         | Popular subreddits                                                          |
| GET    | `/subreddits/new`                       | `read`         | New subreddits                                                              |
| GET    | `/subreddits/default`                   | `read`         | Default subreddits                                                          |

**Subreddit Object Key Fields:**

- `display_name`, `title`, `description`, `public_description`
- `subscribers`, `active_user_count`
- `subreddit_type` (`public`, `private`, `restricted`, `archived`, `employees_only`, `gold_only`, `gold_restricted`, `user`)
- `submission_type` (`any`, `link`, `self`)
- `over18`, `quarantine`, `spoilers_enabled`
- `allow_images`, `allow_videos`, `allow_galleries`, `allow_polls`
- `link_flair_enabled`, `user_flair_enabled_in_sr`
- `wiki_enabled`, `emojis_enabled`
- `comment_score_hide_mins`, `suggested_comment_sort`
- `user_is_subscriber`, `user_is_moderator`, `user_is_contributor`, `user_is_banned`

### 3.3 Listings (Post Feeds)

| Method | Endpoint                       | Scope  | Description                                                       |
| ------ | ------------------------------ | ------ | ----------------------------------------------------------------- |
| GET    | `/r/{subreddit}/hot`           | `read` | Hot posts                                                         |
| GET    | `/r/{subreddit}/new`           | `read` | Newest posts                                                      |
| GET    | `/r/{subreddit}/top`           | `read` | Top posts (param: `t` = `hour`/`day`/`week`/`month`/`year`/`all`) |
| GET    | `/r/{subreddit}/rising`        | `read` | Rising posts                                                      |
| GET    | `/r/{subreddit}/controversial` | `read` | Controversial posts (param: `t`)                                  |
| GET    | `/r/{subreddit}/random`        | `read` | Random post                                                       |
| GET    | `/best`                        | `read` | Personalized best (authenticated users)                           |
| GET    | `/r/all`                       | `read` | All public subreddit content                                      |
| GET    | `/r/popular`                   | `read` | Location-filtered popular posts                                   |
| GET    | `/hot`                         | `read` | Front page hot                                                    |
| GET    | `/new`                         | `read` | Front page new                                                    |
| GET    | `/top`                         | `read` | Front page top                                                    |

**Common listing parameters:** `limit` (max 100), `after`, `before`, `count`, `t` (timeframe)

### 3.4 Links & Comments (Posts)

| Method | Endpoint                            | Scope      | Description                                |
| ------ | ----------------------------------- | ---------- | ------------------------------------------ |
| GET    | `/r/{subreddit}/comments/{article}` | `read`     | Post + full comment tree                   |
| GET    | `/comments/{article}`               | `read`     | Post + comments (without subreddit prefix) |
| POST   | `/api/submit`                       | `submit`   | Create new post                            |
| POST   | `/api/comment`                      | `submit`   | Add comment or reply                       |
| POST   | `/api/editusertext`                 | `edit`     | Edit self-post or comment                  |
| POST   | `/api/del`                          | `edit`     | Delete post or comment                     |
| POST   | `/api/vote`                         | `vote`     | Upvote/downvote (`dir`: 1, 0, -1)          |
| POST   | `/api/save`                         | `save`     | Save content                               |
| POST   | `/api/unsave`                       | `save`     | Unsave content                             |
| POST   | `/api/hide`                         | `report`   | Hide post                                  |
| POST   | `/api/unhide`                       | `report`   | Unhide post                                |
| POST   | `/api/report`                       | `report`   | Report content                             |
| POST   | `/api/marknsfw`                     | `modposts` | Mark as NSFW                               |
| POST   | `/api/unmarknsfw`                   | `modposts` | Remove NSFW mark                           |
| POST   | `/api/spoiler`                      | `modposts` | Mark as spoiler                            |
| POST   | `/api/unspoiler`                    | `modposts` | Remove spoiler mark                        |
| POST   | `/api/lock`                         | `modposts` | Lock post/comment                          |
| POST   | `/api/unlock`                       | `modposts` | Unlock post/comment                        |
| POST   | `/api/set_contest_mode`             | `modposts` | Toggle contest mode                        |
| POST   | `/api/set_subreddit_sticky`         | `modposts` | Sticky/unsticky post                       |
| POST   | `/api/set_suggested_sort`           | `modposts` | Set suggested comment sort                 |
| POST   | `/api/distinguish`                  | `modposts` | Distinguish as mod/admin                   |
| GET    | `/api/morechildren`                 | `read`     | Load collapsed comments                    |
| GET    | `/api/info`                         | `read`     | Fetch things by fullname (batch)           |
| POST   | `/api/crosspost`                    | `submit`   | Crosspost to another subreddit             |
| GET    | `/duplicates/{article}`             | `read`     | Find duplicate/crossposted links           |

**`/api/submit` Parameters:**

- `kind`: `"link"` (URL post), `"self"` (text post), `"image"`, `"video"`, `"videogif"`, `"crosspost"`
- `sr`: Target subreddit name
- `title`: Post title
- `url`: URL for link posts
- `text`: Body for self posts (markdown)
- `flair_id`, `flair_text`: Optional flair
- `nsfw`: Boolean
- `spoiler`: Boolean
- `resubmit`: Boolean (allow duplicate URLs)
- `sendreplies`: Boolean (inbox replies)
- `crosspost_fullname`: For crosspost kind

**Comment Object Key Fields:**

- `body`, `body_html` — raw markdown and rendered HTML
- `author`, `score`, `ups`, `downs`
- `link_id` — parent post fullname
- `parent_id` — parent comment or post fullname
- `edited` — false or UTC timestamp
- `distinguished` — `"moderator"`, `"admin"`, or null
- `is_submitter` — boolean (is the post author)
- `stickied` — boolean

### 3.5 Search

| Method | Endpoint                | Scope  | Description             |
| ------ | ----------------------- | ------ | ----------------------- |
| GET    | `/search`               | `read` | Search all of Reddit    |
| GET    | `/r/{subreddit}/search` | `read` | Search within subreddit |
| GET    | `/subreddits/search`    | `read` | Search subreddits       |
| GET    | `/users/search`         | `read` | Search users            |

**Search parameters:**

- `q`: Query string
- `restrict_sr`: Boolean — limit to subreddit (use with `/r/{subreddit}/search`)
- `sort`: `relevance`, `hot`, `new`, `top`, `comments`
- `t`: Time filter (`hour`, `day`, `week`, `month`, `year`, `all`)
- `type`: Filter by type (`sr`, `link`, `user`)
- `limit`: Max 100
- `after`, `before`: Pagination

### 3.6 Users

| Method | Endpoint                        | Scope     | Description                        |
| ------ | ------------------------------- | --------- | ---------------------------------- |
| GET    | `/user/{username}/about`        | `read`    | Public profile info                |
| GET    | `/user/{username}/overview`     | `history` | Recent activity (posts + comments) |
| GET    | `/user/{username}/submitted`    | `history` | User's posts                       |
| GET    | `/user/{username}/comments`     | `history` | User's comments                    |
| GET    | `/user/{username}/upvoted`      | `history` | Upvoted content (own only)         |
| GET    | `/user/{username}/downvoted`    | `history` | Downvoted content (own only)       |
| GET    | `/user/{username}/hidden`       | `history` | Hidden content (own only)          |
| GET    | `/user/{username}/saved`        | `history` | Saved content (own only)           |
| GET    | `/user/{username}/gilded`       | `history` | Gilded content                     |
| GET    | `/api/user_data_by_account_ids` | `read`    | Batch user lookup by IDs           |
| GET    | `/api/username_available`       | any       | Check username availability        |
| POST   | `/api/block_user`               | `account` | Block a user                       |

**Account Object (t2) Key Fields:**

- `name`, `id`
- `comment_karma`, `link_karma`, `total_karma`
- `created_utc`
- `is_gold`, `is_mod`, `is_employee`
- `has_verified_email`
- `icon_img`, `snoovatar_img`
- `subreddit` — user's profile subreddit data

### 3.7 Private Messages

| Method | Endpoint                  | Scope             | Description                                |
| ------ | ------------------------- | ----------------- | ------------------------------------------ |
| GET    | `/message/inbox`          | `privatemessages` | All inbox items                            |
| GET    | `/message/unread`         | `privatemessages` | Unread messages only                       |
| GET    | `/message/sent`           | `privatemessages` | Sent messages                              |
| GET    | `/message/messages`       | `privatemessages` | Private messages only (no comment replies) |
| GET    | `/message/comments`       | `privatemessages` | Comment reply notifications                |
| GET    | `/message/selfreply`      | `privatemessages` | Replies to own posts                       |
| GET    | `/message/mentions`       | `privatemessages` | Username mention notifications             |
| POST   | `/api/compose`            | `privatemessages` | Send private message                       |
| POST   | `/api/read_message`       | `privatemessages` | Mark as read                               |
| POST   | `/api/unread_message`     | `privatemessages` | Mark as unread                             |
| POST   | `/api/read_all_messages`  | `privatemessages` | Mark all as read                           |
| POST   | `/api/del_msg`            | `privatemessages` | Delete message                             |
| POST   | `/api/collapse_message`   | `privatemessages` | Collapse message                           |
| POST   | `/api/uncollapse_message` | `privatemessages` | Uncollapse message                         |

**`/api/compose` Parameters:**

- `to`: Recipient username
- `subject`: Message subject (max 100 chars)
- `text`: Message body (markdown)
- `api_type`: Set to `"json"` for JSON response

**Message Object (t4) Key Fields:**

- `subject`, `body`, `body_html`
- `author`, `dest`
- `context` — permalink for comment replies
- `first_message_name` — thread root fullname
- `was_comment` — boolean
- `new` — boolean (unread)

### 3.8 Moderation

| Method | Endpoint                                | Scope             | Description                             |
| ------ | --------------------------------------- | ----------------- | --------------------------------------- |
| POST   | `/api/approve`                          | `modposts`        | Approve item                            |
| POST   | `/api/remove`                           | `modposts`        | Remove item                             |
| POST   | `/api/distinguish`                      | `modposts`        | Distinguish as mod/admin                |
| POST   | `/api/ignore_reports`                   | `modposts`        | Ignore future reports                   |
| POST   | `/api/unignore_reports`                 | `modposts`        | Stop ignoring reports                   |
| GET    | `/r/{subreddit}/about/modqueue`         | `modposts`        | Moderation queue                        |
| GET    | `/r/{subreddit}/about/reports`          | `modposts`        | Reported content                        |
| GET    | `/r/{subreddit}/about/spam`             | `modposts`        | Spam queue                              |
| GET    | `/r/{subreddit}/about/edited`           | `modposts`        | Recently edited content                 |
| GET    | `/r/{subreddit}/about/unmoderated`      | `modposts`        | Unmoderated content                     |
| GET    | `/r/{subreddit}/about/log`              | `modlog`          | Moderation log                          |
| GET    | `/r/{subreddit}/about/moderators`       | `read`            | List moderators                         |
| GET    | `/r/{subreddit}/about/contributors`     | `modcontributors` | List approved users                     |
| GET    | `/r/{subreddit}/about/banned`           | `modcontributors` | List banned users                       |
| GET    | `/r/{subreddit}/about/muted`            | `modcontributors` | List muted users                        |
| GET    | `/r/{subreddit}/about/wikibanned`       | `modcontributors` | List wiki-banned users                  |
| GET    | `/r/{subreddit}/about/wikicontributors` | `modcontributors` | List wiki contributors                  |
| POST   | `/r/{subreddit}/api/friend`             | `modcontributors` | Ban user / add contributor / invite mod |
| POST   | `/r/{subreddit}/api/unfriend`           | `modcontributors` | Unban user / remove contributor         |
| POST   | `/api/mute_message_author`              | `modcontributors` | Mute user in modmail                    |
| POST   | `/api/unmute_message_author`            | `modcontributors` | Unmute user                             |
| GET    | `/r/{subreddit}/about/traffic`          | `modtraffic`      | Traffic statistics                      |

### 3.9 New Modmail

| Method | Endpoint                               | Scope     | Description                              |
| ------ | -------------------------------------- | --------- | ---------------------------------------- |
| GET    | `/api/mod/conversations`               | `modmail` | List conversations (filterable by state) |
| POST   | `/api/mod/conversations`               | `modmail` | Create new conversation                  |
| GET    | `/api/mod/conversations/:id`           | `modmail` | Get conversation by ID                   |
| POST   | `/api/mod/conversations/:id`           | `modmail` | Reply to conversation                    |
| POST   | `/api/mod/conversations/:id/archive`   | `modmail` | Archive conversation                     |
| POST   | `/api/mod/conversations/:id/unarchive` | `modmail` | Unarchive conversation                   |
| POST   | `/api/mod/conversations/:id/highlight` | `modmail` | Highlight conversation                   |
| DELETE | `/api/mod/conversations/:id/highlight` | `modmail` | Un-highlight                             |
| POST   | `/api/mod/conversations/:id/mute`      | `modmail` | Mute user in conversation                |
| POST   | `/api/mod/conversations/:id/unmute`    | `modmail` | Unmute user                              |
| POST   | `/api/mod/conversations/bulk/read`     | `modmail` | Bulk mark as read                        |
| GET    | `/api/mod/conversations/:id/user`      | `modmail` | User info in conversation context        |
| GET    | `/api/mod/conversations/subreddits`    | `modmail` | Subreddits with modmail access           |

**Conversation States:** `new`, `inprogress`, `archived`, `highlighted`, `mod`, `notifications`, `join_requests`, `appeals`

**Mod Action Codes:** 0=highlight, 1=un-highlight, 2=archive, 3=un-archive, 5=mute, 6=un-mute

**Quirk:** The `to` parameter in POST expects display name, not fullname, despite documentation claims.

**Source:** [Reddit Modmail API Tips — leviroth](https://gist.github.com/leviroth/dafcf1331737e2b55dd6fb86257dcb8d)

### 3.10 Flair

| Method | Endpoint                                 | Scope      | Description                        |
| ------ | ---------------------------------------- | ---------- | ---------------------------------- |
| GET    | `/r/{subreddit}/api/user_flair_v2`       | `flair`    | Get user's current flair           |
| POST   | `/r/{subreddit}/api/selectflair`         | `flair`    | Set user/link flair                |
| POST   | `/r/{subreddit}/api/flair`               | `modflair` | Set flair for any user (mod)       |
| POST   | `/r/{subreddit}/api/flaircsv`            | `modflair` | Bulk set flair via CSV             |
| GET    | `/r/{subreddit}/api/flairlist`           | `modflair` | List all user flairs               |
| POST   | `/r/{subreddit}/api/flairtemplate_v2`    | `modflair` | Create/update flair template       |
| POST   | `/r/{subreddit}/api/clearflairtemplates` | `modflair` | Delete all flair templates         |
| POST   | `/r/{subreddit}/api/deleteflair`         | `modflair` | Remove user's flair                |
| GET    | `/r/{subreddit}/api/link_flair_v2`       | `flair`    | Get available link flair templates |
| GET    | `/r/{subreddit}/api/user_flair`          | `flair`    | Get available user flair templates |
| POST   | `/r/{subreddit}/api/flairconfig`         | `modflair` | Configure flair settings           |
| POST   | `/api/flairselector`                     | `flair`    | Get flair choices for user or link |

**Flair types:** `text`, `richtext` (supports emoji)

### 3.11 Wiki

| Method | Endpoint                                  | Scope      | Description                 |
| ------ | ----------------------------------------- | ---------- | --------------------------- |
| GET    | `/r/{subreddit}/wiki/pages`               | `wikiread` | List all wiki pages         |
| GET    | `/r/{subreddit}/wiki/{page}`              | `wikiread` | Get wiki page content       |
| POST   | `/r/{subreddit}/api/wiki/edit`            | `wikiedit` | Edit wiki page              |
| GET    | `/r/{subreddit}/wiki/revisions`           | `wikiread` | All wiki revisions          |
| GET    | `/r/{subreddit}/wiki/revisions/{page}`    | `wikiread` | Page revision history       |
| POST   | `/r/{subreddit}/api/wiki/revert`          | `modwiki`  | Revert to previous revision |
| GET    | `/r/{subreddit}/wiki/settings/{page}`     | `modwiki`  | Wiki page settings          |
| POST   | `/r/{subreddit}/wiki/settings/{page}`     | `modwiki`  | Update wiki page settings   |
| POST   | `/r/{subreddit}/api/wiki/alloweditor/add` | `modwiki`  | Add wiki editor             |
| POST   | `/r/{subreddit}/api/wiki/alloweditor/del` | `modwiki`  | Remove wiki editor          |

### 3.12 Multireddits

| Method | Endpoint                               | Scope       | Description                             |
| ------ | -------------------------------------- | ----------- | --------------------------------------- |
| GET    | `/api/multi/mine`                      | `read`      | List my multireddits                    |
| GET    | `/api/multi/user/{username}`           | `read`      | List user's public multireddits         |
| POST   | `/api/multi`                           | `subscribe` | Create multireddit                      |
| PUT    | `/api/multi/{multipath}`               | `subscribe` | Create/update multireddit               |
| GET    | `/api/multi/{multipath}`               | `read`      | Get multireddit details                 |
| DELETE | `/api/multi/{multipath}`               | `subscribe` | Delete multireddit                      |
| POST   | `/api/multi/copy`                      | `subscribe` | Copy multireddit (409 if target exists) |
| PUT    | `/api/multi/{multipath}/r/{subreddit}` | `subscribe` | Add subreddit to multi                  |
| DELETE | `/api/multi/{multipath}/r/{subreddit}` | `subscribe` | Remove subreddit from multi             |
| GET    | `/api/multi/{multipath}/r/{subreddit}` | `read`      | Get subreddit info within multi         |
| GET    | `/api/multi/{multipath}/description`   | `read`      | Get multi description                   |
| PUT    | `/api/multi/{multipath}/description`   | `subscribe` | Update multi description                |

**Multireddit constraints:** Name max 50 chars, only letters/numbers/underscores. Visibility: `private` (default), `public`, `hidden`.

### 3.13 Collections

| Method | Endpoint                                            | Scope       | Description                  |
| ------ | --------------------------------------------------- | ----------- | ---------------------------- |
| GET    | `/api/v1/collections/collection`                    | `read`      | Get collection by ID         |
| GET    | `/api/v1/collections/subreddit_collections`         | `read`      | All collections in subreddit |
| POST   | `/api/v1/collections/create_collection`             | `modposts`  | Create collection            |
| POST   | `/api/v1/collections/delete_collection`             | `modposts`  | Delete collection            |
| POST   | `/api/v1/collections/add_post_to_collection`        | `modposts`  | Add post to collection       |
| POST   | `/api/v1/collections/remove_post_in_collection`     | `modposts`  | Remove post from collection  |
| POST   | `/api/v1/collections/reorder_collection`            | `modposts`  | Reorder posts                |
| POST   | `/api/v1/collections/update_collection_title`       | `modposts`  | Update title                 |
| POST   | `/api/v1/collections/update_collection_description` | `modposts`  | Update description           |
| POST   | `/api/v1/collections/follow_collection`             | `subscribe` | Follow collection            |
| POST   | `/api/v1/collections/unfollow_collection`           | `subscribe` | Unfollow collection          |

**Collection layouts:** `TIMELINE`, `GALLERY`

### 3.14 Live Threads

| Method | Endpoint                                            | Scope        | Description                  |
| ------ | --------------------------------------------------- | ------------ | ---------------------------- |
| POST   | `/api/live/create`                                  | `submit`     | Create live thread           |
| GET    | `/live/{thread_id}`                                 | `read`       | Get live thread              |
| GET    | `/live/{thread_id}/about`                           | `read`       | Thread metadata              |
| POST   | `/api/live/{thread_id}/update`                      | `submit`     | Post update to thread        |
| POST   | `/api/live/{thread_id}/close_thread`                | `livemanage` | Close thread                 |
| POST   | `/api/live/{thread_id}/edit`                        | `livemanage` | Edit thread settings         |
| GET    | `/live/{thread_id}/contributors`                    | `read`       | List contributors            |
| POST   | `/api/live/{thread_id}/invite_contributor`          | `livemanage` | Invite contributor           |
| POST   | `/api/live/{thread_id}/rm_contributor`              | `livemanage` | Remove contributor           |
| POST   | `/api/live/{thread_id}/accept_contributor_invite`   | `livemanage` | Accept invite                |
| POST   | `/api/live/{thread_id}/leave_contributor`           | `livemanage` | Leave as contributor         |
| POST   | `/api/live/{thread_id}/set_contributor_permissions` | `livemanage` | Set permissions              |
| POST   | `/api/live/{thread_id}/strike_update`               | `edit`       | Strike through update        |
| POST   | `/api/live/{thread_id}/delete_update`               | `edit`       | Delete update                |
| GET    | `/live/{thread_id}/discussions`                     | `read`       | Posts linking to this thread |

### 3.15 Emoji

| Method | Endpoint                                         | Scope       | Description                 |
| ------ | ------------------------------------------------ | ----------- | --------------------------- |
| GET    | `/api/v1/{subreddit}/emojis/all`                 | `read`      | List all subreddit emojis   |
| POST   | `/api/v1/{subreddit}/emoji.json`                 | `modconfig` | Add new emoji               |
| DELETE | `/api/v1/{subreddit}/emoji/{emoji_name}`         | `modconfig` | Delete emoji                |
| POST   | `/api/v1/{subreddit}/emoji_custom_size`          | `modconfig` | Set custom emoji size       |
| POST   | `/api/v1/{subreddit}/emoji_asset_upload_s3.json` | `modconfig` | Get S3 upload URL for emoji |

### 3.16 Widgets

| Method | Endpoint                                    | Scope              | Description         |
| ------ | ------------------------------------------- | ------------------ | ------------------- |
| GET    | `/r/{subreddit}/api/widgets`                | `structuredstyles` | Get all widgets     |
| POST   | `/r/{subreddit}/api/widget`                 | `structuredstyles` | Create widget       |
| PUT    | `/r/{subreddit}/api/widget/{widget_id}`     | `structuredstyles` | Update widget       |
| DELETE | `/r/{subreddit}/api/widget/{widget_id}`     | `structuredstyles` | Delete widget       |
| PATCH  | `/r/{subreddit}/api/widget_order/{section}` | `structuredstyles` | Reorder widgets     |
| POST   | `/r/{subreddit}/api/widget_image_upload_s3` | `structuredstyles` | Upload widget image |

### 3.17 Mod Notes

| Method | Endpoint         | Scope             | Description              |
| ------ | ---------------- | ----------------- | ------------------------ |
| GET    | `/api/mod/notes` | `modcontributors` | Get mod notes for a user |
| POST   | `/api/mod/notes` | `modcontributors` | Create mod note          |
| DELETE | `/api/mod/notes` | `modcontributors` | Delete mod note          |

---

## 4. Rate Limits

### 4.1 Standard Limits

| Auth Level            | Rate Limit                                        | Window                   |
| --------------------- | ------------------------------------------------- | ------------------------ |
| OAuth authenticated   | **60 requests/minute** (some sources say 100 QPM) | 10-minute rolling window |
| Unauthenticated       | **10 requests/minute**                            | IP-based tracking        |
| Elevated/trusted apps | **600-1,000 requests/minute**                     | Requires manual approval |

### 4.2 Rate Limit Response Headers

Every API response includes:

| Header                  | Description                         | Example |
| ----------------------- | ----------------------------------- | ------- |
| `X-Ratelimit-Used`      | Requests consumed in current period | `45`    |
| `X-Ratelimit-Remaining` | Requests available                  | `15`    |
| `X-Ratelimit-Reset`     | Seconds until quota resets          | `120`   |

### 4.3 Rate Limit Violations

- **HTTP 429** returned when limit exceeded
- Temporary blocks: 10-60 minutes depending on severity
- Implement **exponential backoff** on 429 responses
- Short bursts can trigger throttling even if average is under limit

### 4.4 User-Agent Requirements

**Format:** `<platform>:<app_id>:<version> (by /u/<reddit_username>)`

**Example:** `python:com.example.mybot:v1.0.0 (by /u/myusername)`

**Critical rules:**

- Generic agents (`Python/urllib`, `Java`) get severely rate-limited
- NEVER spoof browsers or other bots — "ban with extreme prejudice"
- Include version numbers for safe blocking of buggy versions
- Update version string as you release updates

**Sources:**

- [Reddit API Rules — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/API)
- [Reddit API Rate Limits 2026 Guide](https://painonsocial.com/blog/reddit-api-rate-limits-guide)
- [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)

---

## 5. Pricing & Commercial Use (2025-2026)

### 5.1 Free Tier

- Available to apps making fewer than 100 QPM (OAuth) or 10 QPM (no OAuth)
- Covers ~90% of existing apps
- Mod bots and accessibility apps: guaranteed free
- **Requires application approval** — no more self-service

### 5.2 Commercial Pricing

| Tier                                     | Cost                      | Rate Limit   |
| ---------------------------------------- | ------------------------- | ------------ |
| Per-request (original 2023 announcement) | $0.24 per 1,000 API calls | Varies       |
| Standard annual (reported)               | ~$12,000/year             | 100 RPM      |
| Higher tiers (reported)                  | ~$24,000-$60,000+/year    | 200-500+ RPM |

- Any monetized application (ads, paywall, paid product) requires pre-approval
- Reddit may deny commercial applications
- Pricing is negotiated, not fixed — reported figures are from organizations that have gained access

### 5.3 Key Policy Changes Timeline

| Date               | Change                                               |
| ------------------ | ---------------------------------------------------- |
| April 2023         | Reddit announces API pricing                         |
| July 1, 2023       | New pricing takes effect; old cookie auth deprecated |
| September 12, 2023 | Old awards/coins system sunset                       |
| 2024               | Self-service API access removed; approval required   |
| 2025               | Stricter enforcement, pre-approval mandate expanded  |

**Sources:**

- [Reddit API Pricing — Data365](https://data365.co/blog/reddit-api-pricing)
- [Reddit API Cost 2025 — Sellbery](https://sellbery.com/blog/how-much-does-the-reddit-api-cost-in-2025/)
- [Reddit API Cost Guide — Rankvise](https://rankvise.com/blog/reddit-api-cost-guide/)
- [Reddit Pricing Explained — TechTarget](https://www.techtarget.com/whatis/feature/Reddit-pricing-API-charge-explained)
- [Complete Guide to Reddit API Pricing 2026 — BBNTIMES](https://www.bbntimes.com/technology/complete-guide-to-reddit-api-pricing-and-usage-tiers-in-2026)

---

## 6. Implementation Best Practices

### 6.1 Authentication Strategy for an MCP Server

For an MCP server, the recommended approach:

1. **Script App** for single-user/personal use (simplest — password grant)
2. **Web App** for multi-user (authorization code flow with refresh tokens)
3. Always request `duration=permanent` for refresh tokens
4. Store tokens securely; refresh before expiry
5. Request only the scopes you need

### 6.2 Error Handling

| Error                    | Meaning                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `invalid_grant`          | Auth code expired or already used                           |
| `access_denied`          | User declined permissions                                   |
| `invalid_scope`          | Bad scope parameter                                         |
| `unsupported_grant_type` | Invalid grant type                                          |
| 401                      | Invalid credentials / expired token                         |
| 403                      | Forbidden (private subreddit, no permission)                |
| 404                      | Resource not found / banned subreddit                       |
| 429                      | Rate limited                                                |
| 503                      | Server overloaded (may still succeed, e.g., bulk subscribe) |

### 6.3 Pagination Strategy

```
# Iterate through all posts in a subreddit
after = None
while True:
    params = {"limit": 100}
    if after:
        params["after"] = after
    response = get(f"/r/{subreddit}/new", params=params)
    listing = response.json()["data"]
    process(listing["children"])
    after = listing["after"]
    if not after:
        break
```

**Note:** Reddit limits listing depth to ~1000 items. For deeper access, use time-based filtering or search.

### 6.4 Comment Tree Traversal

Comments are returned as a nested tree. The "more" object indicates collapsed branches requiring separate `GET /api/morechildren` calls with:

- `link_id`: Parent post fullname
- `children`: Comma-separated comment IDs from the "more" object
- `api_type`: `"json"`

---

## 7. Gaps & Areas Needing Further Research

1. **Polls API**: Endpoint details for creating/viewing poll posts are not well-documented in public sources
2. **Chat API**: Reddit's chat system appears to have limited/no public API documentation
3. **Media Upload**: The image/video upload flow (S3 presigned URLs) needs deeper investigation
4. **Streaming/WebSocket**: Real-time streaming capabilities (if any beyond live threads)
5. **Gallery Posts**: Detailed `gallery_data` parameter format for multi-image posts
6. **New Reddit Features**: Predictions, talks, and other newer features may have undocumented endpoints
7. **Exact current rate limits**: Conflicting reports (60 vs 100 QPM) — may depend on app approval tier

---

## References

### Primary Sources (Official Documentation)

1. **[Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)** — Accessed: 2026-03-27 — Type: Official — Reliability: 5/5
2. **[OAuth2 — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 5/5
3. **[OAuth2 App Types — reddit-archive Wiki](https://github.com/reddit-archive/reddit/wiki/oauth2-app-types)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 5/5
4. **[OAuth2 Quick Start Example](https://github.com/reddit-archive/reddit/wiki/OAuth2-Quick-Start-Example)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 5/5
5. **[Reddit API Rules](https://github.com/reddit-archive/reddit/wiki/API)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 5/5
6. **[Reddit JSON Wiki](https://github.com/reddit-archive/reddit/wiki/json)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 5/5
7. **[Reddit API Submit](https://github.com/reddit-archive/reddit/wiki/api:-submit)** — Accessed: 2026-03-27 — Type: Official (archived) — Reliability: 4/5

### Secondary Sources (Articles, Guides)

8. **[Reddit API Documentation — Zernio (2026)](https://zernio.com/blog/reddit-api-documentation)** — Accessed: 2026-03-27 — Type: Technical Guide — Reliability: 4/5
9. **[Reddit API Endpoints List — PainOnSocial](https://painonsocial.com/blog/reddit-api-endpoints-list)** — Accessed: 2026-03-27 — Type: Technical Guide — Reliability: 4/5
10. **[Reddit API Rate Limits 2026 — PainOnSocial](https://painonsocial.com/blog/reddit-api-rate-limits-guide)** — Accessed: 2026-03-27 — Type: Technical Guide — Reliability: 4/5
11. **[Reddit API How-To Tutorial — rymur](https://rymur.github.io/tut2)** — Accessed: 2026-03-27 — Type: Tutorial — Reliability: 4/5
12. **[How to Use Reddit API — Latenode](https://latenode.com/blog/integration-api-management/api-integration-best-practices/how-to-use-reddit-api-from-access-tokens-to-automated-data-collection)** — Accessed: 2026-03-27 — Type: Technical Blog — Reliability: 3/5
13. **[Reddit API JSON Documentation — JC Chouinard](https://www.jcchouinard.com/documentation-on-reddit-apis-json/)** — Accessed: 2026-03-27 — Type: Technical Blog — Reliability: 4/5
14. **[Reddit API Cost 2025 — Sellbery](https://sellbery.com/blog/how-much-does-the-reddit-api-cost-in-2025/)** — Accessed: 2026-03-27 — Type: Article — Reliability: 3/5
15. **[Reddit API Pricing — Data365](https://data365.co/blog/reddit-api-pricing)** — Accessed: 2026-03-27 — Type: Article — Reliability: 3/5
16. **[Reddit API Credentials Guide 2025 — Wappkit](https://www.wappkit.com/blog/reddit-api-credentials-guide-2025)** — Accessed: 2026-03-27 — Type: Guide — Reliability: 3/5

### Community Sources

17. **[Pyprohly/reddit-api-doc-notes](https://github.com/Pyprohly/reddit-api-doc-notes)** — Accessed: 2026-03-27 — Type: Community Documentation — Reliability: 5/5
18. **[Reddit Modmail API Tips — leviroth](https://gist.github.com/leviroth/dafcf1331737e2b55dd6fb86257dcb8d)** — Accessed: 2026-03-27 — Type: Community Reference — Reliability: 4/5
19. **[PRAW Documentation](https://praw.readthedocs.io/en/stable/)** — Accessed: 2026-03-27 — Type: Library Docs — Reliability: 5/5
20. **[PRAW Glossary](https://praw.readthedocs.io/en/stable/package_info/glossary.html)** — Accessed: 2026-03-27 — Type: Library Docs — Reliability: 5/5
21. **[snoowrap Documentation](https://not-an-aardvark.github.io/snoowrap/Subreddit.html)** — Accessed: 2026-03-27 — Type: Library Docs — Reliability: 4/5
22. **[Go-Reddit Package](https://pkg.go.dev/github.com/vartanbeno/go-reddit/reddit)** — Accessed: 2026-03-27 — Type: Library Docs — Reliability: 4/5
23. **[Reddit.NET Library](https://github.com/sirkris/Reddit.NET)** — Accessed: 2026-03-27 — Type: Library Docs — Reliability: 4/5
24. **[Reddit API Pre-Approval 2025 — ReplyDaddy](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown)** — Accessed: 2026-03-27 — Type: Article — Reliability: 3/5
25. **[Reddit API Guide — Zuplo](https://zuplo.com/learning-center/reddit-api-guide)** — Accessed: 2026-03-27 — Type: Guide — Reliability: 3/5

---

## Version History

- v1.0 (2026-03-27): Initial comprehensive research covering authentication, all major endpoint categories, data model, rate limits, pricing, and best practices
