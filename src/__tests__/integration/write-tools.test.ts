/**
 * Integration tests for all 7 write tools via real MCP protocol roundtrips.
 * Uses InMemoryTransport with mocked RedditClient.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  createIntegrationServer,
  mockResponse,
  type MockRedditClient,
  type IntegrationServer,
} from "../helpers/integration-server.js";

describe("Write Tools — Integration", () => {
  let env: IntegrationServer;
  let client: Client;
  let mock: MockRedditClient;

  beforeEach(async () => {
    env = await createIntegrationServer({ tier: "user" });
    client = env.client;
    mock = env.mockRedditClient;
  });

  afterEach(async () => {
    await env.cleanup();
  });

  // ─── 1. create_post ───────────────────────────────────────────────

  describe("create_post", () => {
    it("creates a text post successfully", async () => {
      mock.post.mockResolvedValueOnce(
        mockResponse({
          json: {
            errors: [],
            data: {
              name: "t3_new",
              url: "https://reddit.com/r/test/new",
              id: "new",
            },
          },
        }),
      );

      const result = await client.callTool({
        name: "create_post",
        arguments: {
          subreddit: "test",
          title: `Integration Test Post ${Date.now()}`,
        },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.id).toBe("t3_new");
      expect(parsed.message).toContain("created successfully");
    });

    it("returns validation error for missing required title arg", async () => {
      const result = await client.callTool({
        name: "create_post",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 2. create_comment ────────────────────────────────────────────

  describe("create_comment", () => {
    it("creates a comment successfully", async () => {
      mock.post.mockResolvedValueOnce(
        mockResponse({
          json: {
            errors: [],
            data: {
              things: [{ data: { name: "t1_new", id: "new" } }],
            },
          },
        }),
      );

      const result = await client.callTool({
        name: "create_comment",
        arguments: { parent: "t3_abc", text: "Nice!" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.id).toBe("t1_new");
      expect(parsed.message).toContain("Comment created");
    });

    it("returns validation error for missing required text arg", async () => {
      const result = await client.callTool({
        name: "create_comment",
        arguments: { parent: "t3_abc" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 3. reply_message ─────────────────────────────────────────────

  describe("reply_message", () => {
    it("replies to a message successfully", async () => {
      mock.post.mockResolvedValueOnce(
        mockResponse({
          json: {
            errors: [],
            data: {
              things: [{ data: { name: "t4_reply", id: "reply" } }],
            },
          },
        }),
      );

      const result = await client.callTool({
        name: "reply_message",
        arguments: { parent: "t4_msg", text: "Thanks" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.id).toBe("t4_reply");
      expect(parsed.message).toContain("reply sent");
    });
  });

  // ─── 4. edit_text ─────────────────────────────────────────────────

  describe("edit_text", () => {
    it("edits content successfully", async () => {
      mock.post.mockResolvedValueOnce(
        mockResponse({
          json: {
            errors: [],
            data: {
              things: [{ data: { name: "t3_abc", body: "Updated" } }],
            },
          },
        }),
      );

      const result = await client.callTool({
        name: "edit_text",
        arguments: { fullname: "t3_abc", text: "Updated" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.id).toBe("t3_abc");
      expect(parsed.message).toContain("edited successfully");
    });

    it("returns validation error for missing required text arg", async () => {
      const result = await client.callTool({
        name: "edit_text",
        arguments: { fullname: "t3_abc" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 5. delete_content ────────────────────────────────────────────

  describe("delete_content", () => {
    it("deletes content successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "delete_content",
        arguments: { fullname: "t3_abc" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Deleted t3_abc");
    });

    it("returns validation error for missing required fullname arg", async () => {
      const result = await client.callTool({
        name: "delete_content",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 6. vote ──────────────────────────────────────────────────────

  describe("vote", () => {
    it("upvotes successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "vote",
        arguments: { fullname: "t3_abc", dir: 1 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Upvoted");
    });

    it("returns validation error for missing required dir arg", async () => {
      const result = await client.callTool({
        name: "vote",
        arguments: { fullname: "t3_abc" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 7. send_message ─────────────────────────────────────────────

  describe("send_message", () => {
    it("sends a message successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "send_message",
        arguments: { to: "someuser", subject: "Hi", text: "Hello" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      expect(parsed.to).toBe("someuser");
      expect(parsed.message).toContain("sent successfully");
    });

    it("returns validation error for missing required args", async () => {
      const result = await client.callTool({
        name: "send_message",
        arguments: { to: "someuser" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── Auth rejection ───────────────────────────────────────────────

  describe("auth rejection", () => {
    it("rejects create_post when tier is anon", async () => {
      await env.cleanup();
      env = await createIntegrationServer({ tier: "anon" });
      client = env.client;

      const result = await client.callTool({
        name: "create_post",
        arguments: {
          subreddit: "test",
          title: `Auth Rejection Test ${Date.now()}`,
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("user-level authentication");
    });

    it("rejects vote when tier is app", async () => {
      await env.cleanup();
      env = await createIntegrationServer({ tier: "app" });
      client = env.client;

      const result = await client.callTool({
        name: "vote",
        arguments: { fullname: "t3_abc", dir: 1 },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("user-level authentication");
    });
  });
});
