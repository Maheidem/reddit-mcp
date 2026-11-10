import { describe, it, expect } from "vitest";
import os from "node:os";
import path from "node:path";
import { resolvePaths } from "../../utils/paths.js";

describe("resolvePaths", () => {
  it("should fall back to defaults under home dir when env unset", () => {
    const paths = resolvePaths({});
    const base = path.join(os.homedir(), ".reddit-mcp");
    expect(paths.dataDir).toBe(path.join(base, "data"));
    expect(paths.configDir).toBe(path.join(base, "config"));
    expect(paths.logDir).toBe(path.join(base, "logs"));
  });

  it("should respect MCP_*_DIR env vars when set", () => {
    const paths = resolvePaths({
      MCP_DATA_DIR: "/app/data",
      MCP_CONFIG_DIR: "/app/config",
      MCP_LOG_DIR: "/app/logs",
    });
    expect(paths.dataDir).toBe("/app/data");
    expect(paths.configDir).toBe("/app/config");
    expect(paths.logDir).toBe("/app/logs");
  });

  it("should treat empty / whitespace-only env vars as unset", () => {
    const paths = resolvePaths({
      MCP_DATA_DIR: "   ",
      MCP_CONFIG_DIR: "",
    });
    const base = path.join(os.homedir(), ".reddit-mcp");
    expect(paths.dataDir).toBe(path.join(base, "data"));
    expect(paths.configDir).toBe(path.join(base, "config"));
  });
});
