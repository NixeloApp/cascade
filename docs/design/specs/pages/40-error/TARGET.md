# Error Page - Target State

> **Component**: `src/components/ErrorBoundary.tsx`
> **Goal**: Better recovery options, error reporting, and context-specific error UIs

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | External error reporting | Send errors to Sentry or PostHog for production observability |
| 2 | "Go back" navigation | Add a secondary button that calls `window.history.back()` or navigates to the dashboard |
| 3 | Component stack in details | Include `errorInfo.componentStack` in the collapsible details block |
| 4 | "Try again" without reload | Add a button that resets the boundary state (`hasError: false`) to re-attempt rendering |
| 5 | Network vs. render error distinction | Show different messaging for network/connectivity errors versus render crashes |
| 6 | Error boundary per route | Wrap each major route segment in its own boundary so a crash in one page does not blank the entire app shell |

---

## Not Planned

- Custom error pages per HTTP status code (404, 403) -- those are handled by
  TanStack Router's `notFoundComponent` and route-level `PageError`, not the boundary.
- Retry with exponential backoff -- the boundary catches render errors, not data-fetch errors.

---

## Acceptance Criteria

- [ ] Errors are reported to an external service in production (not just console.error).
- [ ] A "Go back" or "Go to dashboard" button is available alongside "Reload page".
- [ ] Collapsible details include both `error.message` and `errorInfo.componentStack`.
- [ ] "Try again" button re-mounts children without a full page reload.
- [ ] Error boundary wraps individual route segments so the app shell (sidebar, header) remains visible when a page crashes.
- [ ] The default error UI remains accessible: focus lands on the primary action button, all text is readable by screen readers.
