/**
 * Shared utilities barrel.
 * Exports are added as utility functions are created.
 */
export {
  decodeRedditUrl,
  isDeleted,
  isRemoved,
  detectPostTypeFromRaw,
  extractPagination,
} from "./normalize.js";
export type { PaginationInfo } from "./normalize.js";
export {
  CONTENT_LIMITS,
  validateTitle,
  validateBody,
  validateComment,
  validateMessage,
  validateFlair,
  appendBotFooter,
  contentLengthWithFooter,
  DuplicateDetector,
} from "./safety.js";
export type { ValidationResult } from "./safety.js";
