/**
 * Transport modules for the Reddit MCP Server.
 *
 * - STDIO: Default transport for local CLI tools (via MCP SDK StdioServerTransport)
 * - HTTP: Optional Streamable HTTP transport for hosted deployments
 *
 * @module
 */

export { startHttpTransport } from "./http.js";
export type { HttpTransportOptions } from "./http.js";
