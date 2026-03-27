/**
 * E08-T07: Real-world validation — Playwright browser tests.
 *
 * Starts the MCP server with real Reddit credentials, invokes tools to
 * create/read content on r/test, then verifies each action via Reddit's
 * JSON API (appending .json to URLs). Cleans up afterward.
 *
 * Uses Reddit's JSON API endpoints for verification because Reddit
 * blocks headless browsers on HTML pages. The JSON endpoints serve the
 * same data that would render in the browser.
 *
 * Skipped when REDDIT_CLIENT_ID is not set (CI-safe).
 */

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Environment & skip logic ───────────────────────────────────────────

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..");

/** Parse .env file into a Record<string, string>. */
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const content = readFileSync(resolve(PROJECT_ROOT, ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  } catch {
    // .env not found — tests will skip
  }
  return env;
}

const dotenv = loadEnv();
const HAS_CREDENTIALS = Boolean(dotenv.REDDIT_CLIENT_ID);

// ─── Shared state ───────────────────────────────────────────────────────

let mcpClient: Client;
let transport: StdioClientTransport;

// Track created content for cleanup
let createdPostId: string | null = null;
let createdPostPermalink: string | null = null;
let createdCommentId: string | null = null;

const UNIQUE_TITLE = `MCP-E2E-Test ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
const COMMENT_TEXT = "Automated E2E test comment from reddit-mcp";

// ─── Helpers ────────────────────────────────────────────────────────────

/** Extract text content from an MCP tool result. */
function getTextContent(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0]?.text ?? "";
}

/**
 * Fetch a Reddit page's JSON API representation.
 * Reddit exposes JSON at any URL + ".json" — returns raw JSON text.
 */
async function fetchRedditJson(page: Page, url: string): Promise<string> {
  const jsonUrl = url.replace(/\/?(\?.*)?$/, ".json$1");
  const response = await page.request.get(jsonUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  return await response.text();
}

/**
 * Fetch Reddit JSON with retries — waits for eventual consistency.
 * Reddit can take several seconds to propagate new comments/changes.
 */
async function fetchRedditJsonUntil(
  page: Page,
  url: string,
  predicate: (text: string) => boolean,
  maxRetries = 5,
  delayMs = 3000,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const text = await fetchRedditJson(page, url);
    if (predicate(text)) return text;
    if (i < maxRetries - 1) await page.waitForTimeout(delayMs);
  }
  // Return last attempt for assertion error messages
  return await fetchRedditJson(page, url);
}

// ─── Test suite ─────────────────────────────────────────────────────────

test.describe("Real-world Reddit validation", () => {
  test.describe.configure({ mode: "serial" });

  // Skip entire suite if no credentials
  test.beforeAll(async () => {
    test.skip(!HAS_CREDENTIALS, "REDDIT_CLIENT_ID not set — skipping real-world tests");

    // Build so dist/index.js is current
    execSync("npx tsc", { cwd: PROJECT_ROOT, stdio: "pipe" });

    // Merge process.env with .env values (process.env takes precedence for safety)
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    for (const [key, value] of Object.entries(dotenv)) {
      if (!(key in env)) env[key] = value;
    }

    transport = new StdioClientTransport({
      command: "node",
      args: [resolve(PROJECT_ROOT, "dist", "index.js")],
      env,
      stderr: "pipe",
    });

    mcpClient = new Client({ name: "playwright-e2e", version: "1.0.0" });
    await mcpClient.connect(transport);
  });

  test.afterAll(async () => {
    if (mcpClient) {
      try {
        if (createdCommentId) {
          await mcpClient.callTool({
            name: "delete_content",
            arguments: { fullname: createdCommentId },
          });
        }
      } catch {
        // Best-effort cleanup
      }
      try {
        if (createdPostId) {
          await mcpClient.callTool({
            name: "delete_content",
            arguments: { fullname: createdPostId },
          });
        }
      } catch {
        // Best-effort cleanup
      }
      try {
        await mcpClient.close();
      } catch {
        // Client may already be closed
      }
    }
  });

  // ── AC2: Read validation ────────────────────────────────────────────

  test("read: get r/test posts and verify via Reddit JSON API", async ({ page }) => {
    const result = await mcpClient.callTool({
      name: "get_subreddit_posts",
      arguments: { subreddit: "test", sort: "hot", limit: 5 },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.posts.length).toBeGreaterThan(0);

    const firstTitle = parsed.posts[0].title;

    // Verify title appears in the JSON API response for r/test/hot
    const jsonText = await fetchRedditJson(page, "https://www.reddit.com/r/test/hot");
    expect(jsonText).toContain(firstTitle);
  });

  // ── AC3: Write validation — create post ─────────────────────────────

  test("write: create post on r/test and verify in browser", async ({ page }) => {
    const result = await mcpClient.callTool({
      name: "create_post",
      arguments: {
        subreddit: "test",
        title: UNIQUE_TITLE,
        text: "This is an automated E2E test post. It will be deleted shortly.",
        force: true,
      },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.id).toBeTruthy();
    expect(parsed.url).toBeTruthy();

    createdPostId = parsed.id;
    createdPostPermalink = parsed.url;

    // Verify the specific post exists by fetching its URL via JSON API
    await page.waitForTimeout(3000);

    // Normalize the permalink to ensure it works with .json
    const permalink = createdPostPermalink!;
    const jsonText = await fetchRedditJson(page, permalink);

    // The JSON response for a post page is an array: [listing, comments]
    // The post's title should appear in the first listing
    expect(jsonText).toContain(UNIQUE_TITLE);
    expect(jsonText).toContain("automated E2E test post");
  });

  // ── AC4: Comment validation ─────────────────────────────────────────

  test("write: comment on created post and verify in browser", async ({ page }) => {
    test.skip(!createdPostId, "Post was not created — skipping comment test");

    const result = await mcpClient.callTool({
      name: "create_comment",
      arguments: {
        parent: createdPostId!,
        text: COMMENT_TEXT,
      },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.id).toBeTruthy();

    createdCommentId = parsed.id;

    // Verify comment on the post page via JSON API (with retries for eventual consistency)
    const permalink = createdPostPermalink!;
    const jsonText = await fetchRedditJsonUntil(
      page,
      permalink,
      (text) => text.includes(COMMENT_TEXT),
    );

    // Comment text should appear in the post's comment listing
    expect(jsonText).toContain(COMMENT_TEXT);

    // Bot footer should be present
    expect(jsonText).toContain("I am a bot");
  });

  // ── AC5: Cleanup validation ─────────────────────────────────────────

  test("cleanup: delete created content and verify deletion", async ({ page }) => {
    test.skip(!createdPostId, "No content to clean up");

    // Delete comment first
    if (createdCommentId) {
      const commentResult = await mcpClient.callTool({
        name: "delete_content",
        arguments: { fullname: createdCommentId },
      });
      expect(commentResult.isError).toBeFalsy();
      createdCommentId = null;
    }

    // Delete post
    const postResult = await mcpClient.callTool({
      name: "delete_content",
      arguments: { fullname: createdPostId! },
    });
    expect(postResult.isError).toBeFalsy();

    // Verify post shows as deleted (with retries for eventual consistency)
    const permalink = createdPostPermalink!;
    const jsonText = await fetchRedditJsonUntil(
      page,
      permalink,
      (text) => text.includes("[deleted]"),
    );
    expect(jsonText).toContain("[deleted]");

    createdPostId = null;
  });
});
