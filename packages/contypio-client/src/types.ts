// ---------------------------------------------------------------------------
// Contypio Delivery API — TypeScript Definitions
// ---------------------------------------------------------------------------

// ---- Client configuration -------------------------------------------------

export interface RetryConfig {
  /** Maximum number of retries on 429 responses (default: 3). */
  maxRetries?: number;
  /** Initial backoff delay in ms (default: 1000). Doubles with each retry. */
  initialDelayMs?: number;
}

export interface ContypioConfig {
  /** Base URL of your Contypio instance (e.g. "https://cms.example.com"). */
  baseUrl: string;

  /** Optional API key for scoped collection access (`cms_…`). */
  apiKey?: string;

  /**
   * Optional tenant identifier (slug or domain).
   * Sent as `X-Tenant` header. Only needed in multi-tenant setups.
   */
  tenant?: string;

  /**
   * Default locale for all requests. Can be overridden per-method.
   * BCP 47 format (e.g. "de", "en", "de-AT").
   */
  locale?: string;

  /**
   * Custom `fetch` implementation.
   * Defaults to the global `fetch`. Useful for testing or edge runtimes.
   */
  fetch?: typeof fetch;

  /**
   * Retry configuration for rate-limited requests (HTTP 429).
   * Set to `false` to disable retries. Default: 3 retries with exponential backoff.
   */
  retry?: RetryConfig | false;
}

// ---- Pagination -----------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  /** Opaque cursor for the next page (cursor-based pagination). */
  next_cursor?: string | null;
  /** Opaque cursor for the previous page (cursor-based pagination). */
  prev_cursor?: string | null;
}

export interface PaginationParams {
  /** Items per page (1–100, default 20). */
  limit?: number;
  /** Number of items to skip (default 0). */
  offset?: number;
}

// ---- Batch ----------------------------------------------------------------

export interface BatchPagesRequest {
  /** Page slugs to fetch (max 50). */
  slugs: string[];
  /** Comma-separated sparse fields. */
  fields?: string;
  /** Include CSS for grid layouts. */
  include_css?: boolean;
  /** BCP 47 locale. */
  locale?: string;
}

export interface BatchPagesResponse {
  /** Map of slug to page (null if not found). */
  items: Record<string, Page | null>;
  /** Number of successfully resolved pages. */
  resolved: number;
  /** Slugs that were not found. */
  not_found: string[];
}

// ---- Media ----------------------------------------------------------------

export interface Media {
  id: number;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizes: Record<string, MediaSize>;
}

export interface MediaSize {
  url: string;
  width?: number;
  height?: number;
}

// ---- Pages ----------------------------------------------------------------

export interface LocaleMetadata {
  /** The locale that was requested. */
  requested: string;
  /** The locale that was actually resolved (after fallback). */
  resolved: string;
  /** Fields where a fallback locale was used. Map of field → fallback locale. */
  fallbacks_used: Record<string, string>;
}

export interface LocaleInfo {
  locale: string;
  completeness: number;
}

export interface LocalesResponse {
  locales: string[];
  default: string;
}

export interface PageLocalesResponse {
  locales: LocaleInfo[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  path: string;
  page_type: string;
  collection_key: string | null;
  seo: Record<string, unknown>;
  hero: Record<string, unknown>;
  sections: Section[];
  published_at: string | null;
  parent_id?: number | null;
  collection?: PaginatedResult<CollectionItem>;
  _locale?: LocaleMetadata;
}

export interface Section {
  id?: string;
  layout: string;
  grid_config?: GridConfig;
  layout_resolved: LayoutResolved;
  columns: Column[];
}

export interface GridConfig {
  tracks?: string[];
  gap?: string;
  areas?: string[];
}

export interface LayoutResolved {
  key: string;
  grid_config: GridConfig | null;
  css?: string | null;
}

export interface Column {
  blocks: Block[];
}

export interface Block {
  blockType: string;
  data: Record<string, unknown>;
}

export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  path: string;
  page_type: string;
  seo: Record<string, unknown>;
  hero: Record<string, unknown>;
  published_at: string | null;
  [key: string]: unknown;
}

export interface TreeNode {
  id: number;
  title: string;
  slug: string;
  path: string;
  page_type: string;
  children: TreeNode[];
}

// ---- Page query params ----------------------------------------------------

export interface GetPageParams {
  /** Include scoped CSS for grid layouts. */
  includeCss?: boolean;
  /** Sparse fields — only return these fields (id, slug, path always included). */
  fields?: string[];
  /** BCP 47 locale (e.g. "de", "en", "de-AT"). Overrides client default. */
  locale?: string;
}

export interface ListPagesParams extends PaginationParams {
  /** Filter by page type (e.g. "content", "listing"). */
  pageType?: string;
  /** Filter by parent page ID. */
  parentId?: number;
  /** Sparse fields. */
  fields?: string[];
  /** BCP 47 locale. Overrides client default. */
  locale?: string;
}

// ---- Collections ----------------------------------------------------------

export interface CollectionItem {
  id: number;
  title: string;
  slug: string | null;
  sort_order: number;
  image_id: number | null;
  data: Record<string, unknown>;
  _locale?: LocaleMetadata;
}

export type SortDirection = "asc" | "desc";

export type SortField =
  | "sort_order"
  | "title"
  | "slug"
  | "created_at"
  | "updated_at";

export interface FilterOperator {
  eq?: string;
  ne?: string;
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
  contains?: string;
  in?: string;
}

export interface ListCollectionParams extends PaginationParams {
  /**
   * Sort field with optional direction.
   *
   * Formats:
   * - `"-title"` — descending (prefix `-`)
   * - `"title:asc"` — explicit direction
   * - `"title"` — ascending (default)
   */
  sort?: string;
  /** Full-text search in title and data fields. */
  search?: string;
  /**
   * Bracket-notation filters.
   *
   * Example: `{ price: { gte: "100" }, status: { eq: "active" } }`
   */
  filter?: Record<string, FilterOperator>;
  /** Opaque cursor from a previous response. When set, `offset` is ignored. */
  cursor?: string;
  /** BCP 47 locale. Overrides client default. */
  locale?: string;
}

// ---- Globals --------------------------------------------------------------

export interface Global {
  slug: string;
  label: string;
  data: Record<string, unknown>;
  _locale?: LocaleMetadata;
}

export interface GetGlobalParams {
  /** BCP 47 locale. Overrides client default. */
  locale?: string;
}

// ---- Errors (RFC 7807) ----------------------------------------------------

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: string;
}
