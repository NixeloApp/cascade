# Invoices Page - Implementation

> **Route**: `/:orgSlug/invoices`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.invoices.list` | `convex/invoices.ts` | `{ organizationId, status? }` | Fetch invoices with optional status filter |

### Query Return Shape

```typescript
Doc<"invoices">[] // Array of invoice documents with: _id, number, status, total, dueDate, issueDate, lineItems, clientId, etc.
```

---

## Mutations

| Mutation | Source | Args | Purpose |
|----------|--------|------|---------|
| `api.invoices.create` | `convex/invoices.ts` | `{ organizationId, issueDate, dueDate, lineItems }` | Create a new draft invoice with default line items |

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `status` | `"all" \| "draft" \| "sent" \| "paid" \| "overdue"` | Route `useState` | Filter invoices by status |

---

## Component Tree

```
InvoicesListPage (route)
├── PageLayout
│   ├── PageHeader
│   │   ├── title: "Invoices"
│   │   ├── description: "Create, track, and deliver agency invoices."
│   │   └── actions
│   │       ├── Select (status filter)
│   │       │   ├── SelectTrigger (aria-label: "Invoice status filter")
│   │       │   └── SelectContent
│   │       │       └── SelectItem[] (all, draft, sent, paid, overdue)
│   │       └── Button ("New draft", onClick: handleCreateDraft)
│   │
│   ├── [branch: empty]
│   │   └── EmptyState
│   │       ├── icon: FileText
│   │       ├── title: dynamic
│   │       └── action: "New draft" or "Clear filter"
│   │
│   └── [branch: populated]
│       └── Grid (cols=1, lg:cols=2)
│           └── Card[] (per invoice)
│               ├── CardHeader → CardTitle (invoice.number)
│               └── CardContent
│                   ├── Typography (status)
│                   ├── Typography (total)
│                   ├── Typography (due date)
│                   └── Link (to invoice detail)
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `invoices.list` is an `organizationQuery` that validates membership.
- **Create invoice**: Uses `useAuthenticatedMutation` which requires org membership. The backend `invoices.create` may require admin role (uses `organizationAdminMutation` wrapper).
- **Role-based visibility**: All org members can view invoices. Only admins can create/modify.

---

## Data Flow

1. Route mounts, queries `invoices.list` with `organizationId` and current `status` filter.
2. User changes status filter -> local state updates -> query re-fires with new `status` arg.
3. User clicks "New draft" -> `handleCreateDraft` calls `invoices.create` with default values -> toast feedback -> list reactively updates via Convex subscription.
4. User clicks "Open invoice" link -> navigates to `ROUTES.invoices.detail` with `invoiceId` param.
