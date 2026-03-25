# Invoices Page - Implementation

> **Route**: `/:orgSlug/invoices`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.invoices.list` | `convex/invoices.ts` | `{ organizationId, status? }` | Returns a bounded descending invoice list with joined client names |
| `api.clients.list` | `convex/clients.ts` | `{ organizationId }` | Hydrates the draft-dialog client picker |

---

## Mutations

| Mutation | Source | Args | Purpose |
|----------|--------|------|---------|
| `api.invoices.create` | `convex/invoices.ts` | `{ clientId?, issueDate, dueDate, lineItems }` | Creates a draft invoice and redirects into detail editing |

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `status` | `InvoiceStatusFilter` | route `useState` | Controls the status-scoped invoice query |
| `showCreateDialog` | `boolean` | route `useState` | Controls draft-dialog visibility |
| `__NIXELO_E2E_INVOICES_LOADING__` | `boolean` | `window` | Forces the loading shell during screenshot capture |
| `nixelo:e2e:invoices-state` | `"filtered-empty" \| "create-dialog"` | `sessionStorage` | Bootstraps deterministic screenshot-only route states |

---

## Component Tree

```
InvoicesListPage
├── PageLayout
│   ├── PageHeader
│   │   └── actions
│   │       ├── SelectTrigger[data-testid=invoices-status-filter]
│   │       └── Button("New draft")
│   │
│   ├── CreateDraftDialog
│   │   ├── optional client select
│   │   ├── issue / due date inputs
│   │   ├── description input
│   │   └── rate input
│   │
│   └── body
│       ├── InvoicesLoadingState[data-testid=invoices-loading-state]
│       ├── EmptyState[data-testid=invoices-empty-state]
│       ├── EmptyState[data-testid=invoices-filtered-empty-state]
│       └── InvoiceTable[data-testid=invoices-content]
│           └── Table[data-testid=invoices-table]
```

---

## E2E / Screenshot Support

| File | Responsibility |
|------|----------------|
| `convex/e2e.ts` | Resets the E2E org's invoice list to a deterministic seeded set |
| `e2e/pages/invoices.page.ts` | Route-specific readiness and invoice locators |
| `e2e/screenshot-lib/interactive-captures.ts` | Captures canonical, filtered-empty, create-dialog, and loading states |
| `e2e/screenshot-lib/routing.ts` | Routes invoice state captures into `25-invoices` with suffixes |

---

## Notes

- Invoice screenshot seeding intentionally owns the entire E2E org invoice list so route captures stay deterministic even if other tests created drafts earlier in the run.
- The route no longer relies on a generic `PageContent isLoading` placeholder; loading screenshots now reflect the actual table surface.
