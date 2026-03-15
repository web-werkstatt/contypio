import type {
  ContypioConfig,
  Page,
  PageListItem,
  TreeNode,
  GetPageParams,
  ListPagesParams,
  PaginatedResult,
  BatchPagesResponse,
} from "../types.js";
import { request, postRequest } from "../fetch.js";

export class PagesResource {
  constructor(private readonly config: ContypioConfig) {}

  /**
   * Get a single published page by slug.
   *
   * @example
   * ```ts
   * const page = await client.pages.get("homepage");
   * const lite = await client.pages.get("about", { fields: ["title", "seo"] });
   * ```
   */
  async get(slug: string, params?: GetPageParams): Promise<Page> {
    const query: Record<string, unknown> = {};

    if (params?.includeCss) {
      query["include_css"] = "true";
    }
    if (params?.fields?.length) {
      query["fields"] = params.fields;
    }

    return request<Page>(this.config, `/content/pages/${encodeURIComponent(slug)}`, query);
  }

  /**
   * List all published pages (paginated).
   *
   * @example
   * ```ts
   * const result = await client.pages.list({ limit: 10 });
   * const listings = await client.pages.list({ pageType: "listing" });
   * ```
   */
  async list(params?: ListPagesParams): Promise<PaginatedResult<PageListItem>> {
    const query: Record<string, unknown> = {};

    if (params?.limit !== undefined) query["limit"] = params.limit;
    if (params?.offset !== undefined) query["offset"] = params.offset;
    if (params?.pageType) query["page_type"] = params.pageType;
    if (params?.parentId !== undefined) query["parent_id"] = params.parentId;
    if (params?.fields?.length) query["fields"] = params.fields;

    return request<PaginatedResult<PageListItem>>(this.config, "/content/pages", query);
  }

  /**
   * Get the hierarchical page tree (for navigation menus).
   *
   * @example
   * ```ts
   * const tree = await client.pages.tree();
   * ```
   */
  async tree(): Promise<TreeNode[]> {
    return request<TreeNode[]>(this.config, "/content/tree");
  }

  /**
   * Fetch multiple pages in a single request (max 50).
   * Returns a map of slug to page (null if not found).
   *
   * @example
   * ```ts
   * const result = await client.pages.batch(["home", "about", "blog"]);
   * const homePage = result.items["home"];      // Page | null
   * const missing = result.not_found;            // ["blog"]
   * ```
   */
  async batch(
    slugs: string[],
    params?: { fields?: string[]; includeCss?: boolean },
  ): Promise<BatchPagesResponse> {
    return postRequest<BatchPagesResponse>(this.config, "/content/pages/batch", {
      slugs,
      fields: params?.fields?.join(","),
      include_css: params?.includeCss ?? false,
    });
  }
}
