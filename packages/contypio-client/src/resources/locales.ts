import type { ContypioConfig, LocalesResponse } from "../types.js";
import { request } from "../fetch.js";

export class LocalesResource {
  constructor(private readonly config: ContypioConfig) {}

  /**
   * List all available locales for the current tenant.
   *
   * @example
   * ```ts
   * const { locales, default: defaultLocale } = await client.locales.list();
   * // { locales: ["en", "de", "de-AT"], default: "en" }
   * ```
   */
  async list(): Promise<LocalesResponse> {
    return request<LocalesResponse>(this.config, "/content/locales");
  }
}
