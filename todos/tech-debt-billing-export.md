# Tech Debt: Billing Report Export

> **Priority:** P3
> **Status:** Partial
> **File:** `src/components/TimeTracker/BillingReport.tsx`

Only the unfinished delta remains here.

## Remaining Work

- [ ] **Implement PDF export** — CSV export is shipped, but PDF export still needs either a `jsPDF` path or server-side generation.

## Already Done

- [x] Wire existing Export button to real export flows
- [x] Implement CSV export
- [x] Handle large datasets gracefully via Blob-based CSV generation
