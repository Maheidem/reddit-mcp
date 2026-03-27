# E01: Project Scaffolding

## Status: Not Started

## Goal
Set up a buildable, testable TypeScript project with MCP SDK wired and a hello-world tool that proves the pipeline works end-to-end.

## Dependencies
None (root epic).

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md sections: 6, 7
- research/09-typescript-mcp-sdk-deep-dive.md

## Tasks

### E01-T01: Initialize npm project and TypeScript
- **Status**: Not Started
- **Size**: S
- **Dependencies**: None
- **Description**: Create `package.json` with `"type": "module"`, install `@modelcontextprotocol/sdk@^1.28.0`, `zod@^4`, TypeScript 5.x, vitest, tsx. Configure `tsconfig.json` targeting ES2022/NodeNext.
- **Acceptance Criteria**:
  1. `npm run build` (tsc) succeeds
  2. `tsconfig.json` has `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`
  3. `package.json` has `"type": "module"` and `"bin"` entry pointing to built index
- **Out of Scope**: Source code beyond config files
- **Notes**: Use `tsx` for dev mode (`npm run dev`)

### E01-T02: Create source directory structure
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E01-T01
- **Description**: Create `src/` with subdirectories: `reddit/`, `tools/`, `resources/`, `prompts/`, `utils/`. Create barrel `index.ts` files. Match the layout from research doc 09.
- **Acceptance Criteria**:
  1. Directory tree matches prescribed layout
  2. Each subdirectory has an `index.ts` barrel
  3. `src/index.ts` entry point exists and is referenced by `package.json` bin
- **Out of Scope**: Actual implementation code
- **Notes**: Keep barrels empty with placeholder exports

### E01-T03: Wire STDIO transport with hello-world tool
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E01-T02
- **Description**: Create minimal `src/server.ts` using `McpServer` with one dummy tool (`reddit_ping`). Wire `StdioServerTransport` in `src/index.ts`. Prove it runs and responds.
- **Acceptance Criteria**:
  1. `npm run dev` starts server without errors
  2. MCP Inspector (`npx @modelcontextprotocol/inspector`) connects and lists `reddit_ping`
  3. Calling `reddit_ping` returns a text response
- **Out of Scope**: Real Reddit API calls
- **Notes**: Use `McpServer` (high-level API), never the low-level `Server` class. Import from `@modelcontextprotocol/sdk/server/mcp.js`.

### E01-T04: Configure linting and formatting
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E01-T01
- **Description**: Add ESLint (flat config) and Prettier. Configure for TypeScript ESM. Add `lint` and `format` npm scripts.
- **Acceptance Criteria**:
  1. `npm run lint` passes on existing code
  2. `npm run format` auto-formats
  3. ESLint enforces `no-unused-vars`, `no-explicit-any`, `consistent-type-imports`
- **Out of Scope**: Pre-commit hooks (can add later)
- **Notes**: Use flat config (`eslint.config.js`), not `.eslintrc`

### E01-T05: Configure test infrastructure
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E01-T03
- **Description**: Set up vitest with TypeScript support. Create first test using `InMemoryTransport` to call the `reddit_ping` tool.
- **Acceptance Criteria**:
  1. `npm test` runs and passes
  2. Test creates an in-memory MCP client, connects, calls `reddit_ping`, asserts on the response
  3. Test uses vitest `describe`/`it`/`expect`
- **Out of Scope**: Integration or E2E test patterns (those come in E08)
- **Notes**: `InMemoryTransport` from `@modelcontextprotocol/sdk/inMemory.js`
