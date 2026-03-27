/**
 * E2E subprocess tests for the Reddit MCP Server.
 *
 * Spawns the server as a subprocess via StdioClientTransport,
 * connects an MCP Client, and exercises tools through the full
 * STDIO transport lifecycle. Uses REDDIT_MCP_TEST_MODE=true to
 * avoid real Reddit API calls.
 *
 * @module
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..");

describe("E2E subprocess", { timeout: 30_000 }, () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Build the project so dist/index.js is up to date
    execSync("npx tsc", { cwd: PROJECT_ROOT, stdio: "pipe" });

    // StdioClientTransport spawns the subprocess internally.
    // Filter process.env to Record<string, string> (no undefined values).
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    env.REDDIT_MCP_TEST_MODE = "true";

    transport = new StdioClientTransport({
      command: "node",
      args: [resolve(PROJECT_ROOT, "dist", "index.js")],
      env,
      stderr: "pipe",
    });

    client = new Client({ name: "e2e-test", version: "1.0.0" });
    await client.connect(transport);
  });

  afterAll(async () => {
    try {
      await client.close();
    } catch {
      // Client may already be closed
    }
  });

  it("should list all 26 tools (25 + ping)", async () => {
    const result = await client.listTools();
    const toolNames = result.tools.map((t) => t.name).sort();

    expect(result.tools.length).toBe(26);
    expect(toolNames).toContain("reddit_ping");
    expect(toolNames).toContain("search");
    expect(toolNames).toContain("get_post");
    expect(toolNames).toContain("vote");
    expect(toolNames).toContain("approve");
    expect(toolNames).toContain("get_modqueue");
  });

  it("should call reddit_ping successfully", async () => {
    const result = await client.callTool({
      name: "reddit_ping",
      arguments: { message: "e2e" },
    });

    expect(result.content).toEqual([
      { type: "text", text: "pong: e2e" },
    ]);
  });

  it("should call a read tool (search)", async () => {
    const result = await client.callTool({
      name: "search",
      arguments: { q: "test" },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content.length).toBeGreaterThan(0);

    const parsed = JSON.parse(content[0].text);
    expect(parsed.posts).toBeDefined();
    expect(parsed.posts.length).toBeGreaterThan(0);
    expect(parsed.posts[0].title).toBe("Mock Post");
  });

  it("should call a write tool (vote)", async () => {
    const result = await client.callTool({
      name: "vote",
      arguments: { fullname: "t3_test", dir: 1 },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain("Upvoted");
    expect(content[0].text).toContain("t3_test");
  });

  it("should call a mod tool (approve)", async () => {
    const result = await client.callTool({
      name: "approve",
      arguments: { id: "t3_test" },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain("Approved");
    expect(content[0].text).toContain("t3_test");
  });

  it("should shut down cleanly", async () => {
    // Close the client — this sends the MCP close message
    await client.close();

    // Verify the transport's subprocess exited.
    // The pid should be accessible; once closed the process should be gone.
    const pid = transport.pid;
    if (pid !== null) {
      // Give the process a moment to exit
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if process is still running (signal 0 probes without killing)
      let stillRunning = true;
      try {
        process.kill(pid, 0);
      } catch {
        // Process not found — expected after clean shutdown
        stillRunning = false;
      }
      expect(stillRunning).toBe(false);
    }
  });
});
