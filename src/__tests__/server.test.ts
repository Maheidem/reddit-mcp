import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";

describe("Reddit MCP Server", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterEach(async () => {
    await cleanup();
  });

  describe("reddit_ping", () => {
    it("should return default pong when called without message", async () => {
      const result = await client.callTool({ name: "reddit_ping", arguments: {} });

      expect(result.isError).toBeFalsy();
      expect(result.content).toEqual([
        { type: "text", text: "pong — reddit-mcp-server is running" },
      ]);
    });

    it("should echo back the provided message", async () => {
      const result = await client.callTool({
        name: "reddit_ping",
        arguments: { message: "hello" },
      });

      expect(result.isError).toBeFalsy();
      expect(result.content).toEqual([{ type: "text", text: "pong: hello" }]);
    });
  });

  describe("tool listing", () => {
    it("should list reddit_ping in available tools", async () => {
      const result = await client.listTools();

      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools.map((t) => t.name)).toContain("reddit_ping");
    });
  });
});
