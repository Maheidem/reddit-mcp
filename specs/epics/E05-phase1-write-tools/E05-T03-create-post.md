# E05-T03: `create_post` Tool

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Epic**         | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status**       | Done                                  |
| **Size**         | L                                     |
| **Dependencies** | E05-T01, E05-T02, E03                 |

## Description

Submit text or link post. Params: `subreddit`, `title`, `text` (self), `url` (link), `flair_id` (optional), `nsfw` (optional), `spoiler` (optional). Uses `POST /api/submit`.

## Acceptance Criteria

1. Text post created with content validation applied
2. Link post created with URL
3. Bot footer appended to text posts
4. Duplicate detection active
5. Returns post fullname and URL on success
6. Handles Reddit errors (rate limit, subreddit restrictions, banned)

## Definition of Ready

- [ ] E05-T01 (Safety Layer -- Content Validation) is Done -- content validation functions available
- [ ] E05-T02 (Safety Layer -- Bot Disclosure) is Done -- bot footer and duplicate detection available
- [ ] E03 (Authentication System) is Done -- Tier 3 (user OAuth) auth guard and token management available
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 8.2 (Snudown Markdown -- always use `text` param, not RTJSON)
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.1 (always include `api_type=json` on POST requests)
- [ ] Research read: research/08-reddit-content-formatting.md section 4 (title 300 chars, body 40K chars)
- [ ] Research read: research/07-api-edge-cases-and-gotchas.md section 2 (response format: `{"json": {"data": {...}}}`)
- [ ] Understand `POST /api/submit` endpoint: `kind` = `self` or `link`, requires `submit` OAuth scope
- [ ] Acceptance criteria reviewed and clear

## Definition of Done

- [ ] Text post created with `kind=self` and body content; link post created with `kind=link` and URL
- [ ] Safety layer enforced before API call: title validated (<=300, non-empty), body validated (<=40K)
- [ ] Bot disclosure footer appended to text post body (NOT to link posts which have no body)
- [ ] Duplicate detection active: title+subreddit checked before submission
- [ ] Requires Tier 3 auth (full user OAuth) with `submit` scope -- auth guard rejects anon/app-only
- [ ] Returns post fullname (`t3_xxx`) and permalink URL on success
- [ ] Handles Reddit API errors: rate limit (429), subreddit restrictions, banned user, wrapped JSON error format
- [ ] Zod schema validates all params with descriptions: `subreddit`, `title`, `text`, `url`, `flair_id`, `nsfw`, `spoiler`
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from barrel file

## Out of Scope

Image/video/gallery/poll posts (Phase 2).

## Implementation Notes

- `kind` param: `self` for text, `link` for URL
- Response is in wrapped JSON format: `{"json": {"data": {...}}}`
- Bot footer should NOT be appended to link posts (no body text)
- Flair requires the subreddit to have flairs enabled

## Files to Create/Modify

- `src/tools/write/create-post.ts` -- tool implementation
