import type { ContypioConfig } from "./types.js";
import { PagesResource } from "./resources/pages.js";
import { CollectionsResource } from "./resources/collections.js";
import { GlobalsResource } from "./resources/globals.js";

/**
 * Contypio Delivery API client.
 *
 * @example
 * ```ts
 * import { createClient } from "@contypio/client";
 *
 * const client = createClient({
 *   baseUrl: "https://cms.example.com",
 * });
 *
 * const page = await client.pages.get("homepage");
 * const blog = await client.collections.list("blog-posts", { sort: "-created_at" });
 * const globals = await client.globals.all();
 * ```
 */
export class ContypioClient {
  readonly pages: PagesResource;
  readonly collections: CollectionsResource;
  readonly globals: GlobalsResource;

  constructor(config: ContypioConfig) {
    if (!config.baseUrl) {
      throw new Error("ContypioClient: baseUrl is required");
    }

    this.pages = new PagesResource(config);
    this.collections = new CollectionsResource(config);
    this.globals = new GlobalsResource(config);
  }
}

/**
 * Create a new Contypio client.
 *
 * @example
 * ```ts
 * // Minimal — public delivery API
 * const client = createClient({ baseUrl: "https://cms.example.com" });
 *
 * // With API key — scoped collection access
 * const client = createClient({
 *   baseUrl: "https://cms.example.com",
 *   apiKey: "cms_abc123…",
 * });
 *
 * // Multi-tenant
 * const client = createClient({
 *   baseUrl: "https://cms.example.com",
 *   tenant: "my-site",
 * });
 *
 * // Custom fetch (e.g. Cloudflare Workers, testing)
 * const client = createClient({
 *   baseUrl: "https://cms.example.com",
 *   fetch: customFetchFn,
 * });
 * ```
 */
export function createClient(config: ContypioConfig): ContypioClient {
  return new ContypioClient(config);
}
