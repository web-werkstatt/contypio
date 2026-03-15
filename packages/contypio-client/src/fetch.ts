import type { ContypioConfig, ProblemDetail, RetryConfig } from "./types.js";
import { ContypioError, ContypioNetworkError } from "./errors.js";

/** Default retry settings for 429 responses. */
const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
};

/** Build default headers from config. */
function buildHeaders(config: ContypioConfig, method: string = "GET"): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }

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

/** Resolve retry config from user config. */
function resolveRetry(config: ContypioConfig): Required<RetryConfig> | null {
  if (config.retry === false) return null;
  if (!config.retry) return DEFAULT_RETRY;
  return {
    maxRetries: config.retry.maxRetries ?? DEFAULT_RETRY.maxRetries,
    initialDelayMs: config.retry.initialDelayMs ?? DEFAULT_RETRY.initialDelayMs,
  };
}

/** Sleep for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse error response into ProblemDetail. */
async function parseError(response: Response, path: string): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail;
  } catch {
    return {
      type: "https://contypio.com/errors/unknown",
      title: response.statusText || "Unknown Error",
      status: response.status,
      detail: `HTTP ${response.status} from ${path}`,
    };
  }
}

/**
 * Low-level HTTP GET request to the Contypio Delivery API.
 * Retries on 429 with exponential backoff.
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
  const retry = resolveRetry(config);

  let lastResponse: Response | undefined;

  const maxAttempts = retry ? retry.maxRetries + 1 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      lastResponse = await fetchFn(url, { method: "GET", headers });
    } catch (err) {
      throw new ContypioNetworkError(
        `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    }

    if (lastResponse.status === 304) {
      return undefined as T;
    }

    // Retry on 429 Rate Limit
    if (lastResponse.status === 429 && retry && attempt < retry.maxRetries) {
      const retryAfter = lastResponse.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : retry.initialDelayMs * Math.pow(2, attempt);
      await sleep(delayMs);
      continue;
    }

    break;
  }

  if (!lastResponse!.ok) {
    throw new ContypioError(await parseError(lastResponse!, path));
  }

  return (await lastResponse!.json()) as T;
}

/**
 * Low-level HTTP POST request to the Contypio Delivery API.
 * Retries on 429 with exponential backoff.
 */
export async function postRequest<T>(
  config: ContypioConfig,
  path: string,
  body: unknown,
): Promise<T> {
  const url = joinUrl(config.baseUrl, path);
  const headers = buildHeaders(config, "POST");
  const fetchFn = config.fetch ?? fetch;
  const retry = resolveRetry(config);

  let lastResponse: Response | undefined;

  const maxAttempts = retry ? retry.maxRetries + 1 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      lastResponse = await fetchFn(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ContypioNetworkError(
        `Failed to POST ${url}: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    }

    if (lastResponse.status === 429 && retry && attempt < retry.maxRetries) {
      const retryAfter = lastResponse.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : retry.initialDelayMs * Math.pow(2, attempt);
      await sleep(delayMs);
      continue;
    }

    break;
  }

  if (!lastResponse!.ok) {
    throw new ContypioError(await parseError(lastResponse!, path));
  }

  return (await lastResponse!.json()) as T;
}
