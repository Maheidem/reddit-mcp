# E04-T02: Get Post and Comments Tools

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Epic**         | [E04 — Phase 1 Read Tools](EPIC.md) |
| **Status**       | Done                         |
| **Size**         | L                                   |
| **Dependencies** | E02, E03                            |

## Description

Get post by ID with full details. Get comment tree with sort and depth control. Handle the `replies` field quirk. Uses `GET /r/{sub}/comments/{id}`.

## Acceptance Criteria

1. Post retrieved by fullname (`t3_xxx`) or bare ID
2. Comments sorted by best/top/new/controversial/old
3. Depth parameter respected
4. `replies: ""` handled without crash
5. "More" comment stubs indicated in response

## Definition of Ready

- [ ] E02 (Core Infrastructure) is Done — HTTP client, rate limiter, error parser, types available
- [ ] E03 (Authentication System) is Done — auth manager and auth guard available for tier checking
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 2.3 (Thing Types) — understand t1 (Comment) and t3 (Link/Post) fullname formats
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.4 (The `replies` Field Problem) — `replies` is `""` (empty string) when no replies, not null
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.5 (Null vs Missing vs Empty String) — `author="[deleted]"`, `edited=false` vs float timestamp
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.6 (Comment Tree Gotchas) — "more" objects have two types: "Load more" vs "Continue thread"
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.9 (Deleted Content Detection) — `[deleted]` vs `[removed]` distinction
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11.11 (Subreddit Name Mismatch) — mismatched subreddit returns empty listing with 200 OK
- [ ] Research read: research/07-api-edge-cases-and-gotchas.md — full comment tree edge cases
- [ ] Understand the specific Reddit API endpoint: `GET /r/{sub}/comments/{id}` returns 2-element array: `[post_listing, comment_listing]`

## Definition of Done

- [ ] `get_post` tool registered with `McpServer.tool()` — retrieves post by fullname (`t3_xxx`) or bare ID
- [ ] `get_comments` tool registered with `McpServer.tool()` — retrieves comment tree with sort and depth control
- [ ] Comments sorted by best/top/new/controversial/old via sort parameter
- [ ] Depth parameter respected for limiting comment tree depth
- [ ] `replies: ""` handled without crash — empty string treated as no replies
- [ ] "More" comment stubs indicated in response (kind, count, children list)
- [ ] Deleted/removed content detected: `[deleted]` author, `[removed]` body
- [ ] Zod schemas validate all params with LLM-readable descriptions
- [ ] Error cases return `isError: true` (invalid post ID, nonexistent post)
- [ ] `raw_json=1` included in request
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Unit tests cover: basic post retrieval, comment tree parsing, `replies=""` edge case, "more" stubs, deleted content
- [ ] No lint warnings introduced
- [ ] Public API exported from `src/tools/read/index.ts` barrel file

## Out of Scope

Expanding "more comments" (that's a separate API call, potentially Phase 2).

## Implementation Notes

- API returns a 2-element array: `[post_listing, comment_listing]`
- Comment `replies` field is `""` (empty string) when there are no replies, not null/undefined
- "More" objects have `kind: "more"` and contain a list of comment IDs that weren't fetched
- This is the largest task because it handles the most complex Reddit data structure (nested comment trees)
- Consider separate `get_post` and `get_comments` MCP tools, or a combined tool with options

## Files to Create/Modify

- `src/tools/read/get-post.ts` — get post tool
- `src/tools/read/get-comments.ts` — get comments tool
- `src/tools/read/index.ts` — export both tools
- `src/__tests__/tools/read/get-post.test.ts` — tests with mocked responses
- `src/__tests__/tools/read/get-comments.test.ts` — tests including replies="" edge case
