# Agency MVP

> **Priority:** P2
> **Effort:** Large
> **Status:** Backend partial, UI not started

---

## Problem Statement

Agencies using Nixelo need to:
1. **Track billable hours** - Already have time tracking, need invoicing
2. **Share progress with clients** - Clients shouldn't need full Nixelo access
3. **Generate invoices** - Turn tracked hours into professional invoices

---

## Tasks

### 1. Invoicing System

**What:** Turn tracked hours into invoices that can be sent to clients.

**Current state:**
- Time tracking exists (`convex/timeTracking.ts`)
- Time entries have `userId`, `issueId`, `duration`, `date`
- No invoice generation

**Data model:**

```typescript
// convex/schema.ts

invoices: defineTable({
  organizationId: v.id("organizations"),
  clientId: v.optional(v.id("clients")),  // New table needed
  number: v.string(),  // INV-2024-001
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("paid"),
    v.literal("overdue"),
  ),
  issueDate: v.number(),
  dueDate: v.number(),
  lineItems: v.array(v.object({
    description: v.string(),
    quantity: v.number(),  // Hours
    rate: v.number(),  // Hourly rate
    amount: v.number(),  // quantity * rate
    timeEntryIds: v.optional(v.array(v.id("timeEntries"))),  // Link to time entries
  })),
  subtotal: v.number(),
  tax: v.optional(v.number()),
  total: v.number(),
  notes: v.optional(v.string()),
  pdfUrl: v.optional(v.string()),  // Generated PDF
})
.index("by_organization", ["organizationId"])
.index("by_status", ["organizationId", "status"]),

clients: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),
  email: v.string(),
  company: v.optional(v.string()),
  address: v.optional(v.string()),
  hourlyRate: v.optional(v.number()),  // Default rate for this client
})
.index("by_organization", ["organizationId"]),
```

**Implementation:**

#### Backend
- [ ] Add `clients` table to schema
- [ ] Add `invoices` table to schema
- [ ] Create `convex/clients.ts` with CRUD operations
- [ ] Create `convex/invoices.ts` with:
  - `create` - Create draft invoice
  - `generateFromTimeEntries` - Auto-populate from time tracking
  - `send` - Mark as sent, trigger email
  - `markPaid` - Update status
  - `generatePdf` - Create PDF (use react-pdf or similar)

#### Frontend
- [ ] Create `src/routes/$orgSlug/invoices/index.tsx` - Invoice list
- [ ] Create `src/routes/$orgSlug/invoices/$invoiceId.tsx` - Invoice detail/edit
- [ ] Create `src/routes/$orgSlug/clients/index.tsx` - Client list
- [ ] Create `src/components/InvoiceEditor.tsx` - Line item editor
- [ ] Create `src/components/InvoicePdfTemplate.tsx` - PDF template
- [ ] Add sidebar links for Invoices and Clients

---

### 2. Client Portal

**What:** A limited view where clients can see their project progress without needing Nixelo accounts.

**Access model:**
- Clients get a magic link (no password)
- Links are scoped to specific projects
- Read-only access to issues, timeline, documents
- Can add comments (optional)

**Data model:**

```typescript
// convex/schema.ts

clientPortalTokens: defineTable({
  clientId: v.id("clients"),
  token: v.string(),  // Unique token for URL
  projectIds: v.array(v.id("projects")),  // Which projects can they see
  permissions: v.object({
    viewIssues: v.boolean(),
    viewDocuments: v.boolean(),
    viewTimeline: v.boolean(),
    addComments: v.boolean(),
  }),
  expiresAt: v.optional(v.number()),  // Optional expiration
  lastAccessedAt: v.optional(v.number()),
})
.index("by_token", ["token"])
.index("by_client", ["clientId"]),
```

**Implementation:**

#### Backend
- [ ] Add `clientPortalTokens` table
- [ ] Create `convex/clientPortal.ts` with:
  - `generateToken` - Create access token for client
  - `validateToken` - Check token validity
  - `getProjectsForToken` - Get accessible projects
  - `getIssuesForToken` - Get issues client can see
  - `revokeToken` - Invalidate token

#### Frontend
- [ ] Create `src/routes/portal/$token.tsx` - Client portal entry
- [ ] Create `src/routes/portal/$token/projects/$projectId.tsx` - Project view
- [ ] Create `src/components/ClientPortal/` - Portal-specific components
  - `PortalHeader.tsx` - Minimal header without full nav
  - `PortalProjectView.tsx` - Read-only project view
  - `PortalTimeline.tsx` - Activity timeline
- [ ] Create token management UI in client settings

**Security considerations:**
- Tokens should be long, random strings (use `crypto.randomUUID()`)
- Rate limit token validation to prevent brute force
- Log all portal access for audit
- Allow token revocation at any time

---

## Acceptance Criteria

### Invoicing
- [ ] Can create, edit, send, and mark invoices as paid
- [ ] Can generate invoices from time entries
- [ ] PDF generation works
- [ ] Invoice list shows status and totals
- [ ] Client management CRUD works

### Client Portal
- [ ] Clients can access via magic link
- [ ] Portal shows only permitted projects
- [ ] Portal is read-only (or comment-only if enabled)
- [ ] Tokens can be revoked
- [ ] Access is logged

---

## Related Files

- `convex/timeTracking.ts` - Existing time tracking
- `src/routes/$orgSlug/time-tracking/` - Time tracking UI
- `convex/schema.ts` - Database schema
