/**
 * MCP Prompts barrel.
 *
 * Registers all Reddit MCP prompts on the server.
 *
 * @module
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResearchPrompt } from "./research.js";
import { registerModeratePrompt } from "./moderate.js";
import { registerContentPlanPrompt } from "./content-plan.js";
import { registerUserAnalysisPrompt } from "./user-analysis.js";

/**
 * Register all MCP prompts on the server.
 *
 * Prompts provide workflow templates that guide LLMs to use tools effectively:
 * - `reddit_research` — deep-dive research across subreddits
 * - `reddit_moderate` — modqueue review and action workflow
 * - `reddit_content_plan` — content strategy planning
 * - `reddit_user_analysis` — user history and engagement analysis
 */
export function registerPrompts(server: McpServer): void {
  registerResearchPrompt(server);
  registerModeratePrompt(server);
  registerContentPlanPrompt(server);
  registerUserAnalysisPrompt(server);
}

export { registerResearchPrompt } from "./research.js";
export { registerModeratePrompt } from "./moderate.js";
export { registerContentPlanPrompt } from "./content-plan.js";
export { registerUserAnalysisPrompt } from "./user-analysis.js";
