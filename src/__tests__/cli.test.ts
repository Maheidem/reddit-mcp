import { describe, it, expect } from "vitest";
import { getFlag, resolveHttpOptions } from "../cli.js";

describe("getFlag", () => {
  it("parses `--flag value` form", () => {
    expect(getFlag(["--host", "0.0.0.0"], "--host")).toBe("0.0.0.0");
  });

  it("parses `--flag=value` form", () => {
    expect(getFlag(["--host=0.0.0.0"], "--host")).toBe("0.0.0.0");
  });

  it("returns undefined when flag is absent", () => {
    expect(getFlag(["--port", "8080"], "--host")).toBeUndefined();
  });

  it("returns undefined when flag is the last token without a value", () => {
    expect(getFlag(["--host"], "--host")).toBeUndefined();
  });
});

describe("resolveHttpOptions — host precedence", () => {
  it("CLI flag wins over env var", () => {
    const r = resolveHttpOptions(["--host", "0.0.0.0"], { MCP_HTTP_HOST: "127.0.0.1" });
    expect(r.host).toBe("0.0.0.0");
  });

  it("env var is used when no flag", () => {
    const r = resolveHttpOptions([], { MCP_HTTP_HOST: "0.0.0.0" });
    expect(r.host).toBe("0.0.0.0");
  });

  it("undefined when neither flag nor env (transport applies its own default)", () => {
    const r = resolveHttpOptions([], {});
    expect(r.host).toBeUndefined();
  });
});

describe("resolveHttpOptions — port precedence", () => {
  it("CLI flag wins over env var", () => {
    const r = resolveHttpOptions(["--port", "8080"], { MCP_HTTP_PORT: "9090" });
    expect(r.port).toBe(8080);
    expect(r.error).toBeUndefined();
  });

  it("env var is used when no flag", () => {
    const r = resolveHttpOptions([], { MCP_HTTP_PORT: "8080" });
    expect(r.port).toBe(8080);
  });

  it("undefined when neither flag nor env", () => {
    const r = resolveHttpOptions([], {});
    expect(r.port).toBeUndefined();
    expect(r.error).toBeUndefined();
  });
});

describe("resolveHttpOptions — port validation", () => {
  it("rejects non-numeric port from flag", () => {
    const r = resolveHttpOptions(["--port", "abc"], {});
    expect(r.port).toBeUndefined();
    expect(r.error).toContain("invalid port");
  });

  it("rejects out-of-range port from env", () => {
    const r = resolveHttpOptions([], { MCP_HTTP_PORT: "99999" });
    expect(r.port).toBeUndefined();
    expect(r.error).toContain("invalid port");
  });

  it("rejects port below 1", () => {
    const r = resolveHttpOptions(["--port", "0"], {});
    expect(r.port).toBeUndefined();
    expect(r.error).toContain("invalid port");
  });
});
