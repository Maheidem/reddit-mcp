# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-27

### Added

#### Tools (25)

**Read Tools (12):**
- `search` — Search posts across Reddit or within a subreddit
- `get_post` — Get a post by ID with full details
- `get_comments` — Get threaded comment tree for a post
- `get_subreddit` — Get subreddit info, rules, and subscriber count
- `get_subreddit_rules` — Get structured list of subreddit rules
- `get_subreddit_posts` — List posts from a feed (hot/new/top/rising/controversial)
- `get_user` — Get user profile (karma, account age, status)
- `get_user_posts` — List a user's submitted posts
- `get_user_comments` — List a user's comments
- `get_trending` — Get popular/trending subreddits
- `get_wiki_page` — Read a subreddit wiki page
- `get_me` — Get authenticated user's own profile

**Write Tools (7):**
- `create_post` — Submit a text or link post
- `create_comment` — Reply to a post or comment
- `reply_message` — Reply to a private message
- `edit_text` — Edit own self-post body or comment
- `delete_content` — Delete own post or comment
- `vote` — Upvote, downvote, or clear vote
- `send_message` — Send a private message

**Moderation Tools (6):**
- `get_modqueue` — List items pending moderator review
- `approve` — Approve content from modqueue
- `remove` — Remove content with optional spam flag
- `ban_user` — Ban user (temporary or permanent)
- `get_mod_log` — Get moderation action history
- `get_mod_notes` — Read moderator notes for a user

#### Resources (6)
- `reddit://subreddit/{name}/info` — Subreddit metadata
- `reddit://subreddit/{name}/rules` — Subreddit rules
- `reddit://user/{username}/about` — User profile
- `reddit://post/{id}` — Post details
- `reddit://subreddit/{name}/wiki/{page}` — Wiki page content
- `reddit://me` — Authenticated user's profile

#### Prompts (4)
- `reddit_research` — Deep-dive research across subreddits
- `reddit_moderate` — Review modqueue and take actions
- `reddit_content_plan` — Plan content strategy for a subreddit
- `reddit_user_analysis` — Analyze user posting history

#### Authentication
- 3-tier progressive auth: anonymous (zero-config) -> app-only -> full OAuth
- Auto-detection based on environment variables
- Token refresh at 50 minutes (in-memory only, never persisted)
- Rate limiting with automatic backoff

#### Transport
- STDIO transport (primary) for local CLI tools
- Compatible with Claude Desktop, Claude Code, and Cursor

[Unreleased]: https://github.com/Maheidem/reddit-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Maheidem/reddit-mcp/releases/tag/v1.0.0
