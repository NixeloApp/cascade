# Clients Page - Target State

> **Route**: `/:orgSlug/clients`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Move client creation into a `Dialog` modal instead of an always-visible inline form | HIGH | The inline card takes significant viewport space and mixes creation with listing |
| 2 | Let user pick specific projects when generating a portal link instead of auto-selecting the first one | HIGH | Current behavior is arbitrary and may expose the wrong project to the client |
| 3 | Extract `ClientCard` and `PortalTokenDetails` into `src/components/Clients/` directory | MEDIUM | 310-line route file with inline components violates the codebase's component organization pattern |
| 4 | Replace `anyApi.clientPortal` calls with typed imports once the clientPortal module is in the generated API | MEDIUM | Type safety gap -- mutations are untyped and errors won't surface at compile time |
| 5 | Use reactive queries for portal tokens instead of imperative mutations stored in local state | MEDIUM | Tokens changed from another session or by another admin won't reflect until manual refresh |
| 6 | Add search/filter for the client list | LOW | Not critical with few clients, but needed as client count grows |
| 7 | Add pagination via `usePaginatedQuery` | LOW | Current `.collect()` will not scale beyond ~100 clients |
| 8 | Hide raw token IDs; show only status, dates, and actions | LOW | Token IDs are meaningless to users and clutter the UI |

---

## Not Planned

- **Client self-service portal on this page**: The client portal is a separate route (`/portal/:token`). This page only manages access tokens.
- **Bulk client import (CSV)**: Out of scope. Clients are created one at a time.
- **Client communication / messaging**: Messaging features are not part of the client management flow.
- **Invoice association on the client card**: Invoice data is shown on the invoices page; duplicating it here would require cross-query joins that add complexity.

---

## Acceptance Criteria

- [ ] "New Client" form is in a `Dialog` triggered by a "Add Client" button in `PageHeader` actions
- [ ] Portal link generation shows a project picker (multi-select) before creating the token
- [ ] `ClientCard` and `PortalTokenDetails` are extracted to `src/components/Clients/`
- [ ] Portal token list uses a reactive Convex query instead of imperative mutation + local state
- [ ] Raw token IDs are hidden; token rows show only status badge, dates, and revoke action
- [ ] Client creation requires admin role; non-admins see client list but no creation UI
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec clients`)
