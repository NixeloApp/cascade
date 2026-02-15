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
