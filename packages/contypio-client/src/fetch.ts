import type { ContypioConfig, ProblemDetail } from "./types.js";
import { ContypioError, ContypioNetworkError } from "./errors.js";

/** Build default headers from config. */
function buildHeaders(config: ContypioConfig): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  if (config.tenant) {
    headers["X-Tenant"] = config.tenant;
  }

  return headers;
}

/** Join base URL with path, avoiding double slashes. */
function joinUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/** Serialize query params, including bracket-notation filters. */
export function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (key === "filter" && typeof value === "object") {
      const filters = value as Record<string, Record<string, string>>;
      for (const [field, ops] of Object.entries(filters)) {
        for (const [op, val] of Object.entries(ops)) {
          parts.push(
            `filter[${encodeURIComponent(field)}][${encodeURIComponent(op)}]=${encodeURIComponent(val)}`,
          );
        }
      }
      continue;
    }

    if (Array.isArray(value)) {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`,
      );
      continue;
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/**
 * Low-level HTTP request to the Contypio Delivery API.
 * Throws `ContypioError` on API errors, `ContypioNetworkError` on network failures.
 */
export async function request<T>(
  config: ContypioConfig,
  path: string,
  query: Record<string, unknown> = {},
): Promise<T> {
  const url = joinUrl(config.baseUrl, path) + buildQuery(query);
  const headers = buildHeaders(config);
  const fetchFn = config.fetch ?? fetch;

  let response: Response;

  try {
    response = await fetchFn(url, {
      method: "GET",
      headers,
    });
  } catch (err) {
    throw new ContypioNetworkError(
      `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  // 304 Not Modified — should not happen with SDK (no conditional headers yet)
  // but handle gracefully
  if (response.status === 304) {
    return undefined as T;
  }

  if (!response.ok) {
    let problem: ProblemDetail;
    try {
      problem = (await response.json()) as ProblemDetail;
    } catch {
      problem = {
        type: `https://contypio.com/errors/unknown`,
        title: response.statusText || "Unknown Error",
        status: response.status,
        detail: `HTTP ${response.status} from ${path}`,
      };
    }
    throw new ContypioError(problem);
  }

  return (await response.json()) as T;
}
