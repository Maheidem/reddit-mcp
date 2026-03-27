---
title: Reddit API Edge Cases, Undocumented Behavior, and Gotchas
date: 2026-03-27
researcher: researcher-1
tags: [reddit, api, edge-cases, gotchas, undocumented, media-upload, polls, gallery]
status: completed
confidence: high
---

# Reddit API Edge Cases, Undocumented Behavior, and Gotchas

## Executive Summary

This document covers the practical pitfalls, undocumented behaviors, and "senior engineer knowledge" that separates a correct Reddit API implementation from a robust one. It covers rate limit clarification, undocumented endpoints (gallery, poll, media upload, drafts), response format inconsistencies, comment tree edge cases, media upload flows, deprecated endpoints, and field-level gotchas. This is the knowledge that can't be derived from the official docs alone.

---

## 1. Rate Limit Clarification: 60 RPM vs 100 QPM

### 1.1 The Discrepancy Resolved

The conflicting numbers (60 vs 100) appear in different sources because **they come from different eras of Reddit's API policy**:

| Source | Limit | Date | Context |
|--------|-------|------|---------|
| [Reddit API Wiki (archived)](https://github.com/reddit-archive/reddit/wiki/API) | **60 requests/minute** | Pre-2023 | Original rate limit documentation |
| [Reddit Data API Wiki (official)](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki) | **100 queries/minute per OAuth client ID** | July 2023+ | Post-pricing-change official policy |

**Conclusion:** The **current** limit for OAuth-authenticated apps is **100 requests per minute per OAuth client ID**, announced as part of the July 2023 API changes. The 60 RPM figure is from the pre-2023 archived documentation and is outdated.

### 1.2 Important Nuances

- **Rolling window**: Limits are calculated as an average over a **10-minute rolling window**, not a strict per-minute cap. This means you can burst above 100 RPM briefly if your 10-minute average stays under 1000 total requests.
- **Per client ID**: Each registered OAuth application gets its own quota. Multiple apps = multiple quotas.
- **Unauthenticated**: 10 RPM, IP-based tracking. The `.json` suffix trick falls under this.
- **Elevated tier**: 600-1000 RPM available by manual approval from Reddit for trusted applications that "demonstrate ecosystem value."
- **Rate limit headers** are the authoritative source — always read `X-Ratelimit-Remaining` from the actual response rather than hardcoding assumptions.

**Sources:**
- [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [Reddit API Rate Limits 2026 — PainOnSocial](https://painonsocial.com/blog/reddit-api-rate-limits-guide)
- [Reddit API Limits — Data365](https://data365.co/blog/reddit-api-limits)
- [Reddit API Ratelimiting Explained — LaterForReddit](https://laterforreddit.com/news/2017/03/04/reddit-api-ratelimiting-explained/)

---

## 2. Undocumented & Semi-Public Endpoints

### 2.1 Gallery Post Submission

Gallery posts use a **separate endpoint** from the standard `/api/submit`:

**Endpoint:** `POST /api/submit_gallery_post.json`

**This is NOT the same as `/api/submit`.** It was discovered via PRAW's `endpoints.py` file.

**Flow:**
1. Upload each image via `POST /api/media/asset.json` (see Section 4)
2. Collect the `asset_id` (which becomes the `media_id`) for each upload
3. Submit gallery post with all media IDs

**JSON Body Structure (reconstructed from PRAW and community implementations):**
```json
{
  "sr": "subreddit_name",
  "title": "Post Title",
  "text": "Optional self text body (markdown)",
  "items": [
    {
      "media_id": "asset_id_from_upload_1",
      "caption": "Optional caption for image 1",
      "outbound_url": "https://optional-link.com"
    },
    {
      "media_id": "asset_id_from_upload_2",
      "caption": "Caption for image 2"
    }
  ],
  "nsfw": false,
  "spoiler": false,
  "flair_id": "optional_flair_template_id",
  "flair_text": "optional_flair_text",
  "sendreplies": true,
  "api_type": "json"
}
```

**Constraints:**
- Maximum **20 images** per gallery post (since July 2020)
- Only `image_path` / `media_id` is required per item; `caption` and `outbound_url` are optional
- `selftext` support was added later (as of 2025) — gallery posts can now include a text body

**Sources:**
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py) — `submit_gallery_post`: `"api/submit_gallery_post.json"`
- [Postiz Gallery Issue #1177](https://github.com/gitroomhq/postiz-app/issues/1177)
- [PRAW Subreddit.submit_gallery](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)

### 2.2 Poll Post Submission

Polls also use a **separate endpoint**:

**Endpoint:** `POST /api/submit_poll_post`

**Parameters (derived from PRAW's `submit_poll` method):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sr` | string | Yes | Subreddit name |
| `title` | string | Yes | Post title |
| `selftext` | string | No | Text body (markdown). Use `""` for no text. |
| `options` | array of strings | Yes | 2-6 poll options |
| `duration` | int | Yes | Voting period in days (1-7 inclusive) |
| `flair_id` | string | No | Flair template ID |
| `flair_text` | string | No | Flair text |
| `nsfw` | boolean | No | Mark as NSFW |
| `spoiler` | boolean | No | Mark as spoiler |
| `sendreplies` | boolean | No | Receive inbox replies |
| `discussion_type` | string | No | Set to `"CHAT"` for live discussion mode instead of traditional comments |

**Poll Data Object (returned on poll submissions):**
```json
{
  "poll_data": {
    "options": [
      {"id": "option_id_1", "text": "Option text 1", "vote_count": 42},
      {"id": "option_id_2", "text": "Option text 2", "vote_count": 17}
    ],
    "total_vote_count": 59,
    "voting_end_timestamp": 1700000000.0,
    "user_selection": "option_id_1",
    "is_prediction": false
  }
}
```

**Gotcha:** You cannot read individual vote counts until the poll has closed, unless you are the post author. Before closing, `vote_count` may be null for non-authors.

**Sources:**
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py) — `submit_poll_post`: `"api/submit_poll_post"`
- [PRAW PollData docs](https://praw.readthedocs.io/en/stable/code_overview/other/polldata.html)
- [PRAW Polls (v7.4.0)](https://praw.readthedocs.io/en/v7.4.0/code_overview/other/poll.html)

### 2.3 Draft Endpoints

PRAW reveals draft management endpoints not in official docs:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/v1/draft` | Single draft CRUD |
| GET | `/api/v1/drafts` | List all drafts |

### 2.4 Additional Undocumented/Semi-Public Endpoints

| Endpoint | Description | Source |
|----------|-------------|--------|
| `GET /api/v1/user/{username}/trophies` | User's trophies (documented in some versions, missing in others) | PRAW |
| `POST /api/submit_gallery_post.json` | Gallery post submission | PRAW endpoints.py |
| `POST /api/submit_poll_post` | Poll post submission | PRAW endpoints.py |
| `GET /api/mod/notes/recent` | Bulk mod notes retrieval | PRAW endpoints.py |
| `GET /api/v1/{subreddit}/removal_reasons` | List removal reasons | PRAW endpoints.py |
| `DELETE /api/v1/{subreddit}/removal_reasons/{id}` | Delete removal reason | PRAW endpoints.py |
| `GET /api/live/happening_now` | Currently active live threads | PRAW endpoints.py |
| `GET /live/{thread_id}/updates/{update_id}` | Specific live thread update | PRAW endpoints.py |
| `POST /api/live/{id}/rm_contributor_invite` | Revoke live thread contributor invite | PRAW endpoints.py |
| `POST /api/live/{id}/report` | Report a live thread | PRAW endpoints.py |
| `GET /api/mod/conversations/unread/count` | Unread modmail count | PRAW endpoints.py |
| `POST /api/mod/conversations/read` | Mark modmail read (non-bulk) | PRAW endpoints.py |
| `POST /api/mod/conversations/unread` | Mark modmail unread | PRAW endpoints.py |
| `GET /api/v1/collections/update_collection_display_layout` | Update collection display layout | PRAW endpoints.py |
| `POST /r/{subreddit}/api/upload_sr_img` | Upload subreddit image (legacy) | PRAW endpoints.py |
| `GET /api/v1/style_asset_upload_s3/{subreddit}` | Style asset S3 upload lease | PRAW endpoints.py |

**Source:** [PRAW endpoints.py — Full listing of 180+ endpoint paths](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)

### 2.5 Live Discussion (CHAT) Mode

Setting `discussion_type: "CHAT"` on any submission endpoint enables Reddit's live discussion format instead of traditional threaded comments. This is semi-documented — it appears in PRAW's changelog but not in Reddit's official API docs.

**Source:** [PRAW Changelog v7.2.0](https://praw.readthedocs.io/en/v7.2.0/package_info/change_log.html)

---

## 3. Common API Gotchas

### 3.1 Response Format Inconsistencies

Reddit's API has significant inconsistencies in how it returns data. This is one of the biggest pain points for developers.

#### Post Type Detection Nightmare

There is **no single field** that tells you the post type. You must check multiple fields:

| Post Type | Detection Logic |
|-----------|----------------|
| Text/self post | `is_self === true` |
| Link post | `is_self === false && !is_video && post_hint !== 'image'` |
| Image post | `post_hint === 'image'` OR check `preview.images` |
| Video post | `is_video === true` OR `media.reddit_video` exists |
| Embedded video | `post_hint === 'rich:video'` AND `domain === 'v.redd.it'` |
| Gallery post | `is_gallery === true`, data in `media_metadata` + `gallery_data` |
| Poll post | `poll_data` attribute exists |
| Crosspost | `crosspost_parent` exists |

**Media URL location varies by post type:**
- Self-hosted video: `media.reddit_video.fallback_url`
- Embedded video: `media_embed` or `secure_media_embed`
- Images: `preview.images[0].source.url` (HTML-encoded!)
- Gallery: `media_metadata[key].s.u` (also HTML-encoded)
- External links: `url` field

**Source:** [Reddit API is such a mess — DEV Community](https://dev.to/pilcrowonpaper/reddit-api-is-such-a-mess-me2)

#### Field Naming Inconsistencies

| Field | Appears as | Context |
|-------|-----------|---------|
| NSFW flag | `over_18` | Post objects |
| NSFW flag | `over18` | Subreddit objects (note: no underscore!) |
| Community icon | `community_icon` | Some contexts |
| Community icon | `icon_img` | Other contexts |
| Description | `description` | Subreddit searches — MISSING from user searches |

#### The `replies` Field Inconsistency

This is one of the most confusing aspects of the Reddit API:

| Context | `replies` field value |
|---------|----------------------|
| Comment in threaded view (has replies) | Listing object with nested comments |
| Comment in threaded view (no replies) | **Empty string `""`** (not null, not empty array, not empty listing) |
| Comment from `/api/morechildren` | **Always empty string `""`** — you must rebuild the tree manually |
| Comment from user profile | **Always empty string `""`** |

**Your code MUST handle both `""` and listing objects for the `replies` field.**

### 3.2 The `raw_json=1` Parameter

**Without `raw_json=1`:** Reddit HTML-encodes special characters in all text fields:
- `&` becomes `&amp;`
- `<` becomes `&lt;`
- `>` becomes `&gt;`
- URLs in `preview.images[0].source.url` get double-encoded

**With `raw_json=1`:** Returns unescaped text. **Always include this parameter.**

```
GET /r/python/hot?raw_json=1&limit=25
```

### 3.3 The `api_type=json` Parameter

Many POST endpoints return jQuery-style callback responses by default (legacy behavior). Add `api_type=json` to get proper JSON:

```
POST /api/submit
  api_type=json&kind=self&sr=test&title=Test&text=Hello
```

Without this, the response is an array of jQuery commands, not a JSON object.

### 3.4 Vote Fuzzing

Reddit intentionally fuzzes vote counts for anti-spam purposes:
- `ups` and `downs` are **never exact** on posts with significant activity
- `score` is more reliable but still fuzzy
- `upvote_ratio` (0.0-1.0) is the most stable metric
- The more active a post, the more aggressive the fuzzing
- **Gotcha:** Don't compare exact vote counts between requests — they will differ even if no new votes occurred

### 3.5 Score Hiding

- Subreddit mods can set `comment_score_hide_mins` (0-1440 minutes)
- During the hidden period, `score` returns as `1` or may be `null` in some clients
- The `score_hidden` boolean field indicates this state
- **Gotcha:** A score of `1` doesn't necessarily mean 1 upvote — it may be hidden

### 3.6 Deleted/Removed Content

| State | `author` field | `body`/`selftext` | `[deleted]` vs `[removed]` |
|-------|---------------|--------------------|----|
| User deleted their content | `"[deleted]"` | `"[deleted]"` | User action |
| Mod/admin removed content | `"[deleted]"` | `"[removed]"` | Moderator action |
| Suspended account's content | `"[deleted]"` | Content may still show | Account-level action |
| Shadowbanned user | `null` or missing | May return 404 | Not visible to others |

**Gotcha:** The `author` field becomes the literal string `"[deleted]"`, not null. Check for this string explicitly.

### 3.7 Subreddit Mismatch in Comment Endpoints

If the `{subreddit}` in `/r/{subreddit}/comments/{article}` doesn't match the post's actual subreddit, the API returns **an empty listing with no error** (200 OK). This can silently return no data.

### 3.8 The 1000-Item Listing Depth Limit

Reddit's listing pagination (using `after`) stops returning results after approximately 1000 items. This is a hard server-side limit:

- `GET /r/subreddit/new` — can only paginate through ~1000 most recent posts
- `GET /user/username/comments` — only ~1000 most recent comments
- **Workaround:** Use search with time-range filters to access older content

### 3.9 Concurrent `/api/morechildren` Requests

**You may only make ONE request at a time to `/api/morechildren`.** Higher concurrency results in an error. This means expanding large comment trees is inherently slow — you must serialize these requests.

**Source:** [Pyprohly/reddit-api-doc-notes — comment_tree.rst](https://github.com/Pyprohly/reddit-api-doc-notes/blob/main/docs/api-reference/comment_tree.rst)

---

## 4. Media Upload Flow (Complete Multi-Step Process)

### 4.1 Overview

Reddit uses a 3-step upload process via S3 presigned URLs. This is **undocumented in official docs** but well-understood from PRAW's source code and community reverse-engineering.

### 4.2 Step 1: Request Upload Lease

```
POST https://oauth.reddit.com/api/media/asset.json
Authorization: bearer ACCESS_TOKEN
User-Agent: platform:app:v1.0 (by /u/username)
Content-Type: application/x-www-form-urlencoded

filepath=my_image.png&mimetype=image/png
```

**Parameters:**
- `filepath`: Filename with extension (basename only, not full path)
- `mimetype`: MIME type of the file

**Supported MIME types:**
| Extension | MIME Type |
|-----------|----------|
| `.png` | `image/png` |
| `.jpg` / `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.mp4` | `video/mp4` |
| `.mov` | `video/quicktime` |

**Response:**
```json
{
  "args": {
    "action": "//reddit-uploaded-media.s3-accelerate.amazonaws.com",
    "fields": [
      {"name": "acl", "value": "private"},
      {"name": "key", "value": "rte_images/unique-key"},
      {"name": "X-Amz-Credential", "value": "..."},
      {"name": "X-Amz-Algorithm", "value": "AWS4-HMAC-SHA256"},
      {"name": "X-Amz-Date", "value": "..."},
      {"name": "success_action_status", "value": "201"},
      {"name": "content-type", "value": "image/png"},
      {"name": "x-amz-storage-class", "value": "INTELLIGENT_TIERING"},
      {"name": "x-amz-meta-ext", "value": "png"},
      {"name": "policy", "value": "..."},
      {"name": "X-Amz-Signature", "value": "..."}
    ]
  },
  "asset": {
    "asset_id": "unique-asset-id",
    "processing_state": "incomplete",
    "payload": {"filepath": "my_image.png"},
    "websocket_url": "wss://ws-xxxxx.wss.redditmedia.com/rte_images/unique-key?m=TOKEN"
  }
}
```

**Important:** The `asset_id` returned here becomes the `media_id` used in gallery submissions.

### 4.3 Step 2: Upload to S3

```
POST https://reddit-uploaded-media.s3-accelerate.amazonaws.com
Content-Type: multipart/form-data

[All fields from args.fields as form fields]
file=<binary file data>
```

**Critical rules:**
- Use `multipart/form-data` — NOT JSON, NOT URL-encoded
- Include ALL fields from the response in the exact order
- The `file` field must be **last** in the multipart body
- Do NOT add any AWS authorization headers — the presigned fields handle auth
- Only include default headers: `Content-Type` (auto-set by multipart) and `Content-Length`
- **The upload URL is `https:` + the `action` value** (which starts with `//`)

**Success Response:** XML with `<Location>` element containing the CDN URL (URL-decode it).

**Policy timeout:** The presigned URL expires — upload within ~5 seconds of receiving it.

### 4.4 Step 3: Submit Post Using Uploaded Media

**For single image posts:**
```
POST https://oauth.reddit.com/api/submit
  kind=image&sr=subreddit&title=Title&url=<decoded_cdn_url>
```

**For gallery posts:**
```
POST https://oauth.reddit.com/api/submit_gallery_post.json
Content-Type: application/json

{
  "sr": "subreddit",
  "title": "Gallery Post",
  "items": [
    {"media_id": "asset_id_1", "caption": "First image"},
    {"media_id": "asset_id_2", "caption": "Second image"}
  ]
}
```

**For video posts:**
```
POST https://oauth.reddit.com/api/submit
  kind=video&sr=subreddit&title=Title&url=<decoded_cdn_url>&video_poster_url=<thumbnail_url>
```

### 4.5 Step 4 (Optional): WebSocket Notification

The `websocket_url` from Step 1 provides real-time post-submission status:

```javascript
const ws = new WebSocket(asset.websocket_url);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data = {"type": "success", "payload": {"redirect": "https://reddit.com/r/..."}}
};
```

**Notes:**
- WebSocket ignores sent messages (read-only)
- Does not auto-disconnect after submission
- Useful for confirming post creation and getting the final URL

### 4.6 Complete Flow Diagram

```
1. POST /api/media/asset.json (get S3 upload params + asset_id)
      |
2. POST https://reddit-uploaded-media.s3-accelerate.amazonaws.com (upload file)
      |
3a. POST /api/submit (single image/video post using CDN URL)
  — OR —
3b. POST /api/submit_gallery_post.json (gallery using asset_ids as media_ids)
      |
4. (Optional) Listen to websocket_url for confirmation
```

**Average total time:** ~950ms per image upload + submit.

**Sources:**
- [reddit-api-image-upload library (reverse-engineered)](https://github.com/VityaSchel/reddit-api-image-upload)
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py) — `media_asset`: `"api/media/asset.json"`
- [PRAW submit_image issue #1359](https://github.com/praw-dev/praw/issues/1359)

---

## 5. Comment Tree Edge Cases (Deep Dive)

### 5.1 Two Types of "more" Objects

| Type | `count` | `children` | `id` | Meaning | How to Expand |
|------|---------|-----------|------|---------|---------------|
| **"Load more comments"** | > 0 (total descendants) | Array of comment IDs | Valid ID | More comments exist at this level | Call `/api/morechildren` with the `children` IDs |
| **"Continue this thread"** | Always 0 | Empty array `[]` | `"_"` | Thread too deep, re-fetch needed | Fetch the parent comment's permalink directly |

### 5.2 Edge Case: `children` Count vs Array Length

The `count` field represents **total descendants** under the parent, but the `children` array only contains **top-level sub-comments** (direct children). These numbers will differ — `count` is always >= `children.length`.

### 5.3 Edge Case: Deleted Comments with No Trace

If a comment has been deleted AND has no replies, it may be completely removed from the tree with no `[deleted]` placeholder. When fetching a specific comment by ID:

> "Clients should check that the comment list is not empty and reject the result if it is."

A 200 OK response with an empty comment list means the comment no longer exists.

### 5.4 `/api/morechildren` Return Format

The response is a **flat array** in pre-order DFS traversal order, NOT a nested tree:
- All `replies` fields are **empty strings**
- You must manually reconstruct the tree using each comment's `parent_id`
- Depth values are included but the nesting must be rebuilt

### 5.5 `truncate` vs `limit` Parameter

| Parameter | Behavior | "more" object? |
|-----------|----------|----------------|
| `limit` | Limits comment count, includes "more" object for remaining | Yes |
| `truncate` | Limits comment count, does NOT return a top-level "more" object | No |

`truncate` range: 0-50. Useful when you want a preview without the overhead of "more" stubs.

### 5.6 Depth Parameter Behavior

| Value | Behavior |
|-------|----------|
| 0 | Ignored (returns default depth ~10) |
| 1 | Top-level comments only |
| 2-10 | Incrementally deeper |
| > 10 | Capped at 10 (API max) |

### 5.7 Sort Parameter Options

`confidence` (default/"best"), `top`, `new`, `controversial`, `old`, `random`, `qa`, `live`

If an invalid sort value is provided, it silently falls back to the user's preference or `confidence`.

**Source:** [Pyprohly/reddit-api-doc-notes — comment_tree.rst](https://github.com/Pyprohly/reddit-api-doc-notes/blob/main/docs/api-reference/comment_tree.rst)

---

## 6. Deprecated vs Sunset Endpoints

### 6.1 Fully Removed / Non-Functional

| Endpoint | Status | When |
|----------|--------|------|
| `GET /api/trending_subreddits.json` | **Non-functional** — returns empty/errors | Unknown, documented as deprecated |
| Cookie-based authentication | **Removed** | July 2023 |
| Unauthenticated API access (most endpoints) | **Effectively removed** (10 RPM, heavily throttled) | July 2023 |

### 6.2 Deprecated but Still Functional

| Endpoint/Feature | Status | Notes |
|------------------|--------|-------|
| Awards/Gilding endpoints (`/api/v1/gold/gild`, etc.) | **Deprecated** — awards system sunset Sept 2023 | May still return data for historical awards but no new awards can be given |
| `gilded` field on posts/comments | **Deprecated** | Returns historical data; `all_awardings` may still contain legacy data |
| `/api/v1/me/gilded` | **Deprecated** | Was for gilded content; limited utility post-sunset |
| `modhash` in responses | **Legacy** | Irrelevant for OAuth (used for cookie-based CSRF); still returned but not needed |
| `ups` and `downs` exact counts | **Deprecated accuracy** | Always fuzzed; `upvote_ratio` is more reliable |
| Non-OAuth API access | **Deprecated** | The `.json` suffix trick still works but is rate-limited to 10 RPM and unreliable |

### 6.3 Endpoints at Risk

These work today but are based on features Reddit has de-emphasized:
- Live threads (largely replaced by Reddit Talk / live video)
- Old-style custom CSS (`/about/stylesheet`)
- Gold/premium-related endpoints

---

## 7. Additional Implementation Gotchas

### 7.1 Error Response Format Variations

Reddit returns errors in inconsistent formats depending on the endpoint:

```json
// Format 1: Standard error object
{"message": "Forbidden", "error": 403}

// Format 2: jQuery callback format (legacy endpoints without api_type=json)
[["call", "attr", ...], ["call", ...]]

// Format 3: Wrapped JSON errors
{"json": {"errors": [["BAD_SR_NAME", "that name isn't going to work", "sr"]]}}

// Format 4: Empty 200 OK (some moderation endpoints on success)
{}
```

**Your error handling must account for all of these.**

### 7.2 HTTP Status Code Surprises

| Scenario | Expected | Actual |
|----------|----------|--------|
| Private subreddit | 403 | Sometimes 302 redirect |
| Banned subreddit | 404 | Sometimes 403 |
| Nonexistent subreddit | 404 | Sometimes 302 redirect to search |
| Rate limited | 429 | Correct |
| Bot detection | 403 | 403 (not 429) — looks like permissions error |
| Subscribe with 250+ items | 200 | 503 (but operation may succeed!) |
| Subscribe with 460+ items | 200 | 400 (genuine failure) |
| Nonexistent user endpoint | 404 | Sometimes 200 with empty listing |

### 7.3 Timing-Sensitive Operations

- **New accounts**: May receive `RATELIMIT` errors on posting ("you are doing that too much. try again in X minutes") even below the API rate limit. This is Reddit's anti-spam, not API rate limiting.
- **Token refresh**: Refresh your token at ~50 minutes (not waiting for the full 60-minute expiry) to avoid race conditions.
- **S3 upload policy**: The presigned URL from `/api/media/asset.json` expires quickly (~5 seconds reported). Upload immediately.

### 7.4 Field Encoding Gotchas

- **Image URLs in `preview`**: HTML-encoded. `https://preview.redd.it/img.jpg?auto=webp&amp;s=abc` — must decode `&amp;` to `&`
- **`selftext_html`**: Contains full HTML wrapper including `<!-- SC_OFF -->` tags
- **`body_html`**: Same HTML wrapper treatment
- **Gallery `media_metadata`**: Image URLs contain HTML entities that need decoding
- **Emoji in flair**: Uses `:emoji_name:` syntax in richtext flair, rendered differently in `flair_richtext` array

### 7.5 Null vs Missing vs Empty String

Reddit is inconsistent about how it represents "no value":

| Field | No Value Representation |
|-------|------------------------|
| `author` (deleted) | `"[deleted]"` (string) |
| `replies` (none) | `""` (empty string) |
| `edited` (never) | `false` (boolean) |
| `edited` (was edited) | `1234567890.0` (float timestamp) |
| `distinguished` (none) | `null` |
| `likes` (no vote) | `null` |
| `active_user_count` (from search) | `null` |
| `suggested_comment_sort` (none) | `null` OR `""` depending on endpoint |
| `description` (empty) | `""` |
| `banned_by` (not banned) | `null` |

### 7.6 The `limit_children` Boolean Quirk

In `/api/morechildren`, the `limit_children` parameter has unusual truthy/falsy handling:
- Strings matching `/^[0Ff]/` (starts with 0, F, or f) are treated as **falsy**
- All other strings are truthy
- This is a backend Pylons framework artifact, not standard boolean parsing

### 7.7 Subreddit Name Validation

Subreddit names (`display_name`) have strict rules:
- 3-21 characters
- Only letters, numbers, and underscores
- Cannot start with underscore
- Case-insensitive for lookups but case-preserved in display

But the API sometimes accepts names that shouldn't work (like special subreddits `all`, `popular`, `friends`, `mod`) and returns 404 or unexpected behavior.

---

## 8. WebSocket / Streaming Capabilities

### 8.1 What Exists

Reddit has limited real-time capabilities accessible via the public API:

| Feature | Mechanism | Access |
|---------|-----------|--------|
| Media upload status | WebSocket (`wss://`) returned from `/api/media/asset.json` | Per-upload, auto-generated URL |
| Live threads | HTTP long-polling on `/live/{id}` | Public API |
| Live thread updates | WebSocket at `wss://` URL in thread metadata | Public, limited |

### 8.2 What Does NOT Exist in the Public API

- No general-purpose streaming endpoint (like Twitter's was)
- No real-time comment/post streams
- No WebSocket for inbox notifications
- Reddit's real-time features (chat, notifications) use the **private** GraphQL/gateway API

### 8.3 Community Workarounds for Real-Time

The common pattern for near-real-time monitoring:
1. Poll `/r/{subreddit}/new.json` every 2-5 seconds
2. Track seen post IDs to detect new content
3. Stay under rate limits (100 RPM = ~1.6 requests/second max)

**Source:** [reddit-service-websockets (archived)](https://github.com/reddit-archive/reddit-service-websockets)

---

## References

### Primary Sources
1. **[Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)** — Accessed: 2026-03-27 — Reliability: 5/5
2. **[Pyprohly/reddit-api-doc-notes — comment_tree.rst](https://github.com/Pyprohly/reddit-api-doc-notes/blob/main/docs/api-reference/comment_tree.rst)** — Accessed: 2026-03-27 — Reliability: 5/5
3. **[PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)** — Accessed: 2026-03-27 — Reliability: 5/5
4. **[Reddit API Wiki (archived)](https://github.com/reddit-archive/reddit/wiki/API)** — Accessed: 2026-03-27 — Reliability: 4/5 (outdated rate limits)

### Community & Developer Sources
5. **[reddit-api-image-upload (reverse-engineered)](https://github.com/VityaSchel/reddit-api-image-upload)** — Accessed: 2026-03-27 — Reliability: 4/5
6. **[Reddit API is such a mess — DEV Community](https://dev.to/pilcrowonpaper/reddit-api-is-such-a-mess-me2)** — Accessed: 2026-03-27 — Reliability: 4/5
7. **[Reddit Modmail API Tips — leviroth](https://gist.github.com/leviroth/dafcf1331737e2b55dd6fb86257dcb8d)** — Accessed: 2026-03-27 — Reliability: 4/5
8. **[PRAW PollData docs](https://praw.readthedocs.io/en/stable/code_overview/other/polldata.html)** — Accessed: 2026-03-27 — Reliability: 5/5
9. **[PRAW Subreddit.submit_gallery](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)** — Accessed: 2026-03-27 — Reliability: 5/5
10. **[Postiz Gallery Issue #1177](https://github.com/gitroomhq/postiz-app/issues/1177)** — Accessed: 2026-03-27 — Reliability: 3/5
11. **[PRAW Changelog v7.2.0](https://praw.readthedocs.io/en/v7.2.0/package_info/change_log.html)** — Accessed: 2026-03-27 — Reliability: 5/5
12. **[Reddit API Rate Limits — PainOnSocial](https://painonsocial.com/blog/reddit-api-rate-limits-guide)** — Accessed: 2026-03-27 — Reliability: 4/5
13. **[Reddit API Limits — Data365](https://data365.co/blog/reddit-api-limits)** — Accessed: 2026-03-27 — Reliability: 3/5
14. **[Scraping Reddit via JSON API — Simon Willison](https://til.simonwillison.net/reddit/scraping-reddit-json)** — Accessed: 2026-03-27 — Reliability: 4/5
15. **[PRAW submit_image issue #1359](https://github.com/praw-dev/praw/issues/1359)** — Accessed: 2026-03-27 — Reliability: 4/5
16. **[reddit-service-websockets (archived)](https://github.com/reddit-archive/reddit-service-websockets)** — Accessed: 2026-03-27 — Reliability: 3/5
17. **[PRAW commit 19e8d5c — selftext in galleries](https://github.com/praw-dev/praw/commit/19e8d5cf64197e30cf47fd99632d87a0f6276eac)** — Accessed: 2026-03-27 — Reliability: 5/5
18. **[Reddit API Ratelimiting Explained — LaterForReddit](https://laterforreddit.com/news/2017/03/04/reddit-api-ratelimiting-explained/)** — Accessed: 2026-03-27 — Reliability: 3/5

---

## Version History
- v1.0 (2026-03-27): Initial comprehensive research covering rate limit clarification, undocumented endpoints (gallery, poll, drafts, media upload, 15+ additional endpoints), 15+ gotchas, complete media upload flow, comment tree edge cases, deprecated endpoints, and WebSocket capabilities
