# AI Assistant Page - Target State

> **Route**: `/:slug/assistant`
> **Goal**: Fully functional AI assistant management with real data and persistent configuration

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Backend-powered stats | Replace hardcoded values with real usage metrics from Convex queries |
| 2 | Persistent configuration | System prompt, model, enabled state, and help-button flag stored in DB |
| 3 | Usage chart | Replace dashed placeholder with a real time-series chart (daily/weekly usage) |
| 4 | Billing integration | "Upgrade Plan" button wired to a checkout flow or billing portal |
| 5 | Role-based access | Admins can configure; editors/viewers get a read-only view |
| 6 | Model-specific pricing display | Show cost-per-token or rate information next to model select |
| 7 | Conversation history panel | Browse and review past assistant conversations |
| 8 | Knowledge source config | Select which documents/projects the assistant can reference |

---

## Not Planned

- Real-time chat interface on this page -- the assistant chat lives in a separate
  global panel/sidebar triggered from anywhere in the app.
- Multi-model concurrent routing -- only one model is active at a time per workspace.

---

## Acceptance Criteria

- [ ] Stats section reflects real usage data, updating reactively.
- [ ] Configuration changes (system prompt, model, toggles) persist via mutations.
- [ ] Disabling the assistant actually stops it from responding to user queries.
- [ ] Billing tab shows a real usage chart with date-range filtering.
- [ ] "Upgrade Plan" button opens a checkout flow or redirects to a billing portal.
- [ ] Non-admin users see stats but cannot modify configuration.
- [ ] Page loads with skeleton states while queries resolve (no flash of empty).
