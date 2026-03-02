# Agency MVP

> **Priority:** P2
> **Effort:** Large
> **Status:** Core MVP shipped, polish follow-ups pending

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
- [x] Add `clients` table to schema
- [x] Add `invoices` table to schema
- [x] Create `convex/clients.ts` with CRUD operations
- [x] Extend `convex/invoices.ts` beyond base CRUD with:
  - [x] `generateFromTimeEntries` - Auto-populate from time tracking
  - [x] `send` - Mark as sent, trigger email
  - [x] `markPaid` - Update status
  - [x] `generatePdf` - Create PDF (use react-pdf or similar)

#### Frontend
- [x] Create `src/routes/$orgSlug/invoices/index.tsx` - Invoice list
- [x] Create `src/routes/$orgSlug/invoices/$invoiceId.tsx` - Invoice detail/edit
- [x] Create `src/routes/$orgSlug/clients/index.tsx` - Client list
- [x] Create `src/components/InvoiceEditor.tsx` - Line item editor
- [x] Create `src/components/InvoicePdfTemplate.tsx` - PDF template
- [x] Add sidebar links for Invoices and Clients

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
- [x] Add `clientPortalTokens` table
- [ ] Create `convex/clientPortal.ts` with:
  - [x] `generateToken` - Create access token for client
  - [x] `validateToken` - Check token validity
  - [x] `getProjectsForToken` - Get accessible projects
  - [x] `getIssuesForToken` - Get issues client can see
  - [x] `revokeToken` - Invalidate token

#### Frontend
- [x] Create `src/routes/portal/$token.tsx` - Client portal entry
- [x] Create `src/routes/portal/$token/projects/$projectId.tsx` - Project view
- [x] Create `src/components/ClientPortal/` - Portal-specific components
  - [x] `PortalHeader.tsx` - Minimal header without full nav
  - [x] `PortalProjectView.tsx` - Read-only project view
  - [x] `PortalTimeline.tsx` - Activity timeline
- [x] Create token management UI in client management surface

**Security considerations:**
- Tokens should be long, random strings (use `crypto.randomUUID()`)
- Rate limit token validation to prevent brute force
- Log all portal access for audit
- Allow token revocation at any time

---

## Acceptance Criteria

### Invoicing
- [x] Can create, edit, send, and mark invoices as paid
- [x] Can generate invoices from time entries
- [x] PDF generation works
- [x] Invoice list shows status and totals
- [x] Client management CRUD works

### Client Portal
- [x] Clients can access via magic link
- [x] Portal shows only permitted projects
- [x] Portal is read-only (or comment-only if enabled)
- [x] Tokens can be revoked
- [x] Access is logged

---

## Related Files

- `convex/timeTracking.ts` - Existing time tracking
- `src/routes/$orgSlug/time-tracking/` - Time tracking UI
- `convex/schema.ts` - Database schema

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S2-S5`  
**Effort:** Large

### Milestones

- [x] `S1` Schema + backend foundation (`clients`, `invoices`, base CRUD)
- [x] `S2` Invoice generation flow (from time entries + PDF + status lifecycle)
- [x] `S3` In-app invoice/client UI (list/detail/editor routes)
- [x] `S4` Client portal token model + read-only portal views + revocation

### Dependencies

- `convex/schema.ts` migrations
- Email provider path for invoice send events
- Auth/permission checks for client-token access

### Definition of Done

- Agencies can create clients, generate invoices from tracked time, and mark payment status.
- Client magic-link portal works with scoped permissions and auditability.

---

## Progress Log

### 2026-03-02 (Priority 11, batch A)

- **Completed:** Implemented `S1` backend foundation for agency billing. Added `clients` and `invoices` schema tables (plus purge coverage), shipped `convex/clients.ts` and `convex/invoices.ts` with base CRUD, totals calculation, invoice number generation (`INV-YYYY-###`), org-scope enforcement, and regression tests in `convex/clients.test.ts` + `convex/invoices.test.ts`.
- **Validation:** `pnpm run typecheck` (pass), `pnpm test convex/clients.test.ts convex/invoices.test.ts` (pass, 7/7 tests).
- **Decisions:** Kept S1 scoped to schema + base CRUD only; advanced lifecycle features (`generateFromTimeEntries`, send/paid workflow, PDF output) intentionally deferred to `S2`.
- **Blockers:** Convex codegen is currently network-blocked in this environment (`fetch failed`), so tests use `anyApi` function references instead of newly generated typed `api` entries.
- **Next Step:** Start `S2` by implementing `generateFromTimeEntries` and invoice status transitions (`send`, `markPaid`) with tests, then add PDF generation path.

### 2026-03-02 (Priority 11, batch B)

- **Completed:** Implemented invoice lifecycle functions in `convex/invoices.ts`: `generateFromTimeEntries` (builds draft invoices from unbilled billable entries and links time entries as billed), `send`, and `markPaid` state transitions with guardrails.
- **Validation:** `pnpm run typecheck` (pass), `pnpm test convex/clients.test.ts convex/invoices.test.ts` (pass, 8/8 tests), including lifecycle regression covering draft->sent->paid flow and time-entry linking.
- **Decisions:** Time-entry invoice generation is currently project/org-scoped only (entries without project linkage are excluded), to keep org-boundary checks deterministic.
- **Blockers:** `generatePdf` remains open pending concrete PDF rendering/storage approach (`react-pdf` template + file upload/storage path) and outbound send-channel decision.
- **Next Step:** Finish remaining `S2` PDF path (`generatePdf`) and wire `send` to email delivery event once provider/template contract is selected.

### 2026-03-02 (Priority 11, batch C)

- **Completed:** Closed remaining `S2` scope in `convex/invoices.ts`: added authenticated `generatePdf` action that renders invoice content into a stored PDF blob and persists `pdfUrl`; added send-channel wiring in `send` mutation to queue `internal.email.index.sendEmailAction` with invoice summary (subject/html/text) once status transitions to `sent`.
- **Validation:** `pnpm run typecheck` (pass), `pnpm test convex/clients.test.ts convex/invoices.test.ts` (pass, 9/9 tests), including new PDF generation/access-control coverage.
- **Decisions:** Implemented deterministic server-side minimal PDF generation (no new dependency install) due current network/codegen instability; retained explicit org-admin authorization for PDF generation and client-email requirement before sending.
- **Blockers:** PDF output is currently a functional minimal template (summary-focused). Branded layout/theme templating is deferred to UI phase (`S3`) and PDF design pass.
- **Next Step:** Move to `S3` invoice/client UI routes and editor components while keeping current backend contracts stable.

### 2026-03-02 (Priority 11, batch D)

- **Completed:** Shipped `S3` invoice/client UI foundation. Added new routes `src/routes/_auth/_app/$orgSlug/invoices/index.tsx`, `src/routes/_auth/_app/$orgSlug/invoices/$invoiceId.tsx`, and `src/routes/_auth/_app/$orgSlug/clients/index.tsx`; added reusable UI components `src/components/Invoices/InvoiceEditor.tsx` and `src/components/Invoices/InvoicePdfTemplate.tsx`; added sidebar navigation for Invoices/Clients in `src/components/App/AppSidebar.tsx`; and added route constants in `convex/shared/routes.ts`.
- **Validation:** `pnpm run generate:routes` (pass), `pnpm run typecheck` (pass), `pnpm test src/config/routes.test.ts src/components/App/AppSidebar.test.ts` (pass, 48 tests).
- **Decisions:** Kept S3 scope focused on management/list/detail/edit flows with existing backend contracts and minimal UI complexity; no new frontend state-management layer introduced.
- **Blockers:** S4 client-portal token model and portal routes are still unimplemented; UI polish and branded invoice PDF templates can be iterated after portal baseline.
- **Next Step:** Start `S4` by adding `clientPortalTokens` schema + `convex/clientPortal.ts` token lifecycle (generate/validate/revoke) with tests.

### 2026-03-02 (Priority 11, batch E)

- **Completed:** Implemented S4 backend/token foundation and initial public portal scaffolding. Added `clientPortalTokens` table in `convex/schema.ts` plus purge coverage and a new `convex/clientPortal.ts` module (`generateToken`, `validateToken`, `getProjectsForToken`, `getIssuesForToken`, `revokeToken`, `listTokensByClient`) with org/client/project scoping, revocation/expiry handling, and token-access timestamp updates. Added `convex/clientPortal.test.ts` regression coverage (admin lifecycle, member rejection, scoped issue visibility). Added initial portal routes `src/routes/portal.$token.tsx` and `src/routes/portal.$token.projects.$projectId.tsx` and portal UI components in `src/components/ClientPortal/`.
- **Validation:** `pnpm run generate:routes` (pass), `pnpm run typecheck` (pass), `pnpm test convex/clientPortal.test.ts` (pass, 3/3), `pnpm test src/config/routes.test.ts` (pass, 40/40).
- **Decisions:** Used a public mutation for `validateToken` so `lastAccessedAt` can be updated atomically during validation; rate limiting for token validation is enabled outside test env.
- **Blockers:** Client settings token-management UI is still pending, and current portal routes use placeholder content until frontend wiring to `clientPortal` APIs is completed.
- **Next Step:** Finish remaining S4 frontend work: wire token validation + scoped project/issues rendering in portal routes and add token-management controls under client settings.

### 2026-03-02 (Priority 11, batch F)

- **Completed:** Finished remaining S4 frontend integration. Portal entry/project routes now use live client-portal APIs (token validation, scoped project listing, scoped issue listing), and client-management UI now supports portal-link generation, token listing, and token revocation controls. Added route scaffolding/components and kept revocation workflow tied to admin client management.
- **Validation:** `pnpm run generate:routes` (pass), `pnpm run typecheck` (pass), `pnpm test convex/clientPortal.test.ts src/config/routes.test.ts` (pass, 43 tests).
- **Decisions:** Implemented token management in the client-management surface instead of nested settings sub-tab to keep portal controls close to client records and avoid duplicative navigation.
- **Blockers:** None for core Agency MVP scope; remaining work is polish (branded PDF templates, deeper client-portal presentation, optional comment controls).
- **Next Step:** Mark Priority 11 complete and continue strict order with Priority 12 (`rich-text-description-followup.md`).
