// ---------------------------------------------------------------------------
// @contypio/client — Official TypeScript SDK for the Contypio Delivery API
// ---------------------------------------------------------------------------

// Client
export { ContypioClient, createClient } from "./client.js";

// Resource classes (for advanced typing)
export { PagesResource } from "./resources/pages.js";
export { CollectionsResource } from "./resources/collections.js";
export { GlobalsResource } from "./resources/globals.js";

// Errors
export { ContypioError, ContypioNetworkError } from "./errors.js";

// Types
export type {
  // Config
  ContypioConfig,
  RetryConfig,
  // Pagination
  PaginatedResult,
  PaginationParams,
  // Batch
  BatchPagesRequest,
  BatchPagesResponse,
  // Media
  Media,
  MediaSize,
  // Pages
  Page,
  Section,
  GridConfig,
  LayoutResolved,
  Column,
  Block,
  PageListItem,
  TreeNode,
  GetPageParams,
  ListPagesParams,
  // Collections
  CollectionItem,
  SortDirection,
  SortField,
  FilterOperator,
  ListCollectionParams,
  // Globals
  Global,
  // Errors
  ProblemDetail,
  ValidationError,
} from "./types.js";
