import type { ContypioConfig, Global } from "../types.js";
import { request } from "../fetch.js";

export class GlobalsResource {
  constructor(private readonly config: ContypioConfig) {}

  /**
   * Get a single global by slug.
   *
   * @example
   * ```ts
   * const footer = await client.globals.get("footer");
   * const nav = await client.globals.get("main-navigation");
   * ```
   */
  async get(slug: string): Promise<Global> {
    return request<Global>(this.config, `/content/globals/${encodeURIComponent(slug)}`);
  }

  /**
   * Get all globals in a single request.
   * Optimized for static site builds where you need everything at once.
   *
   * @example
   * ```ts
   * const globals = await client.globals.all();
   * const footer = globals.find(g => g.slug === "footer");
   * ```
   */
  async all(): Promise<Global[]> {
    return request<Global[]>(this.config, "/content/globals/");
  }
}
