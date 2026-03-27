# E11: Phase 3 Power User Tools

## Status: Future

## Goal
Add 17 power user tools for advanced moderation, wiki management, subreddit administration, and AutoModerator configuration. Opt-in only.

## Dependencies
- E10 (Phase 2 Extended Tools) — Phase 2 released
- User and moderator feedback incorporated

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 9, 10
- research/05-reddit-moderation-apis.md
- research/10-tool-inventory.md (Phase 3)

## Overview

Phase 3 adds 17 tools targeting power moderators, bot developers, and subreddit admins. These complete the server's coverage of Reddit's public API surface.

### Sub-Epics (Detailed breakdown deferred)

| Sub-Epic | Tools | Category |
|----------|:-----:|----------|
| E11-A | 2 | Wiki CRUD (`edit_wiki_page`, `list_wiki_pages`) |
| E11-B | 1 | AutoModerator (`manage_automod`) |
| E11-C | 1 | Removal Reasons (`manage_removal_reasons`) |
| E11-D | 2 | Subreddit Settings (`get_subreddit_settings`, `update_subreddit_settings`) |
| E11-E | 1 | Traffic Stats (`get_traffic`) |
| E11-F | 2 | Mod Notes CRUD (`create_mod_note`, `delete_mod_note`) |
| E11-G | 1 | Emoji Management (`manage_emojis`) |
| E11-H | 3 | User Management (`unban_user`, `mute_user`, `manage_contributor`) |
| E11-I | 2 | Moderation Queues (`get_reports`, `get_spam`) |
| E11-J | 1 | Rules Management (`manage_rules`) |
| E11-K | 1 | Modmail Advanced (`create_modmail`) |

### Additional OAuth Scopes Required
```
modconfig modwiki wikiedit
```

### Full OAuth Scope Set (Phase 3 = Complete)
```
read identity submit edit vote privatemessages history
wikiread wikiedit flair modflair modposts modcontributors
modlog modmail modnote modconfig modwiki
```

### Key Implementation Notes
- AutoModerator management is via wiki page editing (`/wiki/config/automoderator`) — YAML format
- Subreddit settings endpoint uses PATCH, not PUT — partial updates only
- `manage_*` tools combine CRUD operations with an `action` parameter
- Removal reasons endpoint is historically undocumented (discovered via PRAW)
- Emoji upload follows same S3 flow as media upload
- Traffic stats are mod-only and may be empty for new subreddits

### Acceptance Criteria for Phase 3 Overall
1. All 17 tools implemented and tested
2. Tools are opt-in via configuration
3. Phase 1 and Phase 2 tools unaffected
4. Complete OAuth scope coverage (18 scopes)
5. Documentation updated
6. Full competitive advantage realized (16+ unique features vs all 39 competitors)

## Detailed Task Breakdown
To be written after Phase 2 ships. The sub-epic structure above provides the framework.
