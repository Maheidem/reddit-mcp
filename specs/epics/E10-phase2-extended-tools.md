# E10: Phase 2 Extended Tools

## Status: Future

## Goal
Add 18 extended tools (flair, modmail, media, polls, content flags, crosspost, inbox) as opt-in capabilities beyond Phase 1's core 25.

## Dependencies
- E09 (Packaging & Release) — Phase 1 released
- User feedback incorporated

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 9, 10
- research/04-reddit-content-capabilities.md
- research/05-reddit-moderation-apis.md
- research/10-tool-inventory.md (Phase 2)

## Overview

Phase 2 adds 18 tools across 8 categories. These are **opt-in only** — not loaded by default (SDK research shows 25-30 is the sweet spot; 43 total would cause model confusion).

### Sub-Epics (Detailed breakdown deferred until Phase 1 ships)

| Sub-Epic | Tools | Category |
|----------|:-----:|----------|
| E10-A | 3 | Flair Management (`get_flair_templates`, `set_flair`, `manage_flair_template`) |
| E10-B | 3 | Modmail (`list_modmail`, `read_modmail`, `reply_modmail`) |
| E10-C | 2 | Collections (`get_collections`, `manage_collection`) |
| E10-D | 3 | Media & Polls (`upload_media`, `create_gallery_post`, `create_poll`) |
| E10-E | 5 | Content Flags (`mark_nsfw`, `mark_spoiler`, `lock`, `sticky_post`, `distinguish`) |
| E10-F | 1 | Crossposting (`crosspost`) |
| E10-G | 1 | Inbox (`get_inbox`) |

### Additional OAuth Scopes Required
```
flair modflair modmail
```

### Key Implementation Notes
- Tool groups should be loadable via configuration (e.g., `REDDIT_TOOLS=phase1,flair,modmail`)
- Media upload requires the 3-step S3 flow (documented in research/04)
- `client_credentials` grant CANNOT upload media — full OAuth required
- Modmail uses a completely separate API surface from regular messages
- Flair supports rich text format (emoji + text elements)

### Acceptance Criteria for Phase 2 Overall
1. All 18 tools implemented and tested
2. Tools are opt-in via configuration, not loaded by default
3. Phase 1 tools unaffected by Phase 2 additions
4. Additional scopes requested only when Phase 2 tools are enabled
5. Documentation updated with Phase 2 tools

## Detailed Task Breakdown
To be written after Phase 1 ships and user feedback is gathered. The sub-epic structure above provides the framework.
