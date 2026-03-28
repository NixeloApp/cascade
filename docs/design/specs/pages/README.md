# Page Specs

This directory contains the current-state, implementation, and target docs for route-level
product surfaces.

## Current-State Doc Contract

Use [`CURRENT_STATE_TEMPLATE.md`](./CURRENT_STATE_TEMPLATE.md) when adding or rewriting a page
spec. A complete current-state page doc should answer:

1. What user goal the surface serves.
2. Who can access it.
3. Which screenshots are canonical and which additional states are reviewed.
4. The primary happy path.
5. Alternate, destructive, and failure flows.
6. Empty, loading, and error behavior.
7. Which routes, components, backend functions, and tests define the feature.
8. What acceptance criteria a reviewer should use to confirm the current behavior.

## High-Value Coverage Audit

These are the surfaces that previously still required route-code reading or screenshot filename
archaeology to understand the current product behavior.

| Surface | Current-State Doc | Canonical Screenshot Source | Coverage Status |
|---------|-------------------|-----------------------------|-----------------|
| Settings workspace and integrations | [`12-settings/CURRENT.md`](./12-settings/CURRENT.md) | [`12-settings/screenshots/`](./12-settings/screenshots/) | Reviewed, now includes integration setup, connected, disconnect, and exceptional-state notes |
| Time tracking org dashboard | [`22-time-tracking/CURRENT.md`](./22-time-tracking/CURRENT.md) | [`22-time-tracking/screenshots/`](./22-time-tracking/screenshots/) | Reviewed, now links tab states, empty state, manual entry, and admin gate behavior |
| Roadmap / Gantt | [`35-roadmap/CURRENT.md`](./35-roadmap/CURRENT.md) | [`35-roadmap/screenshots/`](./35-roadmap/screenshots/) | Reviewed, now calls out permissions, alternate flows, and empty/loading/error handling explicitly |
| Project billing report | [`37-billing/CURRENT.md`](./37-billing/CURRENT.md) | [`37-billing/screenshots/`](./37-billing/screenshots/) | Expanded from a thin summary to a full current-state route spec |
| Public client portal | [`42-client-portal/CURRENT.md`](./42-client-portal/CURRENT.md) | [`42-client-portal/screenshots/`](./42-client-portal/screenshots/) | Newly documented; entry and project-detail routes are now part of the page-spec set |

## Related Specs

- [`26-clients/CURRENT.md`](./26-clients/CURRENT.md) covers portal token generation and revocation
  from the authenticated clients workspace.
- [`15-invite/CURRENT.md`](./15-invite/CURRENT.md) covers the other public magic-link flow in the
  product.
