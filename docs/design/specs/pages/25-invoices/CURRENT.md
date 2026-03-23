# Invoices Page - Current State

> **Route**: `/:orgSlug/invoices`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-22

---

## Purpose

The invoices page provides agency-style invoice management for billing clients. It answers:

- What invoices exist in this organization and what are their statuses?
- Which invoices are draft, sent, paid, or overdue?
- How do I create a new draft invoice quickly?
- What is the total amount on each invoice?

---

## Route Anatomy

```
/:orgSlug/invoices
│
├── PageLayout
│   ├── PageHeader
│   │   ├── title = "Invoices"
│   │   ├── description = "Create, track, and deliver agency invoices."
│   │   └── actions
│   │       ├── Select (status filter: all | draft | sent | paid | overdue)
│   │       └── Button ("New draft")
│   │
│   ├── [empty state] EmptyState (when no invoices match filter)
│   │   ├── icon = FileText
│   │   ├── title = "No invoices yet" | "No {status} invoices"
│   │   └── action = "New draft" | "Clear filter"
│   │
│   └── [list state] Grid (1 col, 2 cols on lg)
│       └── Card[] (per invoice)
│           ├── CardHeader → CardTitle (invoice number)
│           └── CardContent
│               ├── Typography: Status
│               ├── Typography: Total (formatted currency)
│               ├── Typography: Due date
│               └── Link: "Open invoice" → /:orgSlug/invoices/:invoiceId
```

---

## Current Composition Walkthrough

1. **Route component**: `InvoicesListPage` calls `useOrganization()` for org context and manages a `status` filter via `useState`.
2. **Query**: `api.invoices.list` is called with `organizationId` and optional `status` filter. The result is typed as `Doc<"invoices">[]`.
3. **Create draft**: `handleCreateDraft` calls `api.invoices.create` with default values (issue date = now, due date = 1 week, one blank line item). Shows success/error toast.
4. **Loading gate**: While `invoices` is falsy, renders `<PageContent isLoading>`.
5. **Empty state**: When the filtered list is empty, an `EmptyState` is shown. The action button changes based on whether a filter is active ("New draft" vs "Clear filter").
6. **Invoice cards**: Each invoice renders as a `Card` with its number as the title, plus status, total (formatted with `$` prefix), due date, and a link to the detail page.
7. **Currency formatting**: A local `formatCurrency` helper formats amounts as `$X.XX`.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Invoice cards use `Card` > `CardHeader` > `CardContent` pattern which may feel heavy for a list view; a table or compact list might be more scannable | UX | MEDIUM |
| 2 | The `formatCurrency` helper is defined inline in the route file instead of in `@/lib/formatting` | architecture | LOW |
| 3 | No pagination -- all invoices are loaded at once via `.collect()` | scalability | MEDIUM |
| 4 | The "New draft" button creates an invoice with a `$0.00` line item immediately; no form or modal for initial setup | UX | MEDIUM |
| 5 | No client association visible on the invoice card -- user cannot see who the invoice is for | information density | MEDIUM |
| 6 | The link to invoice detail uses raw `className="text-brand underline text-sm"` instead of a styled component | styling | LOW |
| 7 | Due date uses `{ timeZone: "UTC" }` which may show a different date than the user's local timezone | correctness | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/invoices/index.tsx` | Route component (134 lines) |
| `convex/invoices.ts` | Invoice CRUD (list, create, update, delete, send, markPaid) |
| `src/lib/formatting.ts` | `formatDate` utility (used for due date) |
| `src/lib/time.ts` | `WEEK` constant (used for default due date offset) |
| `src/config/routes.ts` | `ROUTES.invoices.detail` for invoice detail link |
