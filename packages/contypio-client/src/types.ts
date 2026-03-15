// ---------------------------------------------------------------------------
// Contypio Delivery API — TypeScript Definitions
// ---------------------------------------------------------------------------

// ---- Client configuration -------------------------------------------------

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
   * Custom `fetch` implementation.
   * Defaults to the global `fetch`. Useful for testing or edge runtimes.
   */
  fetch?: typeof fetch;
}

// ---- Pagination -----------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface PaginationParams {
  /** Items per page (1–100, default 20). */
  limit?: number;
  /** Number of items to skip (default 0). */
  offset?: number;
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
}

export interface ListPagesParams extends PaginationParams {
  /** Filter by page type (e.g. "content", "listing"). */
  pageType?: string;
  /** Filter by parent page ID. */
  parentId?: number;
  /** Sparse fields. */
  fields?: string[];
}

// ---- Collections ----------------------------------------------------------

export interface CollectionItem {
  id: number;
  title: string;
  slug: string | null;
  sort_order: number;
  image_id: number | null;
  data: Record<string, unknown>;
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
}

// ---- Globals --------------------------------------------------------------

export interface Global {
  slug: string;
  label: string;
  data: Record<string, unknown>;
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
