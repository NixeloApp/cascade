# Invoices Page - Current State

> **Route**: `/:orgSlug/invoices`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-25

---

## Purpose

The invoices page gives organization members a compact billing workspace for:

- scanning invoice number, client, status, total, and due date in one table
- filtering the list by billing status
- creating a new draft invoice without jumping through a placeholder `$0` draft flow

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
│   │       ├── Select (status filter)
│   │       └── Button ("New draft")
│   │
│   ├── Dialog ("Create Draft Invoice")
│   │   ├── optional client picker
│   │   ├── issue date / due date fields
│   │   ├── first line-item description
│   │   └── rate input
│   │
│   └── body
│       ├── loading: table-shaped skeleton shell
│       ├── empty: EmptyState ("No invoices yet")
│       ├── filtered empty: EmptyState ("No {status} invoices")
│       └── populated: table
│           ├── Invoice
│           ├── Client
│           ├── Status
│           ├── Total
│           └── Due
```

---

## Current Composition Walkthrough

1. `InvoicesListPage` reads org context from `useOrganization()`, status filter from local state, and optional E2E screenshot boot state from session storage.
2. `api.invoices.list` returns a bounded, descending organization-scoped list with client names already joined server-side.
3. `api.clients.list` hydrates the draft dialog client picker when client records exist.
4. A route-owned loading shell keeps the table/header layout stable during async load and screenshot captures.
5. Empty-state copy/action is derived from a shared helper so the base empty state and filtered-empty state do not drift.
6. Draft creation validates dates client-side, creates the invoice through `api.invoices.create`, then navigates directly to the invoice detail route.

---

## Screenshot Matrix

Reviewed across all four configs:

- canonical route
- filtered empty (`overdue`)
- create draft dialog
- loading shell

Files now present in `screenshots/`:

- `desktop-dark.png`
- `desktop-dark-filtered-empty.png`
- `desktop-dark-create-draft-dialog.png`
- `desktop-dark-loading.png`
- `desktop-light.png`
- `desktop-light-filtered-empty.png`
- `desktop-light-create-draft-dialog.png`
- `desktop-light-loading.png`
- `tablet-light.png`
- `tablet-light-filtered-empty.png`
- `tablet-light-create-draft-dialog.png`
- `tablet-light-loading.png`
- `mobile-light.png`
- `mobile-light-filtered-empty.png`
- `mobile-light-create-draft-dialog.png`
- `mobile-light-loading.png`

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Due dates are formatted with `{ timeZone: "UTC" }`, which can disagree with the viewer's local billing expectations near midnight boundaries | correctness | LOW |
| 2 | The list is still single-record oriented: there are no bulk send / mark-paid / archive actions for larger billing sweeps | workflow | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/invoices/index.tsx` | Route UI, loading shell, empty-state helper, and draft dialog |
| `convex/invoices.ts` | Invoice list/create/update/send/markPaid logic |
| `convex/e2e.ts` | Deterministic screenshot invoice seeding |
| `e2e/pages/invoices.page.ts` | Invoice route page object |
| `e2e/screenshot-lib/interactive-captures.ts` | Canonical, filtered-empty, create-dialog, and loading captures |
