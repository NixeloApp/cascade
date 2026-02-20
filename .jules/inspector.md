# Inspector's Journal

## 2024-05-22 - Initial Setup
**Learning:** Establishing the inspector journal for tracking critical learnings.
**Action:** Will record unique error handling patterns and critical insights here.

## 2024-05-22 - Webhook Timeouts
**Learning:** User-facing webhooks in `convex/webhooks.ts` lacked timeouts, posing a risk of hanging internal actions.
**Action:** Always wrap external `fetch` calls, especially those to user-provided URLs, with `AbortController` and a reasonable timeout.

## 2024-05-22 - Batch Processing Vulnerability
**Learning:** In Convex internal actions (like `trigger` in `convex/webhooks.ts`), iterating over a list of items and awaiting a processing function without individual try/catch blocks means a single failure aborts the entire batch. This is a critical silent failure mode for subsequent items.
**Action:** Always wrap individual item processing in batch loops with try/catch to ensure isolation.

## 2024-05-22 - Testing Internal Side Effects
**Learning:** Some internal mutations (like `createExecution`) are explicitly skipped in test mode (`isTestEnv`), making it impossible to verify DB side effects directly in tests.
**Action:** When testing internal mutations that have side effects disabled in tests, spy on the underlying logic or mock dependencies to verify execution flow instead of relying on DB state.

## 2024-05-22 - Silent Security Wrappers
**Learning:** Security wrappers like `securePasswordReset` (which return generic success to prevent enumeration) must still log internal errors server-side. Swallowing exceptions completely creates a black hole for debugging critical auth failures.
**Action:** Always include server-side logging (e.g., `logger.error`) in the catch block of security-sensitive endpoints that return generic client responses.

## 2026-02-20 - Crash in Error Handler
**Learning:** When handling errors for list processing (e.g., `importIssuesJSON`), accessing properties of the failed item (like `issue.title`) inside the `catch` block can cause a second crash if the item is `null` or invalid. This aborts the entire batch and hides the original error.
**Action:** Validate list items (e.g., `typeof item === 'object'`) before processing, and use safe access patterns (optional chaining) when extracting data for error reports.
