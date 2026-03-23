# Billing Page - Target State

> **Route**: `/:slug/projects/:key/billing`
> **Goal**: Comprehensive financial reporting with charts, comparison, and invoice generation

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Revenue/hours trend chart | Time-series visualization (bar or line) for revenue and hours over the selected period |
| 2 | Period-over-period comparison | Compare current period metrics to the previous equivalent period |
| 3 | Use shared PageHeader | Replace the inline h2 with the standard `PageHeader` component for consistency |
| 4 | Labeled date range | Add a visible label to the date-range select for better accessibility |
| 5 | Budget progress visualization | When project has a budget, show a prominent progress bar toward budget cap |
| 6 | Invoice generation link | Button to create/view invoices from billing data (ties into 25-invoices page) |
| 7 | Server-side CSV export | Move CSV generation server-side for large datasets and add PDF option |

---

## Not Planned

- Custom billing rates per project (this is managed on the time-tracking rates tab).
- Real-time billing updates while a timer is running -- billing recalculates on
  time entry save, not continuously.

---

## Acceptance Criteria

- [ ] At least one chart visualizes revenue or hours over time.
- [ ] Period comparison shows delta (e.g., "+15% vs. last month").
- [ ] Page uses `PageHeader` instead of an inline heading.
- [ ] Date-range select has a visible label (via `Label` component).
- [ ] Budget projects display a budget-used progress indicator.
- [ ] CSV export works for projects with 1,000+ time entries without browser freezing.
- [ ] Non-admin users see a clear "no access" message rather than a broken query error.
