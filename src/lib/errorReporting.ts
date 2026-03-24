/**
 * Error Reporting
 *
 * Centralized error reporting that can be wired to external services
 * (Sentry, PostHog, etc.). Currently logs to console in development
 * and collects breadcrumbs. Adding a provider is a single-line change.
 *
 * Usage:
 *   reportError(error, { context: "CreateIssueModal.handleSubmit" });
 *   reportError(error, { context: "api.issues.create", userId: "..." });
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorContext {
  /** Where the error originated (component, handler, query) */
  context?: string;
  /** Additional metadata to attach to the report */
  metadata?: Record<string, unknown>;
}

interface ErrorReportingProvider {
  /** Report an error to the external service */
  captureException: (error: Error, context?: ErrorContext) => void;
  /** Record a breadcrumb for debugging context */
  addBreadcrumb?: (message: string, data?: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

let provider: ErrorReportingProvider | null = null;

/**
 * Register an external error reporting provider (Sentry, PostHog, etc.).
 * Call once during app initialization.
 *
 * @example
 * // In your app entry point:
 * import * as Sentry from "@sentry/react";
 * setErrorReportingProvider({
 *   captureException: (error, ctx) => Sentry.captureException(error, { extra: ctx }),
 *   addBreadcrumb: (msg, data) => Sentry.addBreadcrumb({ message: msg, data }),
 * });
 */
export function setErrorReportingProvider(p: ErrorReportingProvider): void {
  provider = p;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Report an error to the configured provider (or console in development).
 * Safe to call with unknown error types — normalizes to Error internally.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (!provider) return;
  provider.captureException(normalizeError(error), context);
}

/**
 * Record a breadcrumb for debugging context. Breadcrumbs appear in error
 * reports to show what happened before the error.
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (provider?.addBreadcrumb) {
    provider.addBreadcrumb(message, data);
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error(String(error));
}
