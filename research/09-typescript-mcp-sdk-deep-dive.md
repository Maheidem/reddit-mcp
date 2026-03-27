# TypeScript MCP SDK Deep-Dive for Reddit MCP Server

> **Date:** 2026-03-27
> **Researcher:** researcher-2
> **Task:** Follow-up to Task #2 — TypeScript MCP SDK implementation guide
> **Status:** Complete

---

## Executive Summary

The TypeScript MCP SDK (`@modelcontextprotocol/sdk` v1.28.0) is the most mature MCP implementation available, with 36,800+ dependents on npm and Tier 1 official support. This document provides a complete implementation guide for building a Reddit MCP server with 20-30 tools using TypeScript + direct HTTP to the Reddit API.

**Key takeaways:**
- Use `McpServer` (high-level API) with Zod v4 for schema validation
- Start with **stdio transport** for development, add **Streamable HTTP** for deployment
- Organize tools with `reddit_{action}_{resource}` naming (e.g., `reddit_search_posts`)
- Keep to **20-25 tools** — the sweet spot before model confusion
- Use `isError: true` for recoverable errors, throw `McpError` for protocol violations
- Implement OAuth2 token management as a shared service layer, not per-tool
- Test with MCP Inspector during development, in-memory client for CI/CD

---

## Table of Contents

1. [SDK Version & Package Structure](#1-sdk-version--package-structure)
2. [Server Construction Patterns](#2-server-construction-patterns)
3. [Transport Setup](#3-transport-setup)
4. [Tool Definition Best Practices](#4-tool-definition-best-practices)
5. [Authentication Patterns for Reddit OAuth](#5-authentication-patterns-for-reddit-oauth)
6. [Rate Limiting Propagation](#6-rate-limiting-propagation)
7. [Testing Patterns](#7-testing-patterns)
8. [Tool Organization for 20-30 Tools](#8-tool-organization-for-20-30-tools)
9. [Production Deployment](#9-production-deployment)
10. [Reddit-Specific Implementation Patterns](#10-reddit-specific-implementation-patterns)
11. [Sources](#11-sources)

---

## 1. SDK Version & Package Structure

### Current State (March 2026)

| Detail | Value |
|--------|-------|
| **Latest Version** | v1.28.0 (March 25, 2026) |
| **npm Dependents** | 36,864 projects |
| **Total Releases** | 81 |
| **Tier** | Tier 1 (Official, fully supported) |
| **Peer Dependency** | Zod v4 |
| **Runtime Support** | Node.js, Bun, Deno |
| **Language** | TypeScript 96.8% |

**Source:** [npm: @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk), [GitHub: typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)

### Package Structure (v1.x — Production)

```
@modelcontextprotocol/sdk
├── /server/mcp.js         → McpServer (high-level API) ★ USE THIS
├── /server/stdio.js       → StdioServerTransport
├── /server/express.js     → Express integration + DNS rebinding protection
├── /server/hono.js        → Hono framework integration
├── /server/completable.js → Argument autocompletion
├── /server/middleware/     → hostHeaderValidation, etc.
├── /client/               → MCP client (for testing)
└── /types.js              → Protocol types
```

### V2 Status (Pre-Alpha)

V2 will reorganize into split packages:
- `@modelcontextprotocol/server` — Build MCP servers
- `@modelcontextprotocol/client` — Build MCP clients
- `@modelcontextprotocol/node` — Node.js HTTP transport
- `@modelcontextprotocol/express` — Express integration
- `@modelcontextprotocol/hono` — Hono integration

> "v1.x will continue to receive bug fixes and security updates for at least 6 months after v2 ships."

**Recommendation:** Build on v1.x for now. The migration path to v2 is mainly import path changes.

### Recent Release Highlights

| Version | Date | Key Changes |
|---------|------|-------------|
| **v1.28.0** | Mar 25, 2026 | OAuth scopes_supported default, JSON Schema validation for inputSchema, RFC 8252 loopback port relaxation |
| **v1.27.1** | Feb 24, 2026 | Auth conformance tests, command injection fix, silently-swallowed transport error fix |
| **v1.27.0** | Feb 16, 2026 | Conformance test infrastructure, discoverOAuthServerInfo() caching, streaming elicitation/sampling |
| **v1.26.0** | Feb 4, 2026 | **SECURITY: Cross-client response data leakage fix** (GHSA-345p-7cg4-v4c7), client credentials scopes |
| **v1.25.0** | Dec 15, 2024 | Removed loose/passthrough types, Task types, Fetch transport, ES2020 target |

**Source:** [GitHub Releases](https://github.com/modelcontextprotocol/typescript-sdk/releases)

---

## 2. Server Construction Patterns

### Basic Server Setup

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'reddit-mcp-server',
  version: '1.0.0'
});

// Register tools, resources, prompts here...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### With Logging Capability

```typescript
const server = new McpServer(
  { name: 'reddit-mcp-server', version: '1.0.0' },
  { capabilities: { logging: {} } }
);
```

### McpServer vs Server (Low-Level)

| Feature | `McpServer` (High-Level) | `Server` (Low-Level) |
|---------|-------------------------|---------------------|
| **Use when** | Almost always | Custom protocol handling |
| **Auto-negotiation** | Yes | Manual |
| **Input validation** | Automatic via Zod | Manual |
| **Request routing** | Automatic | Manual handler mapping |
| **Recommended** | **Yes** | Rarely needed |

**Always use `McpServer`** unless you need custom protocol-level behavior.

### Key Method Reference

```typescript
// Tools
server.registerTool(name, config, handler)
server.sendToolListChanged()          // Notify clients of tool changes

// Resources
server.registerResource(name, uri, config, handler)
server.sendResourceListChanged()      // Notify clients of resource changes

// Prompts
server.registerPrompt(name, config, handler)
server.sendPromptListChanged()        // Notify clients of prompt changes

// Logging
await server.sendLoggingMessage({ level: 'info', data: 'message' }, sessionId)
// Levels: debug, info, notice, warning, error, critical, alert, emergency

// Sampling (server-initiated LLM calls)
const result = await server.createMessage({
  messages: [...],
  modelPreferences: { hints: [{ name: 'claude-3-5-haiku' }] },
  maxTokens: 500
})
```

---

## 3. Transport Setup

### Transport Comparison

| Transport | Use Case | Multi-Client | Network | Recommended |
|-----------|----------|-------------|---------|-------------|
| **stdio** | Local CLI tools, editor integrations | No (1:1) | No | Development + CLI distribution |
| **Streamable HTTP** | Remote servers, multi-user | Yes | Yes | **Production deployment** |
| **SSE** | Legacy clients only | Yes | Yes | **Deprecated** (March 2025) |

**Decision rule:** If the user controls the machine → stdio. If they don't → Streamable HTTP.

**Source:** [MCP Transport Protocols Guide](https://mcpcat.io/guides/comparing-stdio-sse-streamablehttp/)

### stdio Transport (Development + CLI)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({ name: 'reddit-mcp', version: '1.0.0' });

// Register tools...

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Important:** In stdio mode, NEVER use `console.log()` — stdout is reserved for MCP protocol messages. Use `console.error()` or the SDK's logging facility instead.

### Streamable HTTP — Stateless (Production)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/node.js';

const app = createMcpExpressApp(); // Auto DNS-rebinding protection

app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'reddit-mcp', version: '1.0.0' });
  // Register tools on each request (or use a factory)

  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined  // Stateless — no session tracking
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, '127.0.0.1');
```

### Streamable HTTP — Stateful with Sessions

```typescript
const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: false  // Allow SSE streaming for notifications
});
```

### Backwards-Compatible (SSE + Streamable HTTP)

For servers that need to support both modern and legacy clients, see the `sseAndStreamableHttpCompatibleServer.ts` example in the SDK repository.

### DNS Rebinding Protection

Always use when binding to localhost:

```typescript
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
const app = createMcpExpressApp({ host: '127.0.0.1' }); // Auto-protected

// Or manually:
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';
app.use(hostHeaderValidation(['localhost', '127.0.0.1']));
```

---

## 4. Tool Definition Best Practices

### Zod Schema Integration

The SDK uses **Zod v4 as a peer dependency** for tool input/output schemas. Zod schemas are automatically converted to JSON Schema for the MCP protocol.

```typescript
import { z } from 'zod';

server.registerTool(
  'reddit_search_posts',
  {
    title: 'Search Reddit Posts',
    description: 'Search for posts across Reddit or within a specific subreddit. ' +
      'Returns titles, scores, URLs, and comment counts. ' +
      'Use this when the user wants to find discussions about a topic.',
    inputSchema: {
      query: z.string().describe('Search query — keywords, phrases, or Reddit search syntax'),
      subreddit: z.string().optional().describe('Limit search to this subreddit (without r/ prefix)'),
      sort: z.enum(['relevance', 'hot', 'top', 'new', 'comments'])
        .default('relevance')
        .describe('Sort order for results'),
      time: z.enum(['hour', 'day', 'week', 'month', 'year', 'all'])
        .default('all')
        .describe('Time filter — only applies when sort is "top"'),
      limit: z.number().min(1).max(100).default(25)
        .describe('Number of results to return (1-100)')
    },
    outputSchema: {
      posts: z.array(z.object({
        title: z.string(),
        subreddit: z.string(),
        score: z.number(),
        url: z.string(),
        num_comments: z.number(),
        created_utc: z.number()
      })),
      has_more: z.boolean(),
      next_after: z.string().optional()
    }
  },
  async ({ query, subreddit, sort, time, limit }) => {
    const results = await redditClient.search({ query, subreddit, sort, time, limit });
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      structuredContent: results
    };
  }
);
```

### Description Writing Rules

Based on [philschmid.de best practices](https://www.philschmid.de/mcp-best-practices) and [PagerDuty lessons](https://www.pagerduty.com/eng/lessons-learned-while-building-pagerduty-mcp-server/):

1. **Describe the outcome, not the operation:**
   - Bad: `"Calls the Reddit /api/search endpoint"`
   - Good: `"Search for posts across Reddit. Returns titles, scores, and URLs."`

2. **State when to use the tool:**
   - `"Use this when the user wants to find discussions about a topic"`

3. **Describe parameters with precision:**
   - Bad: `"The subreddit name"`
   - Good: `"Limit search to this subreddit (without r/ prefix, e.g. 'python' not 'r/python')"`

4. **Use enums over free-form strings:**
   - `z.enum(['hot', 'new', 'top', 'rising'])` prevents hallucinated sort values

5. **Set sensible defaults:**
   - `z.number().default(25)` reduces required parameters the model must supply

### Error Response Patterns

Two types of errors in MCP:

#### 1. Domain Errors (Recoverable — LLM Can Retry)

Return `isError: true` with a helpful message:

```typescript
server.registerTool('reddit_get_post', { ... }, async ({ post_id }) => {
  try {
    const post = await redditClient.getPost(post_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(post) }],
      structuredContent: post
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        content: [{
          type: 'text',
          text: `Post '${post_id}' not found. The post may have been deleted. ` +
            `Try searching for the topic instead using reddit_search_posts.`
        }],
        isError: true
      };
    }
    if (error.status === 403) {
      return {
        content: [{
          type: 'text',
          text: `Access denied to post '${post_id}'. This post may be in a private subreddit. ` +
            `The user may need to authenticate with access to that subreddit.`
        }],
        isError: true
      };
    }
    throw error; // Re-throw unexpected errors
  }
});
```

#### 2. Protocol Errors (Fatal — Stop Execution)

Throw `McpError` for protocol violations:

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Invalid parameters
throw new McpError(ErrorCode.InvalidParams, 'subreddit name cannot contain spaces');

// Internal error
throw new McpError(ErrorCode.InternalError, 'Reddit API connection failed');
```

### Tool Annotations

Guide client behavior with annotations:

```typescript
server.registerTool('reddit_search_posts', {
  // ... schema ...
  annotations: {
    readOnlyHint: true,      // Does not modify state
    destructiveHint: false,   // Does not delete anything
    openWorldHint: true       // Interacts with external service
  }
}, handler);
```

---

## 5. Authentication Patterns for Reddit OAuth

### Architecture: MCP Server as Resource Server

Per the [June 2025 MCP Auth Spec](https://blog.logto.io/mcp-auth-implementation-guide-2025-06-18), MCP servers are **Resource Servers** that consume tokens, NOT Authorization Servers that issue them.

However, for a **Reddit MCP server**, the OAuth flow is different from the MCP auth spec because we're authenticating **with Reddit's API**, not authenticating MCP clients:

### Pattern A: User Provides Reddit Credentials (stdio)

For local CLI usage, the simplest pattern is environment variables:

```typescript
// User sets these in their MCP config or environment
interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username?: string;       // For script-type apps
  password?: string;       // For script-type apps
  refreshToken?: string;   // For web/installed apps
  userAgent: string;
}

class RedditAuthManager {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: RedditConfig) {}

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }
    return this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    const body = this.config.refreshToken
      ? `grant_type=refresh_token&refresh_token=${this.config.refreshToken}`
      : `grant_type=password&username=${this.config.username}&password=${this.config.password}`;

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent
      },
      body
    });

    if (!response.ok) {
      throw new McpError(
        ErrorCode.InternalError,
        `Reddit auth failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }
}
```

### Pattern B: OAuth2 Browser Flow (Streamable HTTP)

For multi-user deployments, use the MCP auth spec's OAuth flow:

1. MCP client requests a tool → Server returns 401 with `WWW-Authenticate` header
2. Client discovers auth metadata at `/.well-known/oauth-protected-resource`
3. Client authenticates via Reddit's OAuth2 authorization code flow
4. Server validates the token and proxies requests to Reddit

```typescript
// Protected Resource Metadata endpoint
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: 'https://your-reddit-mcp-server.com',
    authorization_servers: ['https://www.reddit.com/api/v1'],
    scopes_supported: [
      'read', 'identity', 'submit', 'vote', 'edit',
      'subscribe', 'modposts', 'modflair', 'modlog'
    ],
    bearer_methods_supported: ['header']
  });
});
```

### Pattern C: Reference Implementation (Duolingo Slack MCP)

The [Duolingo Slack MCP server](https://github.com/duolingo/slack-mcp) demonstrates a production OAuth pattern:

1. Expose an `oauth_get_url` tool that generates the authorization URL
2. User visits URL in browser, approves access
3. Server receives callback, stores token per session
4. All subsequent tools use the stored token

This pattern works well for Reddit where the user needs to grant specific OAuth scopes.

### MCP Config for stdio (User Credential Setup)

```json
{
  "mcpServers": {
    "reddit": {
      "command": "npx",
      "args": ["-y", "reddit-mcp-server"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id",
        "REDDIT_CLIENT_SECRET": "your_client_secret",
        "REDDIT_USERNAME": "your_username",
        "REDDIT_PASSWORD": "your_password",
        "REDDIT_USER_AGENT": "reddit-mcp/1.0.0"
      }
    }
  }
}
```

---

## 6. Rate Limiting Propagation

### The Problem

Reddit's free tier allows **100 queries per minute (QPM)** per OAuth client ID, averaged over a 10-minute window. The MCP server must:
1. Respect this limit
2. Communicate rate limit status to the LLM when hit
3. Help the LLM decide whether to retry or give up

### Token Bucket Implementation

```typescript
class RedditRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(maxQPM: number = 100) {
    this.maxTokens = maxQPM;
    this.tokens = maxQPM;
    this.lastRefill = Date.now();
    this.refillRate = maxQPM / 60000; // tokens per ms
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens < 1) {
      const waitMs = Math.ceil((1 - this.tokens) / this.refillRate);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      this.refill();
    }
    this.tokens -= 1;
  }

  get remaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}
```

### Communicating Rate Limits to the LLM

When rate limited, return an error message that **guides the LLM's behavior**:

```typescript
async function makeRedditRequest(path: string, rateLimiter: RedditRateLimiter): Promise<Response> {
  await rateLimiter.acquire();

  const response = await fetch(`https://oauth.reddit.com${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': userAgent }
  });

  // Reddit returns rate limit headers
  const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
  const resetSeconds = parseInt(response.headers.get('x-ratelimit-reset') || '0');

  if (response.status === 429) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Reddit API rate limit reached. ${remaining} requests remaining. ` +
          `Rate limit resets in ${resetSeconds} seconds. ` +
          `Please wait before making more Reddit API calls, or try a more specific query ` +
          `to reduce the number of API calls needed.`
      }]
    };
  }

  return response;
}
```

### Rate Limit Headers from Reddit

Reddit's API returns these headers on every response:
- `x-ratelimit-remaining` — requests left in current window
- `x-ratelimit-reset` — seconds until window resets
- `x-ratelimit-used` — requests used in current window

### Best Practice: Pre-emptive Warning

Include rate limit status in tool responses when running low:

```typescript
function wrapResponse(data: any, rateLimiter: RedditRateLimiter): CallToolResult {
  const remaining = rateLimiter.remaining;
  let text = JSON.stringify(data, null, 2);

  if (remaining < 10) {
    text += `\n\n⚠️ Rate limit warning: Only ${remaining} Reddit API calls remaining ` +
      `in the current window. Consider batching requests or waiting.`;
  }

  return {
    content: [{ type: 'text', text }],
    structuredContent: data
  };
}
```

---

## 7. Testing Patterns

### Testing Pyramid

1. **MCP Inspector** — Interactive development testing
2. **In-Memory Unit Tests** — Automated CI/CD testing
3. **Integration Tests** — Full transport testing
4. **Conformance Tests** — Protocol compliance (SDK provides these in v1.27+)

### MCP Inspector (Development)

**Install & Run:**
```bash
npx @modelcontextprotocol/inspector
# Opens UI at http://localhost:6274

# Or test a specific server:
npx @modelcontextprotocol/inspector node build/index.js

# CLI mode for automation:
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list
```

**Features:**
- Visual testing of tools, resources, prompts
- Real-time communication logs
- Protocol validation
- Configuration export (mcp.json for Claude, Cursor, etc.)
- Authentication support (auto-generated session tokens)
- Requires Node.js ^22.7.5

**Source:** [GitHub: modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)

### In-Memory Unit Tests (TypeScript + Vitest)

The key pattern: create server and client in-memory, bypassing transport:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('Reddit MCP Server', () => {
  let server: McpServer;
  let client: Client;

  beforeEach(async () => {
    server = new McpServer({ name: 'test-reddit', version: '1.0.0' });

    // Register tools with mocked Reddit client
    registerRedditTools(server, mockRedditClient);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  it('should list all tools', async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools.map(t => t.name)).toContain('reddit_search_posts');
  });

  it('should search posts', async () => {
    const result = await client.callTool('reddit_search_posts', {
      query: 'typescript',
      subreddit: 'programming',
      limit: 5
    });
    expect(result.isError).toBeFalsy();
    const content = JSON.parse(result.content[0].text);
    expect(content.posts).toHaveLength(5);
  });

  it('should handle 404 gracefully', async () => {
    const result = await client.callTool('reddit_get_post', {
      post_id: 'nonexistent123'
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });

  it('should communicate rate limits', async () => {
    // Exhaust rate limit in mock
    mockRedditClient.setRateLimitRemaining(0);

    const result = await client.callTool('reddit_search_posts', {
      query: 'test'
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limit');
  });
});
```

### Mocking the Reddit API Layer

```typescript
class MockRedditClient implements RedditClientInterface {
  private rateLimitRemaining = 100;
  private mockData: Map<string, any> = new Map();

  setRateLimitRemaining(n: number) { this.rateLimitRemaining = n; }
  setMockData(key: string, data: any) { this.mockData.set(key, data); }

  async search(params: SearchParams): Promise<SearchResult> {
    if (this.rateLimitRemaining <= 0) {
      throw new RateLimitError('Rate limit exceeded', 60);
    }
    this.rateLimitRemaining--;
    return this.mockData.get('search') || { posts: [], has_more: false };
  }

  async getPost(id: string): Promise<Post> {
    if (this.rateLimitRemaining <= 0) {
      throw new RateLimitError('Rate limit exceeded', 60);
    }
    this.rateLimitRemaining--;
    const post = this.mockData.get(`post:${id}`);
    if (!post) throw new NotFoundError(`Post ${id} not found`);
    return post;
  }
}
```

### CLI Testing for CI/CD

```bash
# List tools
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

# Call a specific tool
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name reddit_search_posts \
  --tool-arg query=typescript \
  --tool-arg limit=5
```

### Integration Test (Full Transport)

```typescript
import { spawn } from 'child_process';

describe('Integration: stdio transport', () => {
  it('should handle full request/response cycle', async () => {
    const proc = spawn('node', ['dist/index.js'], {
      env: { ...process.env, REDDIT_CLIENT_ID: 'test', /* ... */ }
    });

    const transport = new StdioClientTransport({
      reader: proc.stdout,
      writer: proc.stdin
    });

    const client = new Client({ name: 'integration-test', version: '1.0.0' });
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThan(0);

    proc.kill();
  });
});
```

---

## 8. Tool Organization for 20-30 Tools

### The "Too Many Tools" Problem

Research from [PagerDuty](https://www.pagerduty.com/eng/lessons-learned-while-building-pagerduty-mcp-server/) and [Speakeasy](https://www.speakeasy.com/mcp/tool-design/less-is-more):

| Tool Count | Effect |
|-----------|--------|
| 1-15 | Optimal — models select accurately |
| 15-25 | Good with clear naming — minor overlap |
| **25-30** | **Sweet spot ceiling — descriptions begin to overlap** |
| 30+ | Model confusion increases sharply |
| 80+ | Reported failures in tool selection |

**Source:** [GitHub Discussion #1251](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1251)

### Naming Convention

Use `{service}_{action}_{resource}` — prevents collisions with other MCP servers:

```
reddit_search_posts        ✓ Clear, discoverable
reddit_get_post            ✓ Specific action
reddit_get_comments        ✓ Clear resource
reddit_get_user_profile    ✓ Compound resource OK
reddit_submit_post         ✓ Write action

search_posts               ✗ Collides with other servers
getRedditPost              ✗ CamelCase, no service prefix
```

### Proposed Reddit MCP Tool Set (25 tools)

#### Read Operations (~15 tools)
```
reddit_search_posts          — Search posts across Reddit
reddit_get_post              — Get a specific post by ID/URL
reddit_get_comments          — Get comments for a post
reddit_get_subreddit_info    — Get subreddit metadata and rules
reddit_get_subreddit_posts   — Get posts from a subreddit (hot/new/top/rising)
reddit_get_user_profile      — Get a user's profile information
reddit_get_user_posts        — Get posts by a specific user
reddit_get_user_comments     — Get comments by a specific user
reddit_get_trending          — Get trending subreddits and topics
reddit_search_subreddits     — Search for subreddits by name/topic
reddit_get_wiki_page         — Get a subreddit's wiki page
reddit_get_post_flair        — Get available flair for a subreddit
reddit_get_multireddit       — Get posts from a multireddit
```

#### Write Operations (~7 tools)
```
reddit_submit_post           — Submit a new text or link post
reddit_submit_comment        — Reply to a post or comment
reddit_vote                  — Upvote or downvote a post/comment
reddit_save                  — Save or unsave a post/comment
reddit_subscribe             — Subscribe to or leave a subreddit
reddit_edit                  — Edit own post or comment
reddit_delete                — Delete own post or comment
```

#### Moderation Operations (~5 tools)
```
reddit_mod_remove            — Remove a post or comment (mod)
reddit_mod_approve           — Approve a post or comment (mod)
reddit_mod_set_flair         — Set flair on a post (mod)
reddit_mod_get_queue         — Get moderation queue
reddit_mod_ban_user          — Ban/unban a user from subreddit
```

### Design Principles (per [philschmid.de](https://www.philschmid.de/mcp-best-practices))

1. **Outcomes, not operations:** `reddit_get_subreddit_posts` combines subreddit lookup + post listing into one call
2. **Flatten arguments:** Top-level primitives, not nested objects
3. **Curate ruthlessly:** Each tool has one clear purpose
4. **Paginate large results:** Always include `limit` (default 25), return `has_more` + `next_after`

---

## 9. Production Deployment

### Recommended Architecture

```
┌─────────────────────────────────────────┐
│ Reddit MCP Server                       │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │ McpServer│───→│ Tool Handlers     │  │
│  │          │    │  (25 tools)       │  │
│  └──────────┘    └────────┬─────────┘  │
│       │                   │             │
│  ┌────┴─────┐    ┌───────┴──────────┐  │
│  │ Transport│    │ RedditClient      │  │
│  │ stdio or │    │  - Auth Manager   │  │
│  │ HTTP     │    │  - Rate Limiter   │  │
│  └──────────┘    │  - HTTP Client    │  │
│                  └───────┬──────────┘  │
│                          │              │
└──────────────────────────┼──────────────┘
                           │
                    https://oauth.reddit.com
```

### File Structure

```
reddit-mcp-server/
├── src/
│   ├── index.ts              # Entry point, transport setup
│   ├── server.ts             # McpServer registration
│   ├── reddit/
│   │   ├── client.ts         # Reddit API HTTP client
│   │   ├── auth.ts           # OAuth2 token management
│   │   ├── rate-limiter.ts   # Token bucket rate limiter
│   │   └── types.ts          # Reddit API response types
│   ├── tools/
│   │   ├── index.ts          # Tool registration barrel
│   │   ├── search.ts         # reddit_search_posts, reddit_search_subreddits
│   │   ├── posts.ts          # reddit_get_post, reddit_submit_post, etc.
│   │   ├── comments.ts       # reddit_get_comments, reddit_submit_comment
│   │   ├── users.ts          # reddit_get_user_profile, reddit_get_user_posts
│   │   ├── subreddits.ts     # reddit_get_subreddit_info, reddit_subscribe
│   │   └── moderation.ts     # reddit_mod_* tools
│   ├── resources/
│   │   └── index.ts          # Optional: expose subreddit info as resources
│   └── prompts/
│       └── index.ts          # Optional: prompt templates
├── tests/
│   ├── unit/
│   │   ├── tools.test.ts     # In-memory tool tests
│   │   ├── auth.test.ts      # Auth manager tests
│   │   └── rate-limiter.test.ts
│   └── integration/
│       └── server.test.ts    # Full transport tests
├── package.json
├── tsconfig.json
└── README.md
```

### Package.json Configuration

```json
{
  "name": "reddit-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "reddit-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "vitest",
    "inspect": "npx @modelcontextprotocol/inspector node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.28.0"
  },
  "peerDependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^22.0.0"
  }
}
```

### Multi-Node Deployment (Streamable HTTP)

Three patterns from SDK docs:
1. **Stateless:** Any node handles any request (simplest, works for Reddit MCP)
2. **Persistent storage:** Shared DB for session state (PostgreSQL/Redis)
3. **Local state + routing:** Message queue for session affinity

For Reddit MCP, **stateless** is ideal since all state lives in Reddit's API.

---

## 10. Reddit-Specific Implementation Patterns

### Reddit API Client Skeleton

```typescript
class RedditClient {
  private auth: RedditAuthManager;
  private rateLimiter: RedditRateLimiter;
  private userAgent: string;

  constructor(config: RedditConfig) {
    this.auth = new RedditAuthManager(config);
    this.rateLimiter = new RedditRateLimiter(100); // 100 QPM
    this.userAgent = config.userAgent;
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    await this.rateLimiter.acquire();
    const token = await this.auth.getAccessToken();

    const response = await fetch(`https://oauth.reddit.com${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': this.userAgent,
        ...options?.headers
      }
    });

    // Update rate limiter from response headers
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) {
      this.rateLimiter.updateFromHeaders(
        parseInt(remaining),
        parseInt(response.headers.get('x-ratelimit-reset') || '0')
      );
    }

    if (response.status === 429) {
      throw new RateLimitError(
        'Reddit API rate limit exceeded',
        parseInt(response.headers.get('x-ratelimit-reset') || '60')
      );
    }

    if (!response.ok) {
      throw new RedditApiError(response.status, await response.text());
    }

    return response.json() as T;
  }

  // Convenience methods
  async searchPosts(params: SearchParams): Promise<SearchResult> {
    const query = new URLSearchParams({
      q: params.query,
      sort: params.sort || 'relevance',
      t: params.time || 'all',
      limit: String(params.limit || 25),
      ...(params.after && { after: params.after })
    });
    const sub = params.subreddit ? `/r/${params.subreddit}` : '';
    return this.request<SearchResult>(`${sub}/search.json?${query}`);
  }
}
```

### Mapping Reddit API to MCP Tools

| Reddit API Endpoint | MCP Tool | Notes |
|---------------------|----------|-------|
| `GET /search` | `reddit_search_posts` | Combine with subreddit scoping |
| `GET /r/{sub}/hot` | `reddit_get_subreddit_posts` | Parameterize sort (hot/new/top/rising) |
| `GET /api/info?id=t3_{id}` | `reddit_get_post` | Accept URL or ID |
| `GET /r/{sub}/comments/{id}` | `reddit_get_comments` | Include sort, depth, limit |
| `POST /api/submit` | `reddit_submit_post` | type=self or link |
| `POST /api/comment` | `reddit_submit_comment` | thing_id = parent fullname |
| `POST /api/vote` | `reddit_vote` | dir: 1, 0, -1 |
| `GET /user/{user}/about` | `reddit_get_user_profile` | Public profile data |

### Response Formatting for LLMs

Return data that's useful for LLMs — not raw API responses:

```typescript
// BAD: Raw Reddit API response
return { data: { children: [{ kind: 't3', data: { title: '...', ...200 fields } }] } };

// GOOD: Curated response for LLM consumption
return {
  posts: results.map(post => ({
    title: post.data.title,
    subreddit: post.data.subreddit,
    author: post.data.author,
    score: post.data.score,
    url: `https://reddit.com${post.data.permalink}`,
    num_comments: post.data.num_comments,
    created: new Date(post.data.created_utc * 1000).toISOString(),
    selftext_preview: post.data.selftext?.substring(0, 500) || null,
    is_nsfw: post.data.over_18
  })),
  has_more: !!listing.data.after,
  next_after: listing.data.after
};
```

---

## 11. Sources

### Official SDK Documentation
1. **[TypeScript SDK npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)** — v1.28.0, 36.8K dependents — Accessed: 2026-03-27 — Reliability: 5/5
2. **[TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)** — Source, releases, docs — Accessed: 2026-03-27 — Reliability: 5/5
3. **[SDK Server Documentation](https://ts.sdk.modelcontextprotocol.io/documents/server.html)** — McpServer API reference — Accessed: 2026-03-27 — Reliability: 5/5
4. **[Server.md on GitHub](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)** — Server construction guide — Accessed: 2026-03-27 — Reliability: 5/5
5. **[SDK Releases](https://github.com/modelcontextprotocol/typescript-sdk/releases)** — Full changelog — Accessed: 2026-03-27 — Reliability: 5/5
6. **[Official SDKs Page](https://modelcontextprotocol.io/docs/sdk)** — All SDK tiers — Accessed: 2026-03-27 — Reliability: 5/5
7. **[MCP Inspector GitHub](https://github.com/modelcontextprotocol/inspector)** — Testing tool — Accessed: 2026-03-27 — Reliability: 5/5

### Transport & Architecture
8. **[MCP Transport Protocols Comparison](https://mcpcat.io/guides/comparing-stdio-sse-streamablehttp/)** — stdio vs SSE vs Streamable HTTP — Accessed: 2026-03-27 — Reliability: 4/5
9. **[Why MCP Deprecated SSE](https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/)** — SSE → Streamable HTTP rationale — Accessed: 2026-03-27 — Reliability: 4/5
10. **[MCP Transports Explained (DEV)](https://dev.to/jefe_cool/mcp-transports-explained-stdio-vs-streamable-http-and-when-to-use-each-3lco)** — Decision framework — Accessed: 2026-03-27 — Reliability: 3/5

### Best Practices & Design
11. **[MCP Server Best Practices — philschmid.de](https://www.philschmid.de/mcp-best-practices)** — Six core principles — Accessed: 2026-03-27 — Reliability: 4/5
12. **[PagerDuty MCP Server Lessons](https://www.pagerduty.com/eng/lessons-learned-while-building-pagerduty-mcp-server/)** — Production lessons — Accessed: 2026-03-27 — Reliability: 4/5
13. **[Why Less is More for MCP — Speakeasy](https://www.speakeasy.com/mcp/tool-design/less-is-more)** — Tool count management — Accessed: 2026-03-27 — Reliability: 4/5
14. **[Langfuse MCP Server Blog](https://langfuse.com/blog/2025-12-09-building-langfuse-mcp-server)** — Code reuse patterns — Accessed: 2026-03-27 — Reliability: 4/5
15. **[Tool Overload — lunar.dev](https://www.lunar.dev/post/why-is-there-mcp-tool-overload-and-how-to-solve-it-for-your-ai-agents)** — Tool count research — Accessed: 2026-03-27 — Reliability: 3/5
16. **[Too Many Tools Discussion #1251](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1251)** — Community data on tool limits — Accessed: 2026-03-27 — Reliability: 4/5

### Authentication
17. **[MCP Auth Implementation Guide — Logto](https://blog.logto.io/mcp-auth-implementation-guide-2025-06-18)** — OAuth 2.1 MCP spec implementation — Accessed: 2026-03-27 — Reliability: 4/5
18. **[Duolingo Slack MCP (OAuth reference)](https://github.com/duolingo/slack-mcp)** — Production OAuth MCP server — Accessed: 2026-03-27 — Reliability: 4/5
19. **[MCP Server Development Guide](https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-server-development-guide.md)** — Auth, error handling, logging — Accessed: 2026-03-27 — Reliability: 4/5

### Testing
20. **[MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)** — Official testing tool — Accessed: 2026-03-27 — Reliability: 5/5
21. **[Unit Testing MCP Servers — MCPcat](https://mcpcat.io/guides/writing-unit-tests-mcp-servers/)** — In-memory testing patterns — Accessed: 2026-03-27 — Reliability: 4/5
22. **[MCP Integration Testing — MCPcat](https://mcpcat.io/guides/integration-tests-mcp-flows/)** — E2E testing guide — Accessed: 2026-03-27 — Reliability: 4/5
23. **[Testing MCP Servers Complete Guide — Agnost](https://agnost.ai/blog/testing-mcp-servers-complete-guide/)** — Inspector + alternatives — Accessed: 2026-03-27 — Reliability: 3/5

### Rate Limiting
24. **[MCP Server Rate Limiting — Fast.io](https://fast.io/resources/mcp-server-rate-limiting/)** — Token bucket patterns — Accessed: 2026-03-27 — Reliability: 3/5
25. **[API Gateway for MCP — API7.ai](https://api7.ai/learning-center/api-gateway-guide/api-gateway-enhance-mcp-server)** — Gateway-level rate limiting — Accessed: 2026-03-27 — Reliability: 3/5

### Tutorials & Guides
26. **[Complete MCP TypeScript SDK Guide — Agentailor](https://blog.agentailor.com/posts/mcp-typescript-sdk-complete-guide)** — Tools, resources, prompts — Accessed: 2026-03-27 — Reliability: 4/5
27. **[Build MCP Server Tutorial 2026 — DevTk](https://devtk.ai/en/blog/build-mcp-server-tutorial-2026/)** — Step-by-step tutorial — Accessed: 2026-03-27 — Reliability: 3/5
28. **[Production-Ready MCP Servers (DEV)](https://dev.to/quantbit/building-production-ready-mcp-servers-with-typescript-a-complete-guide-2mg1)** — Production patterns — Accessed: 2026-03-27 — Reliability: 3/5
29. **[Reducing Tool Calling Error Rates — Mastra](https://mastra.ai/blog/mcp-tool-compatibility-layer)** — 15% → 3% error reduction — Accessed: 2026-03-27 — Reliability: 4/5
