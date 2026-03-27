/**
 * Integration tests for all 6 mod tools via real MCP protocol roundtrips.
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

describe("Mod Tools — Integration", () => {
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

  // ─── 1. approve ───────────────────────────────────────────────────

  describe("approve", () => {
    it("approves content successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "approve",
        arguments: { id: "t3_abc" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Approved t3_abc");
    });

    it("returns validation error for missing required id arg", async () => {
      const result = await client.callTool({ name: "approve", arguments: {} });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 2. remove ────────────────────────────────────────────────────

  describe("remove", () => {
    it("removes content successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "remove",
        arguments: { id: "t3_abc" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Removed");
      expect(text).toContain("t3_abc");
    });

    it("removes and marks as spam", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "remove",
        arguments: { id: "t3_abc", spam: true },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("spam");
    });
  });

  // ─── 3. ban_user ──────────────────────────────────────────────────

  describe("ban_user", () => {
    it("bans a user successfully", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "ban_user",
        arguments: {
          subreddit: "test",
          username: "baduser",
          reason: "spam",
          duration: 7,
          message: "You are banned",
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Banned u/baduser");
      expect(text).toContain("r/test");
      expect(text).toContain("7 day(s)");
    });

    it("permanent ban when duration omitted", async () => {
      mock.post.mockResolvedValueOnce(mockResponse({}));

      const result = await client.callTool({
        name: "ban_user",
        arguments: {
          subreddit: "test",
          username: "baduser",
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("permanently");
    });

    it("returns validation error for missing required subreddit arg", async () => {
      const result = await client.callTool({
        name: "ban_user",
        arguments: { username: "baduser" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── 4. get_modqueue ──────────────────────────────────────────────

  describe("get_modqueue", () => {
    it("returns modqueue items", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          data: {
            children: [
              {
                data: {
                  name: "t3_reported",
                  author: "spammer",
                  subreddit: "test",
                  title: "Spam post",
                  body: null,
                  num_reports: 3,
                  mod_reports: [],
                  user_reports: [["spam", 3]],
                  created_utc: 1700000000,
                  permalink: "/r/test/comments/reported/spam_post/",
                },
              },
            ],
            after: null,
          },
        }),
      );

      const result = await client.callTool({
        name: "get_modqueue",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("Spam post");
      expect(text).toContain("3 report(s)");
    });

    it("returns empty modqueue message", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          data: { children: [], after: null },
        }),
      );

      const result = await client.callTool({
        name: "get_modqueue",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("No items");
    });
  });

  // ─── 5. get_mod_log ───────────────────────────────────────────────

  describe("get_mod_log", () => {
    it("returns mod log entries", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          data: {
            children: [
              {
                data: {
                  id: "log1",
                  action: "removelink",
                  mod: "moduser",
                  target_author: "spammer",
                  target_fullname: "t3_abc",
                  target_title: "Spam",
                  target_body: null,
                  details: null,
                  description: null,
                  subreddit: "test",
                  created_utc: 1700000000,
                },
              },
            ],
            after: null,
          },
        }),
      );

      const result = await client.callTool({
        name: "get_mod_log",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("removelink");
      expect(text).toContain("moduser");
    });

    it("handles empty mod log", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          data: { children: [], after: null },
        }),
      );

      const result = await client.callTool({
        name: "get_mod_log",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("No mod log entries");
    });
  });

  // ─── 6. get_mod_notes ─────────────────────────────────────────────

  describe("get_mod_notes", () => {
    it("returns mod notes for a user", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          mod_notes: [
            {
              note_id: "note1",
              subreddit: "test",
              user: "someuser",
              created_at: 1700000000,
              created_by: "moduser",
              note: "warning",
              label: "ABUSE_WARNING",
              reddit_id: null,
            },
          ],
          start_cursor: null,
          end_cursor: null,
          has_next_page: false,
        }),
      );

      const result = await client.callTool({
        name: "get_mod_notes",
        arguments: { subreddit: "test", user: "someuser" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("warning");
      expect(text).toContain("moduser");
      expect(text).toContain("ABUSE_WARNING");
    });

    it("handles empty mod notes", async () => {
      mock.get.mockResolvedValueOnce(
        mockResponse({
          mod_notes: [],
          start_cursor: null,
          end_cursor: null,
          has_next_page: false,
        }),
      );

      const result = await client.callTool({
        name: "get_mod_notes",
        arguments: { subreddit: "test", user: "someuser" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("No mod notes");
    });

    it("returns validation error for missing required user arg", async () => {
      const result = await client.callTool({
        name: "get_mod_notes",
        arguments: { subreddit: "test" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("validation");
    });
  });

  // ─── Auth rejection ───────────────────────────────────────────────

  describe("auth rejection", () => {
    it("rejects approve when tier is anon", async () => {
      await env.cleanup();
      env = await createIntegrationServer({ tier: "anon" });
      client = env.client;

      const result = await client.callTool({
        name: "approve",
        arguments: { id: "t3_abc" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("user-level authentication");
    });

    it("rejects ban_user when tier is app", async () => {
      await env.cleanup();
      env = await createIntegrationServer({ tier: "app" });
      client = env.client;

      const result = await client.callTool({
        name: "ban_user",
        arguments: { subreddit: "test", username: "baduser" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0].text;
      expect(text).toContain("user-level authentication");
    });
  });
});
