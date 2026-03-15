import type { ContypioConfig, Global, GetGlobalParams } from "../types.js";
import { request } from "../fetch.js";

export class GlobalsResource {
  constructor(private readonly config: ContypioConfig) {}

  /** Resolve effective locale: param > config default. */
  private _locale(paramLocale?: string): string | undefined {
    return paramLocale ?? this.config.locale;
  }

  /**
   * Get a single global by slug.
   *
   * @example
   * ```ts
   * const footer = await client.globals.get("footer");
   * const nav = await client.globals.get("main-navigation", { locale: "de" });
   * ```
   */
  async get(slug: string, params?: GetGlobalParams): Promise<Global> {
    const query: Record<string, unknown> = {};
    const locale = this._locale(params?.locale);
    if (locale) query["locale"] = locale;
    return request<Global>(this.config, `/content/globals/${encodeURIComponent(slug)}`, query);
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
  async all(params?: GetGlobalParams): Promise<Global[]> {
    const query: Record<string, unknown> = {};
    const locale = this._locale(params?.locale);
    if (locale) query["locale"] = locale;
    return request<Global[]>(this.config, "/content/globals/", query);
  }
}
