import type {
  ContypioConfig,
  CollectionItem,
  ListCollectionParams,
  PaginatedResult,
} from "../types.js";
import { request } from "../fetch.js";

export class CollectionsResource {
  constructor(private readonly config: ContypioConfig) {}

  /**
   * List items from a collection by key (paginated).
   * Supports both offset and cursor-based pagination.
   *
   * @example
   * ```ts
   * // Simple listing
   * const blog = await client.collections.list("blog-posts");
   *
   * // With sorting and filters
   * const tours = await client.collections.list("tours", {
   *   sort: "-created_at",
   *   limit: 10,
   *   filter: { price: { gte: "100" }, status: { eq: "active" } },
   * });
   *
   * // Cursor-based pagination
   * const page1 = await client.collections.list("tours", { limit: 50 });
   * const page2 = await client.collections.list("tours", {
   *   limit: 50,
   *   cursor: page1.next_cursor!,
   * });
   * ```
   */
  async list(
    key: string,
    params?: ListCollectionParams,
  ): Promise<PaginatedResult<CollectionItem>> {
    const query: Record<string, unknown> = {};

    if (params?.limit !== undefined) query["limit"] = params.limit;
    if (params?.offset !== undefined) query["offset"] = params.offset;
    if (params?.sort) query["sort"] = params.sort;
    if (params?.search) query["search"] = params.search;
    if (params?.filter) query["filter"] = params.filter;
    if (params?.cursor) query["cursor"] = params.cursor;

    return request<PaginatedResult<CollectionItem>>(
      this.config,
      `/content/collections/${encodeURIComponent(key)}`,
      query,
    );
  }

  /**
   * Async iterator that automatically pages through all collection items.
   * Uses cursor-based pagination for efficient deep traversal.
   *
   * @example
   * ```ts
   * // Iterate over all tours
   * for await (const tour of client.collections.iterate("tours", { sort: "-created_at" })) {
   *   console.log(tour.title);
   * }
   *
   * // Collect all items into an array
   * const allTours: CollectionItem[] = [];
   * for await (const tour of client.collections.iterate("tours")) {
   *   allTours.push(tour);
   * }
   * ```
   */
  async *iterate(
    key: string,
    params?: Omit<ListCollectionParams, "offset" | "cursor">,
  ): AsyncGenerator<CollectionItem, void, undefined> {
    const limit = params?.limit ?? 100;
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.list(key, {
        ...params,
        limit,
        cursor,
      });

      for (const item of result.items) {
        yield item;
      }

      hasMore = result.has_more && result.items.length > 0;
      cursor = result.next_cursor ?? undefined;

      // Fallback: if API doesn't return cursor, stop to prevent infinite loop
      if (hasMore && !cursor) break;
    }
  }
}
