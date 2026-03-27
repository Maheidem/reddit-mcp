# E05: Phase 1 Write Tools

| Field                | Value                |
| -------------------- | -------------------- |
| **Status**           | Done                 |
| **Dependencies**     | E02, E03, E04 (soft) |
| **Tasks**            | 7                    |
| **Estimated Effort** | 14-24 hours          |

## Goal

Implement all 7 Phase 1 write tools plus the safety layer (content validation, bot disclosure, duplicate detection). Write tools require full OAuth (Tier 3). The safety layer enforces the Reddit Responsible Builder Policy. Content limits: title<=300, body<=40K, comment<=10K.

## Context

Write tools are the second pillar of functionality after read tools. They require Tier 3 (user OAuth) authentication. The safety layer is critical -- it enforces content limits and bot disclosure per Reddit's Responsible Builder Policy, and prevents accidental duplicate submissions. All write operations go through validation before hitting the Reddit API.

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md sections: 8, 4.4, 11
- research/08-reddit-content-formatting.md
- research/07-api-edge-cases-and-gotchas.md
- research/10-tool-inventory.md (Phase 1 Write Tools)

## Task Index

| ID                                          | Title                                                  | Size | Status      | Dependencies                       |
| ------------------------------------------- | ------------------------------------------------------ | :--: | ----------- | ---------------------------------- |
| [T01](E05-T01-safety-content-validation.md) | Safety layer -- content validation                     |  M   | Done        | E02                                |
| [T02](E05-T02-safety-bot-disclosure.md)     | Safety layer -- bot disclosure and duplicate detection |  M   | Done        | E05-T01                            |
| [T03](E05-T03-create-post.md)               | `create_post` tool                                     |  L   | Done        | E05-T01, E05-T02, E03              |
| [T04](E05-T04-create-comment.md)            | `create_comment` and `reply_message` tools             |  M   | Done        | E05-T01, E05-T02, E03              |
| [T05](E05-T05-edit-and-delete.md)           | `edit_text` and `delete_content` tools                 |  M   | Done        | E03                                |
| [T06](E05-T06-vote-and-message.md)          | `vote` and `send_message` tools                        |  M   | Done        | E03                                |
| [T07](E05-T07-write-tools-registration.md)  | Write tools registration and integration test          |  S   | Done        | E05-T03, E05-T04, E05-T05, E05-T06 |

## Success Criteria

- All 7 write tools operational and listed in MCP Inspector
- Safety layer validates all content before submission
- Bot footer appended to all user-generated content
- Duplicate detection prevents accidental re-posts
- Auth guard rejects write tools when not Tier 3
- All Zod schemas have descriptions for every parameter
