# E07: MCP Resources and Prompts

## Status: Not Started

## Goal
Implement the 6 Resources and 4 Prompts that make this the only Reddit MCP server using all 3 MCP primitives.

## Dependencies
- E04 (Read Tools) — must be Done (Resources reuse read logic)
- E05 (Write Tools) — should be Done (Prompts reference write tools)
- E06 (Mod Tools) — should be Done (Prompts reference mod tools)

## Research References
- FINAL-CONSOLIDATED-RESEARCH.md section: 12
- research/06-oauth-and-mcp-architecture.md
- research/09-typescript-mcp-sdk-deep-dive.md

## Tasks

### E07-T01: Resources — subreddit info and rules
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E04-T03
- **Description**: Implement `reddit://subreddit/{name}/info` and `reddit://subreddit/{name}/rules` as MCP resource templates. Expose subreddit metadata and rules as structured, cacheable data.
- **Acceptance Criteria**:
  1. Resource URI pattern `reddit://subreddit/{name}/info` works
  2. Resource URI pattern `reddit://subreddit/{name}/rules` works
  3. Returns JSON with subscribers, description, rules as appropriate
  4. Resource templates registered with `server.resource()`
  5. MCP Inspector shows both resources
- **Out of Scope**: Subreddit settings or mod-only data
- **Notes**: Resources reuse the same Reddit API calls as the read tools but expose data through the Resource primitive

### E07-T02: Resources — user profile and post details
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E04-T05, E04-T02
- **Description**: Implement `reddit://user/{username}/about` and `reddit://post/{id}`. Expose user profiles and post details as MCP resources.
- **Acceptance Criteria**:
  1. User resource returns profile summary (karma, age, etc.)
  2. Post resource returns full post details
  3. Both reuse existing read tool logic internally
  4. URI templates correctly parameterized
- **Out of Scope**: User's post history as a resource
- **Notes**: Post ID in URI should accept bare ID or fullname

### E07-T03: Resources — wiki page and authenticated user
- **Status**: Not Started
- **Size**: S
- **Dependencies**: E04-T06, E04-T07
- **Description**: Implement `reddit://subreddit/{name}/wiki/{page}` and `reddit://me`. Wiki content and authenticated user profile as resources.
- **Acceptance Criteria**:
  1. Wiki resource returns page content as text
  2. `reddit://me` requires auth and returns authenticated user profile
  3. Auth-gated resource returns clear error when unauthenticated
  4. Both registered as resource templates
- **Out of Scope**: Wiki revision history
- **Notes**: `reddit://me` is unique — it's the only resource that requires user auth

### E07-T04: Prompt — reddit_research
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E04
- **Description**: Template for deep-dive research across subreddits. Params: `topic`, `subreddits` (optional list), `time_range`. Generates a structured prompt guiding the LLM to use search and read tools systematically.
- **Acceptance Criteria**:
  1. Prompt registered with `server.prompt()`
  2. Parameters validated by Zod schema
  3. Generated prompt text references available tools by name
  4. MCP Inspector shows prompt with params
- **Out of Scope**: Auto-executing tools (prompts are templates, not workflows)
- **Notes**: This is a workflow template — it tells the LLM how to use the tools together

### E07-T05: Prompts — moderate, content_plan, user_analysis
- **Status**: Not Started
- **Size**: M
- **Dependencies**: E04, E05, E06
- **Description**: Three workflow prompts: `reddit_moderate` (review modqueue), `reddit_content_plan` (content strategy), `reddit_user_analysis` (user history analysis).
- **Acceptance Criteria**:
  1. All 3 prompts registered and visible in MCP Inspector
  2. Each has relevant parameters with Zod validation
  3. Prompt text is actionable and references correct tools
  4. `reddit_moderate` references mod tools (approve, remove, ban_user)
  5. `reddit_user_analysis` references get_user, get_user_posts, get_user_comments
- **Out of Scope**: Complex multi-step workflows
- **Notes**: Prompts are our differentiator — only 1 of 39 competitors uses prompts at all
