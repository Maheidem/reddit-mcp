# E05-T02: Safety Layer -- Bot Disclosure and Duplicate Detection

| Field | Value |
|-------|-------|
| **Epic** | [E05 -- Phase 1 Write Tools](EPIC.md) |
| **Status** | Not Started |
| **Size** | M |
| **Dependencies** | E05-T01 |

## Description
Bot disclosure: auto-append configurable footer to all posts/comments per Reddit Responsible Builder Policy. Duplicate detection: hash recent submissions (title+subreddit), prevent re-posts within configurable window.

## Acceptance Criteria
1. Footer appended to all submitted content
2. Footer text configurable via `REDDIT_BOT_FOOTER` env var
3. Duplicate detection catches identical title+subreddit within 5 minutes
4. Duplicate bypass with explicit `force: true` parameter

## Definition of Ready
- [ ] E05-T01 (Safety Layer -- Content Validation) is Done -- validation functions available to compose with
- [ ] Research read: FINAL-CONSOLIDATED-RESEARCH.md section 11 (Implementation Gotchas -- `api_type=json` on POST, response format inconsistencies)
- [ ] Research read: research/07-api-edge-cases-and-gotchas.md section 1 (Rate limit clarification -- burst behavior and rolling window)
- [ ] Research read: research/08-reddit-content-formatting.md section 4.1 (Content limits -- footer must not push body over 40K/10K limits)
- [ ] Understand Reddit Responsible Builder Policy: bot-operated accounts must disclose automated nature
- [ ] Understand duplicate detection strategy: in-memory hash map with TTL, key = `${subreddit}:${title}` normalized lowercase
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] Bot footer appended to all submitted content (posts, comments, messages) via `appendBotFooter()` function
- [ ] Footer text configurable via `REDDIT_BOT_FOOTER` env var with sensible default (`\n\n---\n*I am a bot. This action was performed automatically.*`)
- [ ] Footer length accounted for in content validation -- total (body + footer) must not exceed content limits
- [ ] Duplicate detection catches identical title+subreddit within configurable window (default 5 minutes / 300000ms)
- [ ] Duplicate detection bypassed with explicit `force: true` parameter
- [ ] Duplicate hash key normalized: `${subreddit.toLowerCase()}:${title.toLowerCase()}`
- [ ] In-memory TTL map auto-cleans expired entries (no memory leak)
- [ ] Unit tests cover: footer appending, custom footer, duplicate detection, duplicate bypass, TTL expiry
- [ ] `tsc --noEmit` passes
- [ ] Public API exported from `src/utils/safety.ts` barrel

## Out of Scope
Spam detection, content moderation.

## Implementation Notes
- Default footer: `\n\n---\n*I am a bot. This action was performed automatically.*`
- Duplicate detection should use a simple in-memory map with TTL (no external storage)
- Hash key: `${subreddit}:${title}` normalized to lowercase
- The 5-minute window should be configurable but default to 300000ms

## Files to Create/Modify
- `src/utils/safety.ts` -- add bot disclosure and duplicate detection to existing file
