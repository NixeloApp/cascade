# Invoice System Issues

Critical issues with invoice generation, editing, and deletion that can cause data integrity problems.

## P1 - Clear linked time entries when deleting an invoice

**File:** `convex/invoices.ts:674`

Deleting an invoice doesn't unlink billed time entries, leaving `billed`/`invoiceId` references to a non-existent invoice. Those hours become permanently excluded from future invoicing.

**Fix:** When deleting, iterate `lineItems[].timeEntryIds` and clear `billed`/`invoiceId` on each entry.

## P1 - Derive next invoice number from max existing sequence

**File:** `convex/invoices.ts`

Using `invoices.length + 1` collides after deleting any non-latest invoice (e.g., `...001` and `...003` still produce `...003`). Since `create` rejects collisions, invoice creation can become blocked.

**Fix:** Use `Math.max(...existingSequences) + 1` or a dedicated counter instead of row count.

## P1 - Scope time-entry fetch before applying bounded limit

**File:** `convex/invoices.ts`

`getUnbilledBillableEntries` loads at most `BOUNDED_LIST_LIMIT` rows from global `by_date` index then filters by project/org, silently missing billable entries when the date window contains many rows from other organizations.

**Fix:** Use org/project-scoped index before applying limit.

## P1 - Enforce invoice-number uniqueness before auto-generating

**File:** `convex/invoices.ts:461`

`generateFromTimeEntries` computes `number` and inserts without checking `by_number` first. Unlike `create`, it can create duplicate invoice numbers after deleted invoices or concurrent requests.

**Fix:** Check uniqueness before insert, like `create` does.

## P1 - Keep timeEntryIds when editing generated invoice lines

**File:** `src/routes/_auth/_app/$orgSlug/invoices/$invoiceId.tsx:133`

The invoice editor strips `timeEntryIds` when mapping line items, severing linkage to billed time entries. After save, cleanup logic can no longer find those entries, leaving hours stuck as billed.

**Fix:** Preserve `timeEntryIds` when mapping existing line items.

## Priority

P1 - These cause data integrity issues and can block invoicing workflows.

## Notes

- formatCurrency in invoicesActions.ts does NOT divide by 100 (comment claiming it does is incorrect)
