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
   * // With search
   * const results = await client.collections.list("products", {
   *   search: "beach",
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

    return request<PaginatedResult<CollectionItem>>(
      this.config,
      `/content/collections/${encodeURIComponent(key)}`,
      query,
    );
  }
}
