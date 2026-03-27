import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResearchPrompt } from "../../prompts/research.js";
import { registerModeratePrompt } from "../../prompts/moderate.js";
import { registerContentPlanPrompt } from "../../prompts/content-plan.js";
import { registerUserAnalysisPrompt } from "../../prompts/user-analysis.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedCallback: (...args: any[]) => any;
let capturedName: string;
let capturedDescription: string;

function createMockServer(): McpServer {
  return {
    prompt: vi.fn(
      (
        name: string,
        description: string,
        _schema: unknown,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (...args: any[]) => any,
      ) => {
        capturedName = name;
        capturedDescription = description;
        capturedCallback = callback;
      },
    ),
  } as unknown as McpServer;
}

describe("MCP Prompts", () => {
  describe("reddit_research", () => {
    let mockServer: McpServer;

    beforeEach(() => {
      mockServer = createMockServer();
      registerResearchPrompt(mockServer);
    });

    it("registers with the correct name", () => {
      expect(capturedName).toBe("reddit_research");
    });

    it("has a non-empty description", () => {
      expect(capturedDescription).toBeTruthy();
      expect(capturedDescription.length).toBeGreaterThan(0);
    });

    it("returns a valid GetPromptResult with at least one message", () => {
      const result = capturedCallback({ topic: "machine learning" });

      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("returns messages with role 'user'", () => {
      const result = capturedCallback({ topic: "machine learning" });

      for (const msg of result.messages) {
        expect(msg.role).toBe("user");
      }
    });

    it("includes the topic in the message text", () => {
      const result = capturedCallback({ topic: "machine learning" });
      const text = result.messages[0].content.text;

      expect(text).toContain("machine learning");
    });

    it("references the correct tool names", () => {
      const result = capturedCallback({ topic: "rust programming" });
      const text = result.messages[0].content.text;

      expect(text).toContain("`search`");
      expect(text).toContain("`get_post`");
      expect(text).toContain("`get_comments`");
      expect(text).toContain("`get_wiki_page`");
    });

    it("works with all parameters provided", () => {
      const result = capturedCallback({
        topic: "web frameworks",
        subreddits: "python,javascript",
        time_range: "month",
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("web frameworks");
      expect(text).toContain("r/python");
      expect(text).toContain("r/javascript");
      expect(text).toContain("t=month");
    });

    it("works with only the required topic parameter", () => {
      const result = capturedCallback({
        topic: "containerization",
        subreddits: undefined,
        time_range: undefined,
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("containerization");
      expect(text).toContain("Search across all of Reddit");
    });

    it("handles comma-separated subreddits as individual subreddit references", () => {
      const result = capturedCallback({
        topic: "testing",
        subreddits: "python,learnpython,programming",
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("r/python");
      expect(text).toContain("r/learnpython");
      expect(text).toContain("r/programming");
    });

    it("includes the time range as a Reddit t= parameter in the text", () => {
      const result = capturedCallback({
        topic: "AI",
        time_range: "week",
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("t=week");
    });

    it("defaults time parameter to 'all' when time_range is omitted", () => {
      const result = capturedCallback({ topic: "databases" });
      const text = result.messages[0].content.text;

      expect(text).toContain("t=all");
    });
  });

  describe("reddit_moderate", () => {
    let mockServer: McpServer;

    beforeEach(() => {
      mockServer = createMockServer();
      registerModeratePrompt(mockServer);
    });

    it("registers with the correct name", () => {
      expect(capturedName).toBe("reddit_moderate");
    });

    it("has a non-empty description", () => {
      expect(capturedDescription).toBeTruthy();
      expect(capturedDescription.length).toBeGreaterThan(0);
    });

    it("returns a valid GetPromptResult with at least one message", () => {
      const result = capturedCallback({ subreddit: "test" });

      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("returns messages with role 'user'", () => {
      const result = capturedCallback({ subreddit: "test" });

      for (const msg of result.messages) {
        expect(msg.role).toBe("user");
      }
    });

    it("includes the subreddit name in the message text", () => {
      const result = capturedCallback({ subreddit: "learnpython" });
      const text = result.messages[0].content.text;

      expect(text).toContain("r/learnpython");
    });

    it("references the correct tool names", () => {
      const result = capturedCallback({ subreddit: "test" });
      const text = result.messages[0].content.text;

      expect(text).toContain("`get_modqueue`");
      expect(text).toContain("`approve`");
      expect(text).toContain("`remove`");
      expect(text).toContain("`ban_user`");
      expect(text).toContain("`get_mod_log`");
      expect(text).toContain("`get_mod_notes`");
      expect(text).toContain("`get_subreddit_rules`");
      expect(text).toContain("`get_subreddit`");
    });
  });

  describe("reddit_content_plan", () => {
    let mockServer: McpServer;

    beforeEach(() => {
      mockServer = createMockServer();
      registerContentPlanPrompt(mockServer);
    });

    it("registers with the correct name", () => {
      expect(capturedName).toBe("reddit_content_plan");
    });

    it("has a non-empty description", () => {
      expect(capturedDescription).toBeTruthy();
      expect(capturedDescription.length).toBeGreaterThan(0);
    });

    it("returns a valid GetPromptResult with at least one message", () => {
      const result = capturedCallback({
        subreddit: "typescript",
        goal: "share tutorials",
      });

      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("returns messages with role 'user'", () => {
      const result = capturedCallback({
        subreddit: "typescript",
        goal: "share tutorials",
      });

      for (const msg of result.messages) {
        expect(msg.role).toBe("user");
      }
    });

    it("includes both subreddit and goal in the message text", () => {
      const result = capturedCallback({
        subreddit: "webdev",
        goal: "increase engagement",
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("r/webdev");
      expect(text).toContain("increase engagement");
    });

    it("references the correct tool names", () => {
      const result = capturedCallback({
        subreddit: "test",
        goal: "build presence",
      });
      const text = result.messages[0].content.text;

      expect(text).toContain("`get_subreddit`");
      expect(text).toContain("`get_subreddit_rules`");
      expect(text).toContain("`get_subreddit_posts`");
      expect(text).toContain("`get_post`");
      expect(text).toContain("`get_comments`");
      expect(text).toContain("`search`");
      expect(text).toContain("`get_trending`");
      expect(text).toContain("`create_post`");
      expect(text).toContain("`create_comment`");
    });
  });

  describe("reddit_user_analysis", () => {
    let mockServer: McpServer;

    beforeEach(() => {
      mockServer = createMockServer();
      registerUserAnalysisPrompt(mockServer);
    });

    it("registers with the correct name", () => {
      expect(capturedName).toBe("reddit_user_analysis");
    });

    it("has a non-empty description", () => {
      expect(capturedDescription).toBeTruthy();
      expect(capturedDescription.length).toBeGreaterThan(0);
    });

    it("returns a valid GetPromptResult with at least one message", () => {
      const result = capturedCallback({ username: "spez" });

      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("returns messages with role 'user'", () => {
      const result = capturedCallback({ username: "spez" });

      for (const msg of result.messages) {
        expect(msg.role).toBe("user");
      }
    });

    it("includes the username in the message text", () => {
      const result = capturedCallback({ username: "testuser123" });
      const text = result.messages[0].content.text;

      expect(text).toContain("testuser123");
      expect(text).toContain("u/testuser123");
    });

    it("references the correct tool names", () => {
      const result = capturedCallback({ username: "spez" });
      const text = result.messages[0].content.text;

      expect(text).toContain("`get_user`");
      expect(text).toContain("`get_user_posts`");
      expect(text).toContain("`get_user_comments`");
    });
  });
});
