# E09: Packaging and Release

## Status: Not Started

## Goal
Package the server for npm distribution and create comprehensive end-user documentation.

## Dependencies
- E04-E08 substantially done (server is functional and tested)

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 6, 7
- research/09-typescript-mcp-sdk-deep-dive.md (deployment section)

## Tasks

### E09-T01: npm packaging configuration
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E04, E05, E06
- **Description**: Finalize `package.json`: `bin` entry, `files` whitelist, `engines`, `keywords`, `description`, `repository`. Add `prepublishOnly` script. Ensure `npx reddit-mcp-server` works.
- **Acceptance Criteria**:
  1. `npm pack` produces clean tarball (no tests, research, specs)
  2. `npx reddit-mcp-server` starts the server
  3. `files` field excludes tests, research, specs, .github
  4. `engines` specifies Node >= 18
  5. `prepublishOnly` runs build + test
- **Out of Scope**: npm publish automation (manual for v1.0)
- **Notes**: Package name: `reddit-mcp-server` (check npm availability)

### E09-T02: README documentation
- **Status**: Not Started
- **Size**: L
- **Dependencies**: E09-T01
- **Description**: Comprehensive README: installation, config (env vars), all 25 tools with descriptions, MCP client config examples, auth tier explanation, troubleshooting.
- **Acceptance Criteria**:
  1. Installation section with npm and npx
  2. All 25 tools documented with parameter tables
  3. Config examples for Claude Desktop, Claude Code, Cursor
  4. Auth tier table with env var requirements
  5. Troubleshooting for common errors (auth, rate limits, permissions)
- **Out of Scope**: API reference docs (TSDoc covers this)
- **Notes**: README is the first thing users see — it must be excellent

### E09-T03: Configuration examples
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E09-T02
- **Description**: Create `examples/` directory with: `claude_desktop_config.json`, `.env.example`, usage transcript showing tool calls and responses.
- **Acceptance Criteria**:
  1. Claude Desktop config is valid JSON with correct server path
  2. `.env.example` has all vars with comments explaining each
  3. Usage examples show realistic tool calls and responses
- **Out of Scope**: Full tutorial or walkthrough
- **Notes**: Include both minimal (read-only) and full (read+write+mod) config examples

### E09-T04: CHANGELOG and release process
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E09-T01
- **Description**: Create CHANGELOG.md. Document release process. Add `release` npm script.
- **Acceptance Criteria**:
  1. CHANGELOG follows Keep a Changelog format
  2. Release script: build → test → version bump
  3. First entry documents v1.0.0 feature set
- **Out of Scope**: Automated publishing, semantic-release
- **Notes**: Follow semver strictly

### E09-T05: Optional — Streamable HTTP transport
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E04, E05, E06
- **Description**: Add Streamable HTTP transport for hosted deployments. Behind `--transport http` flag. STDIO remains default.
- **Acceptance Criteria**:
  1. Server starts in HTTP mode with `--transport http`
  2. Connects via Streamable HTTP protocol
  3. DNS rebinding protection enabled
  4. STDIO remains default when no flag
- **Out of Scope**: SSE transport (deprecated March 2025)
- **Notes**: Use express or hono integration from MCP SDK. This is optional for v1.0.
