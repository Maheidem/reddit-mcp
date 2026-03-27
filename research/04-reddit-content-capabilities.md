---
title: Reddit Rich Content Features — API Capabilities Research
date: 2026-03-27
researcher: researcher-4
status: completed
confidence: high
scope: Reddit content types, media upload, polls, live threads, chat, awards, collections, crossposting, flair, and newer features
---

# Reddit Rich Content Features — API Capabilities Research

## Executive Summary

Reddit supports a diverse range of content types beyond simple text and link posts. This document provides a comprehensive analysis of each content feature, its API support level, endpoint details, and practical considerations for MCP server implementation.

**Key findings:**
1. **Media uploads** (image, video, gallery) are fully supported via a multi-step S3 upload flow through the API
2. **Polls** are supported for both creation and reading via dedicated endpoints
3. **Live threads** have a complete API surface for creation, updates, and contributor management
4. **Collections** have full CRUD API support via `/api/v1/collections/*` endpoints
5. **Crossposting** is natively supported through the `/api/submit` endpoint
6. **Awards/Gold** system was overhauled in 2024; API gilding endpoint exists but details are scarce
7. **Reddit Chat** uses SendBird (third-party) — not accessible via the standard Reddit API
8. **Reddit Talk** was permanently shut down in March 2023
9. **Community Points** (blockchain tokens) were discontinued in October 2023
10. **Flair** has comprehensive API support for both user and link flair

---

## 1. Post Submission Types

### Core Submission Endpoint

**`POST /api/submit`** — The primary endpoint for creating all post types.

| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | string | Post type: `self`, `link`, `image`, `video`, `gallery`, `poll`, `crosspost` |
| `sr` | string | Target subreddit name |
| `title` | string | Post title |
| `text` / `selftext` | string | Markdown body (for self posts) |
| `url` | string | URL for link posts or uploaded media CDN URL |
| `crosspost_fullname` | string | Source post fullname for crossposts (e.g., `t3_abc123`) |
| `nsfw` | boolean | Mark as NSFW |
| `spoiler` | boolean | Mark as spoiler |
| `flair_id` | string | Flair template ID |
| `flair_text` | string | Custom flair text |
| `send_replies` | boolean | Enable inbox replies |
| `collection_id` | string | Add directly to a collection |
| `discussion_type` | string | Set to `"CHAT"` for live discussion mode |

#### Additional Dedicated Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/submit_gallery_post.json` | POST | Submit gallery posts with multiple images |
| `POST /api/submit_poll_post` | POST | Submit poll posts |

**OAuth Scope Required:** `submit`

**Sources:**
- [Reddit API: submit (archived wiki)](https://github.com/reddit-archive/reddit/wiki/api:-submit)
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)
- [PRAW Subreddit documentation](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)

---

## 2. Media Posts (Image / Video / Gallery)

### 2.1 Image Upload Flow

Reddit uses a multi-step upload process via Amazon S3:

**Step 1: Request Upload Lease**
```
POST https://oauth.reddit.com/api/media/asset.json
Headers: Authorization: Bearer {token}
Body: filepath={filename.ext}&mimetype={mime_type}
```

Response returns:
- `args.action` — S3 upload destination URL
- `args.fields[]` — Required form fields for S3 upload
- `asset.asset_id` — Unique identifier
- `asset.websocket_url` — WebSocket URL for monitoring upload status

**Step 2: Upload to S3**
```
POST https:{args.action}
Content-Type: multipart/form-data
Body: {all fields from args.fields} + file={binary_data}
```

S3 responds with XML containing `<Location>` — the CDN URL (on `i.redd.it`).

**Step 3: Submit Post**
```
POST /api/submit
Body: kind=image&url={cdn_url}&sr={subreddit}&title={title}
```

**Step 4 (Optional): Monitor via WebSocket**
Connect to `asset.websocket_url` to receive redirect notification when post is live.

#### Supported MIME Types
| Extension | MIME Type |
|-----------|-----------|
| .jpg/.jpeg | image/jpeg |
| .png | image/png |
| .gif | image/gif |
| .mp4 | video/mp4 |
| .mov | video/quicktime |

#### Important Constraints
- **Authentication**: Requires full OAuth2 token (password or authorization_code grant). `client_credentials` grant does NOT work for media uploads.
- Only authenticated users with sufficient karma/account age can post media in many subreddits.

**Sources:**
- [reddit-api-image-upload (npm/GitHub)](https://github.com/VityaSchel/reddit-api-image-upload)
- [go-reddit-uploader](https://github.com/Mariownyou/go-reddit-uploader)

### 2.2 Video Upload

Same S3 flow as images, with additional constraints:
- **Container**: MP4 (H.264 video + AAC audio)
- **Max file size**: ~1 GB
- **Max resolution**: 1080p effective
- **Max frame rate**: ~30 fps
- **Hosting**: Videos hosted on `v.redd.it`
- **Thumbnail**: Can provide a thumbnail image path; otherwise PRAW logo is used
- **VideoGIF**: Set `videogif=True` for silent video (GIF-like behavior)
- **Timeout**: WebSocket monitoring has a default 10-second timeout (configurable)

```python
# PRAW example
reddit.subreddit("test").submit_video(
    title="My Video",
    video_path="video.mp4",
    thumbnail_path="thumb.jpg",
    videogif=False,
    timeout=10
)
```

**Source:** [PRAW submit_video documentation](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)

### 2.3 Gallery Posts (Multiple Images)

Gallery posts allow multiple images in a single post.

**Dedicated Endpoint:** `POST /api/submit_gallery_post.json`

**Gallery Data Structure:**
```json
{
  "gallery_data": {
    "items": [
      {
        "media_id": "asset_id_from_upload",
        "caption": "Optional caption",
        "outbound_url": "https://optional-link.com",
        "id": 1
      }
    ]
  }
}
```

**Process:**
1. Upload each image individually via the media asset flow (Step 1-2 above)
2. Collect `asset_id` for each uploaded image
3. Submit gallery post with `gallery_data` containing all `media_id` references

```python
# PRAW example
images = [
    {"image_path": "img1.jpg", "caption": "First image"},
    {"image_path": "img2.jpg", "caption": "Second", "outbound_url": "https://example.com"},
]
reddit.subreddit("test").submit_gallery(title="Gallery Post", images=images)
```

**Constraints:**
- Not all subreddits support gallery posts
- Each image must be uploaded separately before gallery submission
- `image_path` is required per item; `caption` and `outbound_url` are optional

**Reading Gallery Data:**
Gallery posts include `gallery_data` and `media_metadata` in the submission response:
- `submission.gallery_data['items']` — Ordered list of gallery items
- `submission.media_metadata` — Dict keyed by `media_id` with image URLs/dimensions

**Sources:**
- [PRAW submit_gallery](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)
- [Postiz gallery issue #1177](https://github.com/gitroomhq/postiz-app/issues/1177)

---

## 3. Polls

### Creating Polls

**Endpoint:** `POST /api/submit_poll_post`

Polls are created via a dedicated endpoint (not the standard `/api/submit`).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Poll title |
| `selftext` | string | Yes | Body text (can be empty string) |
| `options` | list[str] | Yes | 2-6 poll options |
| `duration` | int | Yes | Duration in days |
| `sr` | string | Yes | Target subreddit |
| `flair_id` | string | No | Flair template |
| `flair_text` | string | No | Custom flair |
| `nsfw` | bool | No | Mark NSFW |
| `spoiler` | bool | No | Mark spoiler |
| `send_replies` | bool | No | Enable notifications |
| `discussion_type` | string | No | Set to "CHAT" for live discussion |

```python
# PRAW example
reddit.subreddit("test").submit_poll(
    title="Favorite color?",
    selftext="Choose one!",
    options=["Red", "Blue", "Green"],
    duration=3  # days
)
```

### Reading Poll Data

Poll data is available on submission objects:
- `submission.poll_data.total_vote_count` — Total votes
- `submission.poll_data.options` — List of `PollOption` objects
- Each option has: `id`, `text`, `vote_count`
- `submission.poll_data.voting_end_timestamp` — When voting ends

**Limitation:** Users cannot vote on polls via the API — voting is web/app only.

**OAuth Scope:** `submit` (for creation), `read` (for reading poll data)

**Sources:**
- [PRAW PollData](https://praw.readthedocs.io/en/latest/code_overview/other/polldata.html)
- [PRAW Polls documentation](https://praw.readthedocs.io/en/v7.4.0/code_overview/other/poll.html)

---

## 4. Live Threads

Live threads provide real-time, multi-contributor updates for ongoing events.

### Complete Endpoint Surface

| Endpoint | Method | Description | OAuth Scope |
|----------|--------|-------------|-------------|
| `POST /api/live/create` | POST | Create a new live thread | `livemanage` |
| `GET /api/live/happening_now` | GET | Get currently featured live thread | `read` |
| `GET /api/live/by_id/{ids}` | GET | Get live threads by ID(s) | `read` |
| `GET /live/{id}` | GET | Get updates from a live thread | `read` |
| `GET /api/live/{id}/about` | GET | Get live thread metadata | `read` |
| `POST /api/live/{id}/update` | POST | Post an update to the thread | `livemanage` |
| `POST /api/live/{id}/strike_update` | POST | Strike-through an update | `livemanage` |
| `POST /api/live/{id}/delete_update` | POST | Delete an update | `livemanage` |
| `POST /api/live/{id}/edit` | POST | Edit thread title/description/resources | `livemanage` |
| `POST /api/live/{id}/close_thread` | POST | Close thread permanently (irreversible) | `livemanage` |
| `POST /api/live/{id}/report` | POST | Report the live thread | `report` |
| `GET /live/{id}/contributors` | GET | List contributors | `read` |
| `POST /api/live/{id}/invite_contributor` | POST | Invite a contributor | `livemanage` |
| `POST /api/live/{id}/accept_contributor_invite` | POST | Accept invitation | `livemanage` |
| `POST /api/live/{id}/leave_contributor` | POST | Leave as contributor | `livemanage` |
| `POST /api/live/{id}/rm_contributor` | POST | Remove a contributor | `livemanage` |
| `POST /api/live/{id}/rm_contributor_invite` | POST | Revoke invitation | `livemanage` |
| `POST /api/live/{id}/set_contributor_permissions` | POST | Set contributor permissions | `livemanage` |
| `POST /api/live/{id}/hide_discussion` | POST | Hide discussion linked to thread | `livemanage` |
| `POST /api/live/{id}/unhide_discussion` | POST | Unhide discussion | `livemanage` |
| `GET /live/{id}/discussions` | GET | Get discussions about this thread | `read` |

### Create Parameters
| Parameter | Description |
|-----------|-------------|
| `title` | Thread title |
| `description` | Thread description (markdown) |
| `resources` | Sidebar resources (markdown) |
| `nsfw` | Mark as NSFW |

### Key Behaviors
- **Updates cannot be edited** — they can only be struck through or deleted
- **Closing is irreversible** — once closed, no further updates can be posted
- **WebSocket support** — Real-time update streaming via WebSocket connections
- **Pagination** — Up to 100 historical updates initially, then streaming
- **Karma requirement** — Creating live threads requires 100+ karma

```python
# PRAW examples
thread = reddit.live.create(title="Breaking News", description="Details...")
thread.contrib.add("New update text")
thread.contrib.strike(update_id)
thread.contrib.close()
```

**Sources:**
- [JRAW Live Threads](https://mattbdean.gitbooks.io/jraw/content/live_threads.html)
- [PRAW LiveThread](https://praw.readthedocs.io/en/latest/code_overview/models/livethread.html)
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)

---

## 5. Reddit Chat

### Architecture

Reddit Chat is **NOT accessible via the standard Reddit API**. It is powered by **SendBird**, a third-party chat infrastructure provider.

### Technical Details (Reverse-Engineered)

| Component | Detail |
|-----------|--------|
| **Service URL** | `https://sendbird.reddit.com` |
| **SendBird App ID** | `2515BDA8-9D3A-47CF-9325-330BC37ADA13` |
| **Auth Endpoint** | `/api/v1/sendbird/me` — retrieves SendBird access token |
| **Config Endpoint** | `/api/v1/sendbird/config` — obtains proxy host |
| **WebSocket Protocol** | `wss://{proxyHost}` for real-time messaging |
| **HTTP Protocol** | `https://{proxyHost}` for standard requests |

### Authentication Flow
1. Obtain Reddit OAuth2 token (MUST be full personalized token — script app tokens don't work)
2. Call `/api/v1/sendbird/me` with Reddit token to get SendBird access token
3. Use SendBird SDK to connect via WebSocket

### Capabilities (via SendBird SDK)
- Create/list group channels
- Send user messages
- Real-time message streaming
- Channel management

### MCP Implications
- **Cannot be implemented via standard Reddit API**
- Would require reverse-engineering SendBird integration
- Against Reddit ToS to use undocumented internal APIs
- **Recommendation: Exclude from MCP server scope** or mark as experimental/unsupported

**Sources:**
- [Reddit Chat reverse engineering gist](https://gist.github.com/sim642/225c44801a376e2c54e746285d4c680f)
- [Reddit Chat bot (Bishop)](https://github.com/Bishop98/--Bishop)

---

## 6. Awards / Gold / Gilding

### System History
- **Pre-2023**: Complex awards system with Coins currency, many award types
- **September 2023**: Reddit shut down the entire awards system and Coins
- **May 2024**: Reddit reintroduced a simplified awards system with "Gold" as currency

### Current System (Post-May 2024)
- Users purchase Gold with real money ($1.99-$49.00)
- Six award types, costing 15-50 Gold each
- Top contributors can earn Gold through the Gold Program
- Gold earned can be converted to real money (at threshold)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/v1/gold/gild/{fullname}` | POST | Gild a post or comment |
| `POST /api/v1/gold/give/{username}` | POST | Give gold to a user |

**OAuth Scope:** `creddits` (for gilding)

### MCP Implications
- Gilding endpoints exist but the exact behavior with the new Gold system is poorly documented
- The new system may have different parameters than the legacy endpoints
- **Recommendation:** Support reading award data on posts/comments; gilding support should be marked experimental
- Award data is available in submission/comment responses: `all_awardings`, `gilded`, `gildings`

**Sources:**
- [Reddit reintroduces awards (WinBuzzer)](https://winbuzzer.com/2024/05/19/reddit-reintroduces-awards-system-with-new-features-xcxwbn/)
- [Reddit awards return (TechCrunch)](https://techcrunch.com/2024/05/16/reddit-reintroduces-its-awards-system/)
- [JRAW endpoints](https://github.com/mattbdean/JRAW/blob/master/ENDPOINTS.md)

---

## 7. Collections

Collections are moderator-curated groups of posts within a subreddit.

### Complete Endpoint Surface

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/v1/collections/collection` | GET | Get a collection by UUID |
| `GET /api/v1/collections/subreddit_collections` | GET | List all collections in a subreddit |
| `POST /api/v1/collections/create_collection` | POST | Create a new collection |
| `POST /api/v1/collections/delete_collection` | POST | Delete a collection |
| `POST /api/v1/collections/add_post_to_collection` | POST | Add a post to collection |
| `POST /api/v1/collections/remove_post_in_collection` | POST | Remove a post from collection |
| `POST /api/v1/collections/reorder_collection` | POST | Reorder posts in collection |
| `POST /api/v1/collections/update_collection_title` | POST | Update collection title |
| `POST /api/v1/collections/update_collection_description` | POST | Update collection description |
| `POST /api/v1/collections/update_collection_display_layout` | POST | Change display layout |
| `POST /api/v1/collections/follow_collection` | POST | Follow/unfollow a collection |

### Requirements
- **Permission:** Moderators with "Manage Posts & Comments" permission
- **OAuth Scope:** `modposts` (for modification), `read` (for viewing)

```python
# PRAW examples
# List collections
collections = reddit.subreddit("test").collections
# Create
collection = reddit.subreddit("test").collections.mod.create(title="My Collection", description="Desc")
# Add post
collection.mod.add_post(submission)
# Reorder
collection.mod.reorder([submission1, submission2])
# Delete
collection.mod.delete()
```

**Sources:**
- [PRAW Collection](https://praw.readthedocs.io/en/stable/code_overview/other/collection.html)
- [PRAW CollectionModeration](https://praw.readthedocs.io/en/stable/code_overview/other/collectionmoderation.html)
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)
- [Reddit Mods: Collections](https://mods.reddithelp.com/hc/en-us/articles/360027311431-Collections)

---

## 8. Crossposting

Crossposting shares an existing post to a different subreddit.

### Endpoint
`POST /api/submit` with `kind=crosspost`

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | string | Must be `"crosspost"` |
| `crosspost_fullname` | string | Full ID of source post (e.g., `t3_abc123`) |
| `sr` | string | Target subreddit |
| `title` | string | Title for the crosspost |
| `nsfw` | bool | Optional NSFW flag |
| `spoiler` | bool | Optional spoiler flag |
| `flair_id` | string | Optional flair |
| `send_replies` | bool | Optional notification setting |

```python
# PRAW example
source = reddit.submission("abc123")
source.crosspost(subreddit="other_sub", title="Check this out")
```

### Constraints
- Some subreddits disable crossposting
- Must have posting permission in target subreddit
- Original post must allow crossposting (`is_crosspostable` attribute)

**OAuth Scope:** `submit`

**Sources:**
- [Reddit.NET Crosspost example](https://github.com/sirkris/Reddit.NET/blob/master/docs/examples/cs/Crosspost.md)
- [PRAW Submission documentation](https://praw.readthedocs.io/en/latest/code_overview/models/submission.html)

---

## 9. Flair (Post & User)

### Complete Endpoint Surface

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /r/{sub}/api/flair/` | POST | Set user flair |
| `POST /r/{sub}/api/flairconfig/` | POST | Configure flair settings |
| `POST /r/{sub}/api/flaircsv/` | POST | Bulk set user flair via CSV |
| `GET /r/{sub}/api/flairlist/` | GET | List all assigned user flair |
| `POST /r/{sub}/api/flairselector/` | POST | Get available flair options |
| `POST /r/{sub}/api/flairtemplate_v2` | POST | Create/update flair template |
| `POST /r/{sub}/api/clearflairtemplates/` | POST | Clear all flair templates |
| `POST /r/{sub}/api/deleteflairtemplate/` | POST | Delete specific template |
| `POST /r/{sub}/api/flair_template_order` | POST | Reorder templates |
| `GET /r/{sub}/api/link_flair_v2` | GET | Get link flair templates |
| `GET /r/{sub}/api/user_flair_v2` | GET | Get user flair templates |
| `POST /r/{sub}/api/selectflair/` | POST | Apply flair to post/user |
| `POST /r/{sub}/api/deleteflair` | POST | Remove flair |

### OAuth Scopes
- `flair` — Set own flair
- `modflair` — Manage all flair (moderator)

### Flair Data in Responses
Posts and comments include flair fields:
- `link_flair_text`, `link_flair_richtext`, `link_flair_background_color`, `link_flair_text_color`
- `author_flair_text`, `author_flair_richtext`, `author_flair_background_color`

**Sources:**
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)
- [PRAW Subreddit flair documentation](https://praw.readthedocs.io/en/latest/code_overview/models/subreddit.html)

---

## 10. Post Content Modifiers

### Endpoints for Post State Changes

| Endpoint | Method | Description | Scope |
|----------|--------|-------------|-------|
| `POST /api/marknsfw/` | POST | Mark post as NSFW | `modposts` |
| `POST /api/unmarknsfw/` | POST | Remove NSFW marking | `modposts` |
| `POST /api/spoiler/` | POST | Mark as spoiler | `modposts` |
| `POST /api/unspoiler/` | POST | Remove spoiler marking | `modposts` |
| `POST /api/lock/` | POST | Lock post/comment | `modposts` |
| `POST /api/unlock/` | POST | Unlock post/comment | `modposts` |
| `POST /api/set_subreddit_sticky/` | POST | Sticky/unsticky a post | `modposts` |
| `POST /api/set_contest_mode/` | POST | Toggle contest mode | `modposts` |
| `POST /api/distinguish/` | POST | Distinguish as mod/admin | `modposts` |
| `POST /api/set_original_content` | POST | Mark as OC | `modposts` |

### Live Discussion Mode
Posts can be created with `discussion_type="CHAT"` to enable live discussion/chat mode:
- Supported on `submit()`, `submit_image()`, `submit_video()`, and `submit_poll()`
- Comments appear in real-time chat format
- Added in PRAW 7.2.0

**Sources:**
- [PRAW Submission](https://praw.readthedocs.io/en/latest/code_overview/models/submission.html)
- [PRAW changelog 7.2.0](https://praw.readthedocs.io/en/v7.2.0/package_info/change_log.html)

---

## 11. Discontinued / Unavailable Features

### Reddit Talk (Audio Rooms) — SHUT DOWN
- **Status:** Permanently shut down on March 21, 2023
- **Reason:** Third-party audio vendor discontinued service; costs too high to transition
- **API:** No API endpoints exist/remain
- **Future:** Reddit stated intent to bring audio back eventually, but no timeline
- **MCP Impact:** Cannot implement. Do not include.

**Sources:**
- [Reddit Talk shutdown (TechCrunch)](https://techcrunch.com/2023/03/09/reddit-is-shutting-down-its-clubhouse-clone-reddit-talk/)
- [Reddit Talk shutdown (Social Media Today)](https://www.socialmediatoday.com/news/Reddit-Shuts-Down-Reddit-Talks/644606/)

### Community Points (Blockchain Tokens) — DISCONTINUED
- **Status:** Discontinued November 8, 2023
- **Tokens:** MOONS (r/Cryptocurrency), BRICKS (r/Fortnite), DONUTS (r/Ethtrader)
- **Reason:** Scalability challenges and regulatory concerns
- **API:** All Community Points API endpoints removed
- **MCP Impact:** Cannot implement. Do not include.

**Sources:**
- [Reddit kills Community Points (TechCrunch)](https://techcrunch.com/2023/10/17/reddit-is-phasing-out-community-points-blockchain-rewards/)
- [Community Points discontinuation (CryptoSlate)](https://cryptoslate.com/reddit-ends-community-points-says-theres-no-path-to-scaling-it/)

### Scheduled Posts
- Reddit has a native scheduled/recurring posts feature for moderators
- **No API parameter** (`send_at` or similar) exists on `/api/submit`
- Scheduling is done through the Reddit web UI only
- Third-party services (Later for Reddit, Cronnit) implement scheduling by holding posts and submitting at the designated time

---

## 12. Newer Content Features (2024-2025)

### Comments-to-Posts
- Reddit added the ability to turn comments into standalone posts (2025)
- API support details not yet documented

### AI-Powered Reddit Answers
- Subreddit-scoped AI answers feature
- Internal feature, not API-accessible

### Image Comments
- Not yet available as of research date
- Has been discussed but not widely rolled out

### Updated Community Stats
- Enhanced stats endpoints for community activity
- Available through subreddit `about` endpoints

---

## 13. API Capability Matrix

### Content Creation Capabilities

| Feature | API Support | Endpoint | OAuth Scope | Notes |
|---------|------------|----------|-------------|-------|
| Text Post | Full | `/api/submit` (kind=self) | `submit` | Markdown body support |
| Link Post | Full | `/api/submit` (kind=link) | `submit` | URL required |
| Image Post | Full | `/api/media/asset.json` + `/api/submit` | `submit` | Multi-step S3 upload |
| Video Post | Full | `/api/media/asset.json` + `/api/submit` | `submit` | MP4/H.264 only, ~1GB max |
| Gallery Post | Full | `/api/media/asset.json` + `/api/submit_gallery_post.json` | `submit` | Upload each image first |
| Poll Post | Full | `/api/submit_poll_post` | `submit` | 2-6 options, duration in days |
| Crosspost | Full | `/api/submit` (kind=crosspost) | `submit` | Needs source fullname |
| Live Discussion | Full | `/api/submit` (discussion_type=CHAT) | `submit` | Chat-style comments |
| Scheduled Post | None | N/A | N/A | Web UI only |

### Content Reading Capabilities

| Feature | API Support | Notes |
|---------|------------|-------|
| Text/Link Posts | Full | Standard listing endpoints |
| Image/Video Media | Full | URLs in `url`, `media`, `preview` fields |
| Gallery Data | Full | `gallery_data` + `media_metadata` fields |
| Poll Results | Full | `poll_data` on submission object |
| Awards on Content | Full | `all_awardings`, `gilded`, `gildings` fields |
| Flair Data | Full | `link_flair_*`, `author_flair_*` fields |
| Live Thread Updates | Full | Streaming + historical retrieval |
| Collection Contents | Full | List posts in collection |

### Content Management Capabilities

| Feature | API Support | Required Permission |
|---------|------------|-------------------|
| Crosspost | Full | Post access in target sub |
| Collections CRUD | Full | Moderator (Manage Posts) |
| Flair Management | Full | Moderator (Manage Flair) |
| Live Thread Mgmt | Full | Thread contributor/creator |
| Mark NSFW/Spoiler | Full | Post author or moderator |
| Lock/Sticky | Full | Moderator |
| Gilding | Partial | Requires Gold/credits |
| Reddit Chat | None | SendBird (external) |
| Reddit Talk | Discontinued | N/A |
| Vote on Polls | None | Web/app only |
| Scheduled Posts | None | Web UI only |

---

## 14. MCP Tool Design Recommendations

### High-Priority Tools (Full API Support)

1. **submit_text_post** — Create self/text posts
2. **submit_link_post** — Create link posts
3. **submit_image_post** — Upload and submit image posts (multi-step)
4. **submit_video_post** — Upload and submit video posts
5. **submit_gallery_post** — Upload multiple images and submit gallery
6. **submit_poll** — Create poll posts
7. **crosspost** — Crosspost to another subreddit
8. **read_poll_results** — Read poll options and vote counts
9. **manage_flair** — Set/get flair on posts and users
10. **manage_collections** — Create, update, add/remove posts from collections

### Medium-Priority Tools (Useful but Niche)

11. **create_live_thread** — Create and manage live threads
12. **post_live_update** — Add updates to live threads
13. **mark_nsfw_spoiler** — Toggle NSFW/spoiler/OC flags
14. **sticky_post** — Sticky/unsticky posts
15. **enable_live_discussion** — Create posts with CHAT mode

### Low-Priority / Experimental

16. **gild_content** — Give awards (uncertain API behavior post-2024)
17. **read_awards** — Read award data from posts/comments

### Excluded (No API Support)

- Reddit Chat (SendBird external)
- Reddit Talk (discontinued)
- Community Points (discontinued)
- Scheduled Posts (no API parameter)
- Poll Voting (web/app only)

---

## 15. References

### Primary Sources (Official Documentation)
1. **[Reddit API Documentation](https://www.reddit.com/dev/api/)** — Official endpoint reference (access limited)
   - Accessed: 2026-03-27
   - Type: Official Documentation
   - Reliability: 5/5

2. **[Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)** — Official developer wiki
   - Accessed: 2026-03-27
   - Type: Official Documentation
   - Reliability: 5/5

3. **[Reddit Mod Help: Collections](https://mods.reddithelp.com/hc/en-us/articles/360027311431-Collections)** — Official collections documentation
   - Accessed: 2026-03-27
   - Type: Official Documentation
   - Reliability: 5/5

### Secondary Sources (Library Documentation)
4. **[PRAW Documentation](https://praw.readthedocs.io/en/latest/)** — Python Reddit API Wrapper
   - Accessed: 2026-03-27
   - Type: Library Documentation
   - Reliability: 5/5

5. **[PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)** — Complete endpoint mapping
   - Accessed: 2026-03-27
   - Type: Source Code
   - Reliability: 5/5

6. **[JRAW Endpoints](https://github.com/mattbdean/JRAW/blob/master/ENDPOINTS.md)** — Java wrapper endpoint list
   - Accessed: 2026-03-27
   - Type: Library Documentation
   - Reliability: 4/5

7. **[JRAW Live Threads](https://mattbdean.gitbooks.io/jraw/content/live_threads.html)** — Live thread operations
   - Accessed: 2026-03-27
   - Type: Library Documentation
   - Reliability: 4/5

### Community Sources (Reverse Engineering & Discussion)
8. **[Reddit Chat Reverse Engineering](https://gist.github.com/sim642/225c44801a376e2c54e746285d4c680f)** — SendBird integration details
   - Accessed: 2026-03-27
   - Type: Community Research
   - Reliability: 3/5

9. **[reddit-api-image-upload](https://github.com/VityaSchel/reddit-api-image-upload)** — Media upload flow documentation
   - Accessed: 2026-03-27
   - Type: Community Library
   - Reliability: 4/5

10. **[Reddit.NET Crosspost](https://github.com/sirkris/Reddit.NET/blob/master/docs/examples/cs/Crosspost.md)** — Crosspost implementation
    - Accessed: 2026-03-27
    - Type: Library Example
    - Reliability: 4/5

### News Sources (Feature Changes)
11. **[Reddit Talk Shutdown (TechCrunch)](https://techcrunch.com/2023/03/09/reddit-is-shutting-down-its-clubhouse-clone-reddit-talk/)** — Talk discontinuation
    - Accessed: 2026-03-27
    - Type: News Article
    - Reliability: 5/5

12. **[Reddit Awards Return (TechCrunch)](https://techcrunch.com/2024/05/16/reddit-reintroduces-its-awards-system/)** — Awards system relaunch
    - Accessed: 2026-03-27
    - Type: News Article
    - Reliability: 5/5

13. **[Community Points Discontinued (CryptoSlate)](https://cryptoslate.com/reddit-ends-community-points-says-theres-no-path-to-scaling-it/)** — Blockchain tokens removed
    - Accessed: 2026-03-27
    - Type: News Article
    - Reliability: 4/5

14. **[Video Upload Guide (TechEvangelist)](https://techevangelistseo.com/reddit-api-documentation-encoding-limitations/)** — Video format requirements
    - Accessed: 2026-03-27
    - Type: Technical Blog
    - Reliability: 3/5

15. **[Reddit API Guide (Zernio)](https://zernio.com/blog/reddit-api-documentation)** — General API overview
    - Accessed: 2026-03-27
    - Type: Technical Blog
    - Reliability: 3/5

---

*Document version: 1.0 | Date: 2026-03-27 | Researcher: researcher-4*
