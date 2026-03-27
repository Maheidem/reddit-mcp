# E07: MCP Resources and Prompts

| Field                | Value                       |
| -------------------- | --------------------------- |
| **Status**           | Done                        |
| **Dependencies**     | E04, E05 (soft), E06 (soft) |
| **Tasks**            | 5                           |
| **Estimated Effort** | 8-14 hours                  |

## Goal

Implement 6 Resources + 4 Prompts -- making this the ONLY Reddit MCP server using all 3 MCP primitives (Tools, Resources, Prompts). Only 1 of 39 competitors uses Resources or Prompts at all. This is a major differentiator.

## Context

MCP defines three primitives: Tools (actions), Resources (data), and Prompts (templates). Nearly all MCP servers only implement Tools. By implementing all three, we provide a complete MCP experience. Resources expose Reddit data as cacheable, addressable URIs. Prompts provide workflow templates that guide LLMs to use our tools effectively.

## Research References

- FINAL-CONSOLIDATED-RESEARCH.md section: 12
- research/06-oauth-and-mcp-architecture.md
- research/09-typescript-mcp-sdk-deep-dive.md

## Task Index

| ID                                              | Title                                            | Size | Status      | Dependencies     |
| ----------------------------------------------- | ------------------------------------------------ | :--: | ----------- | ---------------- |
| [T01](E07-T01-resources-subreddit.md)           | Resources -- subreddit info and rules            |  M   | Done        | E04-T03          |
| [T02](E07-T02-resources-user-post.md)           | Resources -- user profile and post details       |  S   | Done        | E04-T05, E04-T02 |
| [T03](E07-T03-resources-wiki-me.md)             | Resources -- wiki page and authenticated user    |  S   | Done        | E04-T06, E04-T07 |
| [T04](E07-T04-prompt-research.md)               | Prompt -- `reddit_research`                      |  M   | Done        | E04              |
| [T05](E07-T05-prompts-moderate-content-user.md) | Prompts -- moderate, content_plan, user_analysis |  M   | Done        | E04, E05, E06    |

## Success Criteria

- All 6 Resources registered and accessible via MCP Inspector
- All 4 Prompts registered and visible in MCP Inspector
- Resource URIs follow `reddit://` scheme consistently
- Auth-gated resources return clear errors when unauthenticated
- Prompt templates reference correct tool names and produce actionable guidance
- This server uses all 3 MCP primitives -- unique among Reddit MCP servers
