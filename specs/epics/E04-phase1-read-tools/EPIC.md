# E04: Phase 1 Read Tools

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Dependencies** | E02, E03 |
| **Tasks** | 8 |
| **Estimated Effort** | 14-26 hours |

## Goal
Implement all 12 Phase 1 read tools -- the foundation of the server's value that works at all auth tiers. Success means an LLM client can search Reddit, read posts and comments, explore subreddits and users, and access wiki content through well-described MCP tools.

## Context
12 read tools covering search, posts, comments, subreddits, users, wiki, and trending. Most work at anonymous tier. Implements 48% of Phase 1 tool count. These tools are the core value proposition: they let an LLM understand and navigate Reddit content.

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 2, 8, 10, 11
- research/01-reddit-official-api.md
- research/07-api-edge-cases-and-gotchas.md
- research/10-tool-inventory.md (Phase 1 Read Tools table)

## Task Index

| ID | Title | Size | Status | Dependencies |
|----|-------|:----:|--------|-------------|
| [T01](E04-T01-search-tool.md) | Search Tool | M | Not Started | E02, E03 |
| [T02](E04-T02-get-post-and-comments.md) | Get Post and Comments Tools | L | Not Started | E02, E03 |
| [T03](E04-T03-get-subreddit.md) | Get Subreddit and Rules Tools | M | Not Started | E02, E03 |
| [T04](E04-T04-get-subreddit-posts.md) | Get Subreddit Posts Tool | M | Not Started | E02, E03 |
| [T05](E04-T05-get-user.md) | Get User, Posts, and Comments Tools | M | Not Started | E02, E03 |
| [T06](E04-T06-get-trending-and-wiki.md) | Get Trending and Wiki Page Tools | S | Not Started | E02, E03 |
| [T07](E04-T07-get-me.md) | Get Me Tool | S | Not Started | E02, E03 |
| [T08](E04-T08-read-tools-registration.md) | Read Tools Registration and Barrel Export | S | Not Started | T01-T07 |

## Success Criteria
- All 12 read tools appear in MCP Inspector
- Each tool has Zod schema validation with descriptive parameter docs
- Search, post retrieval, comment trees, subreddit info, user profiles all return well-formatted data
- Pagination works via `after` cursor on listing endpoints
- Edge cases handled: private subs, deleted users, empty comment trees, NSFW content
- Tool descriptions are clear enough for an LLM to choose the right tool
