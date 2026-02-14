# Inspector's Journal

## 2024-05-22 - Initial Setup
**Learning:** Establishing the inspector journal for tracking critical learnings.
**Action:** Will record unique error handling patterns and critical insights here.

## 2024-05-22 - Webhook Timeouts
**Learning:** User-facing webhooks in `convex/webhooks.ts` lacked timeouts, posing a risk of hanging internal actions.
**Action:** Always wrap external `fetch` calls, especially those to user-provided URLs, with `AbortController` and a reasonable timeout.
