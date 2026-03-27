# E10: Phase 2 Extended Tools

| Field | Value |
|-------|-------|
| **Status** | Future |
| **Dependencies** | E09 (Phase 1 released) |
| **Tasks** | 18 (across 7 sub-epics, breakdown deferred) |
| **Estimated Effort** | TBD (after Phase 1 ships) |

## Goal
Add 18 extended tools (flair, modmail, media, polls, content flags, crosspost, inbox) as opt-in capabilities beyond Phase 1's core 25.

## Context
Opt-in only — not loaded by default (SDK research shows 25-30 is the sweet spot; 43 total would cause model confusion). Tool groups loadable via configuration (e.g., `REDDIT_TOOLS=phase1,flair,modmail`). Additional OAuth scopes required: `flair`, `modflair`, `modmail`.

Key constraints:
- `client_credentials` grant cannot upload media — full OAuth required for media tools
- Modmail uses a completely separate API surface from regular messages
- Flair supports rich text format (emoji + text elements)
- Media upload requires the 3-step S3 flow (documented in research/04)

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 9, 10
- research/04-reddit-content-capabilities.md
- research/05-reddit-moderation-apis.md
- research/10-tool-inventory.md (Phase 2)

## Task Index

| Sub-Epic | Tools | Category | Status |
|----------|:-----:|----------|--------|
| E10-A | 3 | Flair Management (`get_flair_templates`, `set_flair`, `manage_flair_template`) | Future |
| E10-B | 3 | Modmail (`list_modmail`, `read_modmail`, `reply_modmail`) | Future |
| E10-C | 2 | Collections (`get_collections`, `manage_collection`) | Future |
| E10-D | 3 | Media & Polls (`upload_media`, `create_gallery_post`, `create_poll`) | Future |
| E10-E | 5 | Content Flags (`mark_nsfw`, `mark_spoiler`, `lock`, `sticky_post`, `distinguish`) | Future |
| E10-F | 1 | Crossposting (`crosspost`) | Future |
| E10-G | 1 | Inbox (`get_inbox`) | Future |

*Detailed task files will be created after Phase 1 ships and user feedback is gathered.*

## Success Criteria
- All 18 tools implemented and tested
- Tools are opt-in via configuration, not loaded by default
- Phase 1 tools unaffected by Phase 2 additions
- Additional scopes requested only when Phase 2 tools are enabled
- Documentation updated with Phase 2 tools
