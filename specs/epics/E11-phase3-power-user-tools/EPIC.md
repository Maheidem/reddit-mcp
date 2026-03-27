# E11: Phase 3 Power User Tools

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| **Status**           | Future                                       |
| **Dependencies**     | E10 (Phase 2 released)                       |
| **Tasks**            | 17 (across 11 sub-epics, breakdown deferred) |
| **Estimated Effort** | TBD (after Phase 2 ships)                    |

## Goal

Add 17 power user tools for advanced moderation, wiki management, subreddit administration, and AutoModerator configuration. Completes Reddit API coverage.

## Context

11 sub-epics targeting power moderators, bot developers, and subreddit admins. Additional OAuth scopes required: `modconfig`, `modwiki`, `wikiedit`. Full scope set after Phase 3 = 18 scopes total.

Key constraints:

- AutoModerator management is via wiki page editing (`/wiki/config/automoderator`) — YAML format
- Subreddit settings endpoint uses PATCH, not PUT — partial updates only
- `manage_*` tools combine CRUD operations with an `action` parameter
- Removal reasons endpoint is historically undocumented (discovered via PRAW)
- Emoji upload follows same S3 flow as media upload
- Traffic stats are mod-only and may be empty for new subreddits

### Full OAuth Scope Set (Phase 3 = Complete)

```
read identity submit edit vote privatemessages history
wikiread wikiedit flair modflair modposts modcontributors
modlog modmail modnote modconfig modwiki
```

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 9, 10
- research/05-reddit-moderation-apis.md
- research/10-tool-inventory.md (Phase 3)

## Task Index

| Sub-Epic | Tools | Category                                                                   | Status |
| -------- | :---: | -------------------------------------------------------------------------- | ------ |
| E11-A    |   2   | Wiki CRUD (`edit_wiki_page`, `list_wiki_pages`)                            | Future |
| E11-B    |   1   | AutoModerator (`manage_automod`)                                           | Future |
| E11-C    |   1   | Removal Reasons (`manage_removal_reasons`)                                 | Future |
| E11-D    |   2   | Subreddit Settings (`get_subreddit_settings`, `update_subreddit_settings`) | Future |
| E11-E    |   1   | Traffic Stats (`get_traffic`)                                              | Future |
| E11-F    |   2   | Mod Notes CRUD (`create_mod_note`, `delete_mod_note`)                      | Future |
| E11-G    |   1   | Emoji Management (`manage_emojis`)                                         | Future |
| E11-H    |   3   | User Management (`unban_user`, `mute_user`, `manage_contributor`)          | Future |
| E11-I    |   2   | Moderation Queues (`get_reports`, `get_spam`)                              | Future |
| E11-J    |   1   | Rules Management (`manage_rules`)                                          | Future |
| E11-K    |   1   | Modmail Advanced (`create_modmail`)                                        | Future |

_Detailed task files will be created after Phase 2 ships._

## Success Criteria

- All 17 tools implemented and tested
- Tools are opt-in via configuration
- Phase 1 and Phase 2 tools unaffected
- Complete OAuth scope coverage (18 scopes)
- Documentation updated
- Full competitive advantage realized (16+ unique features vs all 39 competitors)
