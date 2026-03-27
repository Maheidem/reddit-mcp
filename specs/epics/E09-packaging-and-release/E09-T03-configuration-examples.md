# E09-T03: Configuration Examples

| Field | Value |
|-------|-------|
| **Epic** | [E09 — Packaging and Release](EPIC.md) |
| **Status** | Not Started |
| **Size** | S |
| **Dependencies** | E09-T02 |

## Description
Create `examples/` directory with: `claude_desktop_config.json`, `.env.example`, usage transcript showing tool calls and responses.

## Acceptance Criteria
1. Claude Desktop config is valid JSON with correct server path
2. `.env.example` has all vars with comments explaining each
3. Usage examples show realistic tool calls and responses

## Definition of Ready
- [ ] E09-T02 (README documentation) is Done -- tool names, env vars, and config format finalized
- [ ] FINAL section 3 read: auth tier env var names and which are optional vs required
- [ ] FINAL section 7.2 read: transport configuration (STDIO default, HTTP optional)
- [ ] Claude Desktop MCP config JSON structure understood
- [ ] Difference between minimal (read-only, Tier 1) and full (read+write+mod, Tier 3) configurations understood

## Definition of Done
- [ ] `examples/claude_desktop_config.json` is valid JSON with correct server command path and env var placeholders
- [ ] `.env.example` lists all environment variables with comments explaining each, grouped by auth tier
- [ ] `.env.example` clearly marks which vars are optional vs required per tier
- [ ] Usage transcript shows realistic tool call inputs and responses for at least 3 tools (1 read, 1 write, 1 mod)
- [ ] Both minimal (Tier 1, read-only) and full (Tier 3, all tools) config examples included
- [ ] All example file paths and env var names match actual implementation exactly
- [ ] `tsc --noEmit` passes with zero errors (no code changes, but verify no regressions)

## Out of Scope
Full tutorial or walkthrough

## Implementation Notes
- Include both minimal (read-only) and full (read+write+mod) config examples
- `.env.example` should document which vars are optional vs required per auth tier
- Usage transcript helps users understand what tool calls look like in practice

## Files to Create/Modify
- `examples/claude_desktop_config.json` — MCP client config for Claude Desktop
- `examples/.env.example` — all environment variables with comments
- `examples/usage-transcript.md` — realistic tool call examples
