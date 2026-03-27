# Usage Transcript — Reddit MCP Server

Realistic examples of tool calls and responses for the Reddit MCP Server.

## Read Tool: `search`

**Request:**
```json
{
  "tool": "search",
  "arguments": {
    "q": "best practices TypeScript",
    "subreddit": "programming",
    "sort": "top",
    "time": "month",
    "limit": 3
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 results for \"best practices TypeScript\" in r/programming:\n\n1. **TypeScript 5.8 Released: What You Need to Know** (score: 2,847)\n   by u/ts_dev • 15 days ago\n   https://reddit.com/r/programming/comments/abc123\n\n2. **Our team's TypeScript best practices after 3 years** (score: 1,203)\n   by u/senior_eng • 22 days ago\n   https://reddit.com/r/programming/comments/def456\n\n3. **Stop using `any` — a guide to strict TypeScript** (score: 891)\n   by u/type_safety • 28 days ago\n   https://reddit.com/r/programming/comments/ghi789\n\nafter: t3_ghi789"
    }
  ]
}
```

## Write Tool: `create_post`

**Request:**
```json
{
  "tool": "create_post",
  "arguments": {
    "subreddit": "test",
    "title": "Testing the Reddit MCP Server",
    "text": "This post was created using the Reddit MCP Server via Claude.\n\nIt supports full Markdown formatting."
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Post created successfully.\n\nTitle: Testing the Reddit MCP Server\nID: t3_xyz789\nURL: https://www.reddit.com/r/test/comments/xyz789/testing_the_reddit_mcp_server/\nSubreddit: r/test"
    }
  ]
}
```

## Moderation Tool: `get_modqueue`

**Request:**
```json
{
  "tool": "get_modqueue",
  "arguments": {
    "subreddit": "mysubreddit",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Modqueue for r/mysubreddit (3 items):\n\n1. [Post] \"Free giveaway - click here!!!\" by u/spammer42\n   ID: t3_abc111 • Reports: 4 • Reason: spam\n   Submitted: 2 hours ago\n\n2. [Comment] by u/rude_person on \"Community discussion thread\"\n   ID: t1_def222 • Reports: 2 • Reason: harassment\n   \"This is a rude comment that breaks rules\"\n   Submitted: 5 hours ago\n\n3. [Post] \"Is this allowed?\" by u/new_user\n   ID: t3_ghi333 • Reports: 1 • Reason: other\n   Submitted: 1 day ago"
    }
  ]
}
```

## Moderation Tool: `approve`

**Request:**
```json
{
  "tool": "approve",
  "arguments": {
    "id": "t3_ghi333"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Approved t3_ghi333 successfully. Item removed from modqueue."
    }
  ]
}
```

## Resource: `reddit://subreddit/typescript/info`

**Response:**
```json
{
  "contents": [
    {
      "uri": "reddit://subreddit/typescript/info",
      "mimeType": "application/json",
      "text": "{\"name\":\"typescript\",\"title\":\"TypeScript\",\"description\":\"TypeScript is a language for application-scale JavaScript.\",\"subscribers\":312000,\"active_users\":1250,\"created_utc\":1349544000,\"public\":true,\"nsfw\":false}"
    }
  ]
}
```

## Prompt: `reddit_research`

**Request:**
```json
{
  "prompt": "reddit_research",
  "arguments": {
    "topic": "MCP server development",
    "subreddits": "ClaudeAI,LocalLLaMA",
    "time_range": "month"
  }
}
```

The prompt generates a multi-step research workflow that guides the AI to:
1. Search each subreddit for the topic
2. Read the top posts and comments
3. Synthesize findings into a structured research summary

## Minimal Config (Anonymous, Read-Only)

No credentials needed. Start with:

```bash
npx @marcos-heidemann/reddit-mcp
```

Claude Desktop config (no `env` block):

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["-y", "@marcos-heidemann/reddit-mcp"]
    }
  }
}
```

This gives access to all 12 read tools, 5 resources, and all 4 prompts.

## Full Config (Read + Write + Moderate)

Set all 4 credential environment variables for complete access to all 25 tools, 6 resources, and 4 prompts.

See `claude_desktop_config.json` and `.env.example` in this directory.
