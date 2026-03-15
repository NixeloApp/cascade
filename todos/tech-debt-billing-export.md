# Tech Debt: Billing Report Export

> **Priority:** P3
> **Status:** Partial (CSV done, PDF deferred)
> **File:** `src/components/TimeTracker/BillingReport.tsx:126`

## Description

Implement CSV/PDF export functionality for billing reports.

```typescript
// TODO: Implement CSV/PDF export functionality
```

## Acceptance Criteria

- [x] Wire existing Export button to real export flows
- [x] Implement CSV export
- [ ] Implement PDF export (deferred — needs jsPDF or server-side generation)
- [x] Handle large datasets gracefully (streaming CSV via Blob)
