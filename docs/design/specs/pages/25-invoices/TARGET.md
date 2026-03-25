# Invoices Page - Target State

> **Route**: `/:orgSlug/invoices`

---

## Remaining Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Resolve due-date timezone semantics instead of forcing UTC formatting everywhere | LOW | Billing dates should read the same way the product intends, especially near day boundaries |
| 2 | Add bulk invoice actions once billing volume justifies them | LOW | Status-by-status single-record management will get tedious on larger orgs |
| 3 | Add richer client/accounting pivots only if list density grows past the current status filter | LOW | Search, client filter, and aging views are useful, but they are not necessary for the current bounded invoice surface |

---

## Not Planned

- Stripe or payment collection flows from this list view
- recurring invoice scheduling from the invoices index
- multi-currency handling on this route
- PDF generation from the list page itself

---

## Acceptance Criteria

- [x] Invoice list is reviewable as a table with invoice, client, status, total, and due columns
- [x] Draft creation opens a real dialog instead of creating a placeholder invoice immediately
- [x] Loading, filtered-empty, and dialog states are captured across the reviewed viewport matrix
- [x] Screenshot seeding keeps the route deterministic across repeated runs
- [ ] Date formatting semantics are explicitly resolved if UTC stops matching product expectations
