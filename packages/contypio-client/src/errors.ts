import type { ProblemDetail, ValidationError } from "./types.js";

/**
 * Error thrown when the Contypio API returns a non-2xx response.
 * Follows the RFC 7807 Problem Details format.
 */
export class ContypioError extends Error {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly errors: ValidationError[];

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.name = "ContypioError";
    this.type = problem.type;
    this.title = problem.title;
    this.status = problem.status;
    this.detail = problem.detail;
    this.errors = problem.errors ?? [];
  }

  /** True if the resource was not found (404). */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True if rate limit was exceeded (429). */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True if the API key is invalid or lacks scope (401/403). */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/**
 * Error thrown when a network or fetch-level failure occurs
 * (timeout, DNS, connection refused, etc.).
 */
export class ContypioNetworkError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ContypioNetworkError";
    this.cause = cause;
  }
}
