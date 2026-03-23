# Add-ons Page - Target State

> **Route**: `/:slug/add-ons`
> **Goal**: Marketplace for browsing and installing workspace extensions

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Grid of available add-on cards | Each card: icon, name, description, install/configure button |
| 2 | Category filtering and search | Sidebar or tab-based categories (Integrations, Automations, Reporting) |
| 3 | Installed vs. available states | Toggle or tab to see what is active in the workspace |
| 4 | Add-on detail sheet/modal | Expanded view with screenshots, permissions, configuration options |
| 5 | Admin-only install control | Only workspace admins should be able to install/remove add-ons |

---

## Not Planned

- Custom add-on development SDK -- out of scope for the initial marketplace.
- Per-user add-on preferences -- add-ons apply workspace-wide.

---

## Acceptance Criteria

- [ ] Page displays a searchable/filterable grid of add-on cards.
- [ ] Installed add-ons show a distinct visual state and "Configure" action.
- [ ] Non-admin users can browse but cannot install or remove add-ons.
- [ ] EmptyState is shown when no add-ons match the active search/filter.
- [ ] Page loads without layout shift (skeleton states while data fetches).
