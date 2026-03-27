# Reddit MCP Server

[![npm](https://img.shields.io/npm/v/@marcos-heidemann/reddit-mcp)](https://www.npmjs.com/package/@marcos-heidemann/reddit-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)

The most comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Reddit. 25 tools, 6 resources, 4 prompts — read, write, and moderate with zero-config anonymous access or full OAuth.

Built with TypeScript and direct HTTP to the Reddit API. No wrapper libraries, no compromises.

## Features

- **25 Tools** — Search, read posts/comments, create content, vote, message, and moderate
- **6 Resources** — Structured, cacheable data via `reddit://` URI scheme
- **4 Prompts** — Workflow templates for research, moderation, content planning, and user analysis
- **3-Tier Auth** — Zero-config anonymous browsing, auto-upgrading to app-only or full OAuth
- **Complete Moderation** — The only MCP server with modqueue, approve/remove, bans, mod log, and mod notes
- **Type-Safe** — Built with TypeScript for rock-solid reliability
- **Direct HTTP** — Full control over Reddit's 150+ endpoints, no dead library dependencies

## Installation

```bash
npm install -g @marcos-heidemann/reddit-mcp
```

Or run directly with npx (no install needed):

```bash
npx @marcos-heidemann/reddit-mcp
```

## Quick Start

**1. Zero-config (anonymous, read-only):**

```bash
npx @marcos-heidemann/reddit-mcp
```

No credentials needed. Browse, search, and read public Reddit content immediately.

**2. Full access (read + write + moderate):**

Create a Reddit script app at https://www.reddit.com/prefs/apps and set environment variables:

```bash
export REDDIT_CLIENT_ID="your_client_id"
export REDDIT_CLIENT_SECRET="your_client_secret"
export REDDIT_USERNAME="your_username"
export REDDIT_PASSWORD="your_password"
```

Then start the server:

```bash
npx @marcos-heidemann/reddit-mcp
```

## Authentication Tiers

The server auto-detects your auth tier based on which environment variables are set:

| Tier | Name | Env Vars Required | Capabilities | Rate Limit |
|------|------|-------------------|--------------|------------|
| 1 | **Anonymous** | None | Read-only public data | ~10 req/min |
| 2 | **App-Only** | `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` | Read-only public data | 100 req/min |
| 3 | **User** | All 4 credential vars | Read + Write + Moderate | 100 req/min |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDDIT_CLIENT_ID` | Tier 2+ | OAuth app client ID |
| `REDDIT_CLIENT_SECRET` | Tier 2+ | OAuth app client secret |
| `REDDIT_USERNAME` | Tier 3 | Reddit account username |
| `REDDIT_PASSWORD` | Tier 3 | Reddit account password |
| `REDDIT_USER_AGENT` | No | Custom User-Agent string (auto-generated if not set) |

### Creating a Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click **"create another app..."**
3. Select **"script"** as the app type
4. Set redirect URI to `http://localhost:8080` (not used for script apps)
5. Note the **client ID** (under the app name) and **client secret**

## Tools

### Read Tools (12)

#### `search`

Search Reddit posts by query. Optionally scope to a subreddit.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query string |
| `subreddit` | string | No | — | Subreddit to search within (without r/ prefix) |
| `sort` | `relevance` \| `hot` \| `top` \| `new` | No | `relevance` | Sort order |
| `time` | `hour` \| `day` \| `week` \| `month` \| `year` \| `all` | No | `all` | Time filter |
| `limit` | number (1-100) | No | 25 | Number of results |
| `after` | string | No | — | Pagination cursor |

**Auth:** Anonymous (Tier 1+)

#### `get_post`

Get a Reddit post by ID with full details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_id` | string | Yes | Post ID (t3_xxx or xxx) |
| `subreddit` | string | No | Subreddit name (without r/ prefix) |

**Auth:** Anonymous (Tier 1+)

#### `get_comments`

Get threaded comment tree for a post.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `post_id` | string | Yes | — | Post ID (t3_xxx or xxx) |
| `subreddit` | string | Yes | — | Subreddit name (without r/ prefix) |
| `sort` | `best` \| `top` \| `new` \| `controversial` \| `old` | No | `best` | Comment sort order |
| `depth` | number (0-10) | No | — | Maximum tree depth |
| `limit` | number (1-500) | No | 200 | Maximum comments to return |

**Auth:** Anonymous (Tier 1+)

#### `get_subreddit`

Get subreddit info including description, subscriber count, and rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/ prefix) |

**Auth:** Anonymous (Tier 1+)

#### `get_subreddit_rules`

Get structured list of subreddit rules with descriptions and scope.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/ prefix) |

**Auth:** Anonymous (Tier 1+)

#### `get_subreddit_posts`

List posts from a subreddit feed with sort and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subreddit` | string | Yes | — | Subreddit name (without r/ prefix) |
| `sort` | `hot` \| `new` \| `top` \| `rising` \| `controversial` | No | `hot` | Sort mode |
| `time` | `hour` \| `day` \| `week` \| `month` \| `year` \| `all` | No | `day` | Time filter (top/controversial only) |
| `limit` | number (1-100) | No | 25 | Number of posts |
| `after` | string | No | — | Pagination cursor |

**Auth:** Anonymous (Tier 1+)

#### `get_user`

Get a user's profile with karma, account age, and status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Reddit username (without u/ prefix) |

**Auth:** Anonymous (Tier 1+)

#### `get_user_posts`

List a user's submitted posts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `username` | string | Yes | — | Reddit username (without u/ prefix) |
| `sort` | `hot` \| `new` \| `top` | No | `new` | Sort order |
| `time` | `hour` \| `day` \| `week` \| `month` \| `year` \| `all` | No | `all` | Time filter (top only) |
| `limit` | number (1-100) | No | 25 | Number of posts |
| `after` | string | No | — | Pagination cursor |

**Auth:** Anonymous (Tier 1+)

#### `get_user_comments`

List a user's comments.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `username` | string | Yes | — | Reddit username (without u/ prefix) |
| `sort` | `hot` \| `new` \| `top` | No | `new` | Sort order |
| `time` | `hour` \| `day` \| `week` \| `month` \| `year` \| `all` | No | `all` | Time filter (top only) |
| `limit` | number (1-100) | No | 25 | Number of comments |
| `after` | string | No | — | Pagination cursor |

**Auth:** Anonymous (Tier 1+)

#### `get_trending`

Get popular subreddits with subscriber counts and descriptions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number (1-100) | No | 25 | Number of subreddits |
| `after` | string | No | — | Pagination cursor |

**Auth:** Anonymous (Tier 1+)

#### `get_wiki_page`

Read a subreddit wiki page as markdown.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/ prefix) |
| `page` | string | Yes | Wiki page name (case-sensitive, e.g., `index`, `rules`, `faq`) |

**Auth:** Anonymous (Tier 1+)

#### `get_me`

Get the authenticated user's own profile including karma, inbox count, and preferences.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters |

**Auth:** User (Tier 3) — requires `identity` scope

### Write Tools (7)

#### `create_post`

Submit a text or link post to a subreddit.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Target subreddit (without r/ prefix) |
| `title` | string | Yes | Post title (max 300 characters) |
| `text` | string | No | Self-post body in Markdown (max 40,000 chars) |
| `url` | string | No | URL for a link post |
| `flair_id` | string | No | Flair template ID |
| `nsfw` | boolean | No | Mark as NSFW |
| `spoiler` | boolean | No | Mark as spoiler |
| `force` | boolean | No | Bypass duplicate detection |

**Auth:** User (Tier 3) — requires `submit` scope

#### `create_comment`

Reply to a post or comment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent` | string | Yes | Fullname of parent (`t3_xxx` for post, `t1_xxx` for comment) |
| `text` | string | Yes | Comment text in Markdown (max 10,000 chars) |

**Auth:** User (Tier 3) — requires `submit` scope

#### `reply_message`

Reply to a private message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent` | string | Yes | Fullname of message to reply to (`t4_xxx`) |
| `text` | string | Yes | Reply text in Markdown (max 10,000 chars) |

**Auth:** User (Tier 3) — requires `privatemessages` scope

#### `edit_text`

Edit the body of your own self-post or comment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fullname` | string | Yes | Fullname of content (`t3_xxx` for post, `t1_xxx` for comment) |
| `text` | string | Yes | New body text in Markdown |

**Auth:** User (Tier 3) — requires `edit` scope

#### `delete_content`

Permanently delete your own post or comment. This cannot be undone.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fullname` | string | Yes | Fullname of content (`t3_xxx` or `t1_xxx`) |

**Auth:** User (Tier 3) — requires `edit` scope

#### `vote`

Upvote, downvote, or clear vote on a post or comment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fullname` | string | Yes | Fullname of target (`t3_xxx` for post, `t1_xxx` for comment) |
| `dir` | `-1` \| `0` \| `1` | Yes | Vote direction: 1=upvote, -1=downvote, 0=clear |

**Auth:** User (Tier 3) — requires `vote` scope

#### `send_message`

Send a private message to a Reddit user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient username (without u/ prefix) |
| `subject` | string | Yes | Message subject (max 100 chars) |
| `text` | string | Yes | Message body in Markdown (max 10,000 chars) |

**Auth:** User (Tier 3) — requires `privatemessages` scope

### Moderation Tools (6)

#### `get_modqueue`

List items pending moderator review (reported and spam-filtered).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subreddit` | string | Yes | — | Subreddit name (without r/ prefix) |
| `type` | `links` \| `comments` | No | — | Filter by content type |
| `limit` | number (1-100) | No | 25 | Number of items |
| `after` | string | No | — | Pagination cursor |

**Auth:** User (Tier 3) — requires `modposts` + `read` scopes, moderator permissions

#### `approve`

Approve content from the modqueue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Fullname of item to approve (`t3_xxx` or `t1_xxx`) |

**Auth:** User (Tier 3) — requires `modposts` scope, moderator permissions

#### `remove`

Remove content from a subreddit, optionally marking as spam.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Fullname of item to remove (`t3_xxx` or `t1_xxx`) |
| `spam` | boolean | No | Mark as spam to train the spam filter |

**Auth:** User (Tier 3) — requires `modposts` scope, moderator permissions

#### `ban_user`

Ban a user from a subreddit (temporary or permanent).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/ prefix) |
| `username` | string | Yes | Username to ban (without u/ prefix) |
| `duration` | number (0-999) | No | Ban duration in days (0 or omit for permanent) |
| `reason` | string | No | Internal mod note, max 300 chars (visible to mods only) |
| `message` | string | No | Message sent to banned user via PM |

**Auth:** User (Tier 3) — requires `modcontributors` scope, moderator permissions

#### `get_mod_log`

View moderation action history (90-day retention).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subreddit` | string | Yes | — | Subreddit name (without r/ prefix) |
| `type` | string | No | — | Filter by action type (e.g., `banuser`, `removelink`) |
| `mod` | string | No | — | Filter by moderator username (without u/ prefix) |
| `limit` | number (1-500) | No | 25 | Number of entries |
| `after` | string | No | — | Pagination cursor |

**Auth:** User (Tier 3) — requires `modlog` scope, moderator permissions

#### `get_mod_notes`

Read moderator notes for a user in a subreddit.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/ prefix) |
| `user` | string | Yes | Username to fetch notes for (without u/ prefix) |
| `filter` | enum | No | Note label filter (e.g., `BOT_BAN`, `PERMA_BAN`, `SPAM_WARNING`, `HELPFUL_USER`) |
| `before` | string | No | Pagination cursor |

**Auth:** User (Tier 3) — requires `modnote` scope, moderator permissions (rate limited to 30 req/min)

### Utility Tools (1)

#### `reddit_ping`

Check if the server is running and verify connectivity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | No | Optional message to echo back |

**Auth:** None (all tiers)

## Resources

The server exposes 6 MCP resources via the `reddit://` URI scheme:

| URI Pattern | Description | Auth |
|-------------|-------------|------|
| `reddit://subreddit/{name}/info` | Subreddit metadata (subscribers, description, settings) | Tier 1+ |
| `reddit://subreddit/{name}/rules` | Subreddit rules list | Tier 1+ |
| `reddit://user/{username}/about` | User profile (karma, account age, status) | Tier 1+ |
| `reddit://post/{id}` | Post details (title, body, score, metadata) | Tier 1+ |
| `reddit://subreddit/{name}/wiki/{page}` | Wiki page content in markdown | Tier 1+ |
| `reddit://me` | Authenticated user's profile | Tier 3 |

## Prompts

4 workflow templates for common Reddit tasks:

| Prompt | Description | Parameters |
|--------|-------------|------------|
| `reddit_research` | Deep-dive research on a topic across subreddits | `topic` (required), `subreddits` (optional, comma-separated), `time_range` (optional) |
| `reddit_moderate` | Review modqueue and take moderation actions | `subreddit` (required) |
| `reddit_content_plan` | Plan a content strategy for a subreddit | `subreddit` (required), `goal` (required) |
| `reddit_user_analysis` | Analyze a user's posting history and engagement | `username` (required) |

## MCP Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["-y", "@marcos-heidemann/reddit-mcp"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id",
        "REDDIT_CLIENT_SECRET": "your_client_secret",
        "REDDIT_USERNAME": "your_username",
        "REDDIT_PASSWORD": "your_password"
      }
    }
  }
}
```

For anonymous (read-only) access, omit the `env` block entirely.

### Claude Code

```bash
claude mcp add reddit -- npx -y @marcos-heidemann/reddit-mcp
```

Or add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["-y", "@marcos-heidemann/reddit-mcp"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id",
        "REDDIT_CLIENT_SECRET": "your_client_secret",
        "REDDIT_USERNAME": "your_username",
        "REDDIT_PASSWORD": "your_password"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["-y", "@marcos-heidemann/reddit-mcp"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id",
        "REDDIT_CLIENT_SECRET": "your_client_secret",
        "REDDIT_USERNAME": "your_username",
        "REDDIT_PASSWORD": "your_password"
      }
    }
  }
}
```

## Troubleshooting

### Authentication Errors

**"Auth tier insufficient"** — The tool requires a higher auth tier than your current configuration.

- Read tools work with Tier 1 (anonymous) — no credentials needed
- Write/mod tools require Tier 3 — set all 4 `REDDIT_*` credential env vars
- Check that `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are both set (both required for Tier 2+)

**"Invalid configuration: REDDIT_CLIENT_SECRET is set but REDDIT_CLIENT_ID is missing"** — You set the secret but forgot the client ID. Both must be provided together.

### Rate Limits

**"Rate limited"** — You've exceeded Reddit's rate limit.

- Tier 1 (anonymous): ~10 requests/minute
- Tier 2/3: 100 requests/minute
- The server includes a built-in rate limiter with automatic backoff
- Upgrade from Tier 1 to Tier 2+ for higher limits

### Permission Denied

**"Forbidden" or 403 errors on mod tools** — Your Reddit account must be a moderator of the target subreddit.

- Mod tools (`get_modqueue`, `approve`, `remove`, `ban_user`, `get_mod_log`, `get_mod_notes`) require mod permissions
- Verify you're a moderator at `https://www.reddit.com/r/YOUR_SUB/about/moderators`

### Connection Issues

**Server won't start** — Check Node.js version (`node --version`). Requires Node.js >= 18.

**MCP client can't connect** — Verify the config JSON is valid and the `command`/`args` are correct. Try running `npx @marcos-heidemann/reddit-mcp` directly in your terminal to confirm it starts.

## Development

```bash
git clone https://github.com/Maheidem/reddit-mcp.git
cd reddit-mcp
npm install
npm run build
npm test
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run test suite |
| `npm run dev` | Start in dev mode with tsx |
| `npm run lint` | Run linter |
| `npm run format` | Format code with Prettier |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes with tests
4. Ensure `npm test` and `npm run lint` pass
5. Submit a pull request

## License

[MIT](LICENSE)
