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
- [ ] Dependencies completed
- [ ] Research sections read: FINAL section 11; research/07-api-edge-cases-and-gotchas.md
- [ ] Acceptance criteria reviewed and clear

## Definition of Done
- [ ] All acceptance criteria met
- [ ] `tsc --noEmit` passes
- [ ] Tests written and passing
- [ ] No lint warnings introduced
- [ ] Public API exported from barrel file

## Out of Scope
Spam detection, content moderation.

## Implementation Notes
- Default footer: `\n\n---\n*I am a bot. This action was performed automatically.*`
- Duplicate detection should use a simple in-memory map with TTL (no external storage)
- Hash key: `${subreddit}:${title}` normalized to lowercase
- The 5-minute window should be configurable but default to 300000ms

## Files to Create/Modify
- `src/utils/safety.ts` -- add bot disclosure and duplicate detection to existing file
