import type { ContypioConfig } from "./types.js";
import { PagesResource } from "./resources/pages.js";
import { CollectionsResource } from "./resources/collections.js";
import { GlobalsResource } from "./resources/globals.js";
import { LocalesResource } from "./resources/locales.js";

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
 *
 * // With default locale
 * const deClient = createClient({
 *   baseUrl: "https://cms.example.com",
 *   locale: "de",
 * });
 * const dePage = await deClient.pages.get("homepage"); // locale=de by default
 * ```
 */
export class ContypioClient {
  readonly pages: PagesResource;
  readonly collections: CollectionsResource;
  readonly globals: GlobalsResource;
  readonly locales: LocalesResource;

  constructor(config: ContypioConfig) {
    if (!config.baseUrl) {
      throw new Error("ContypioClient: baseUrl is required");
    }

    this.pages = new PagesResource(config);
    this.collections = new CollectionsResource(config);
    this.globals = new GlobalsResource(config);
    this.locales = new LocalesResource(config);
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
 * // Multi-tenant with locale
 * const client = createClient({
 *   baseUrl: "https://cms.example.com",
 *   tenant: "my-site",
 *   locale: "de",
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
