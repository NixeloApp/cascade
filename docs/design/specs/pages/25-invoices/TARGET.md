# Invoices Page - Target State

> **Route**: `/:orgSlug/invoices`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Replace card grid with a table/list view showing invoice number, client, status, total, due date, and actions in columns | HIGH | Card grid is not scannable for >10 invoices; tabular data needs a tabular layout |
| 2 | Add client name to invoice list items (currently missing entirely) | HIGH | Users cannot identify which client an invoice belongs to without opening it |
| 3 | Add pagination or virtualized scrolling for large invoice lists | MEDIUM | All invoices load at once via `.collect()`, which will not scale |
| 4 | Move `formatCurrency` to `@/lib/formatting.ts` alongside other format helpers | LOW | Inline utility in route file is inconsistent with codebase patterns |
| 5 | Replace "New draft" instant-create with a "Create Invoice" modal that lets user pick client and set initial details | MEDIUM | Creating a $0.00 draft with no client context requires immediate editing |
| 6 | Add status badges with color coding instead of plain text | LOW | "Status: draft" as text is less scannable than a colored badge |
| 7 | Add bulk actions (mark paid, send, delete) for selected invoices | LOW | Managing many invoices one-by-one is tedious |

---

## Not Planned

- **Payment processing / Stripe integration**: Invoicing is tracking-only; actual payment collection is out of scope.
- **PDF generation from this page**: PDF export lives on the invoice detail page, not the list.
- **Multi-currency support**: All invoices use USD formatting. Multi-currency is a separate feature track.
- **Recurring invoice scheduling**: Automatic recurring invoices are not part of the current invoice model.

---

## Acceptance Criteria

- [ ] Invoice list renders as a table with columns: Number, Client, Status, Total, Due Date, Actions
- [ ] Client name appears in the list (requires joining client data in the list query or enriching the response)
- [ ] Status column uses colored `Badge` components (e.g., green for paid, yellow for sent, gray for draft, red for overdue)
- [ ] Pagination controls appear when invoice count exceeds 20
- [ ] "New draft" opens a `Dialog` with client picker, issue date, and due date fields
- [ ] `formatCurrency` is moved to `@/lib/formatting.ts`
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec invoices`)
