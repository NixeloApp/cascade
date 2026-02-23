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

## 2024-05-22 - ProseMirror Sync Silent Failure
**Learning:** The `onSnapshot` callback in `convex/prosemirror.ts` was silently swallowing `JSON.parse` errors, leading to data inconsistencies (missing versions, outdated timestamps) without client feedback.
**Action:** Ensure all callbacks in third-party integrations (like `prosemirror-sync`) have explicit error handling (logging and re-throwing as appropriate errors) to prevent silent failures.

## 2024-05-22 - Upstream Error Propagation
**Learning:** When integrating with third-party APIs (like Google Calendar), swallowing the upstream error body (e.g., `rateLimitExceeded`) and returning a generic "Failed to fetch" validation error prevents users from understanding actionable failures.
**Action:** Always capture the upstream `HttpError` body, attempt to parse it (e.g., as JSON), and include the specific upstream message in the `validation` error thrown to the client.

## 2024-05-22 - OAuth Data Validation
**Learning:** OAuth integrations often assume valid JSON and complete user profiles from providers. However, API changes or failures can result in invalid JSON or partial data (e.g. `undefined` user IDs), leading to silent data corruption or runtime crashes when processing the callback.
**Action:** Always validate the structure and required fields of OAuth user profiles and wrap JSON parsing in try/catch blocks before persisting or using the data.

## 2024-05-22 - Silent Request Property Loss
**Learning:** `safeFetch` (SSRF protection wrapper) silently ignored `method`, `body`, and `headers` when a `Request` object was passed as input, defaulting to `GET` without a body. This created a silent failure mode where API calls appeared successful but sent incorrect data.
**Action:** When wrapping `fetch` or creating utility functions that accept `Request | string`, always manually extract and merge `Request` properties (method, body, headers, signal) into the `init` options, as standard `fetch` behavior is not automatically preserved when rewriting the URL.
