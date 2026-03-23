# Org Analytics Page - Target State

> **Route**: `/:orgSlug/analytics`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Add date range picker (last 7d / 30d / 90d / custom) to scope metrics temporally | HIGH | All-time metrics are not actionable for week-over-week tracking |
| 2 | Add trend indicators on MetricCards (up/down arrow with percentage vs previous period) | MEDIUM | Static numbers lack context without trend comparison |
| 3 | Make project breakdown rows clickable, linking to project board | MEDIUM | Users need a fast path from analytics insight to project context |
| 4 | Add hover tooltips to BarChart bars showing exact count and percentage | LOW | Bar labels alone are hard to read for small values |
| 5 | Add workspace/team filter to scope analytics below org level | LOW | Currently only org-wide; workspace managers want their own view |

---

## Not Planned

- **Real-time streaming updates**: The analytics query already uses Convex reactive subscriptions. No polling or SSE needed.
- **Export to CSV/PDF**: Analytics export is a separate feature track and does not belong on this page.
- **Custom dashboard builder**: Drag-and-drop widget arrangement is out of scope. The fixed layout is intentional.
- **Individual contributor metrics**: Tracking per-person output is not aligned with the product's team-first philosophy.

---

## Acceptance Criteria

- [ ] Date range picker renders with preset options (7d, 30d, 90d) and a custom date range
- [ ] MetricCards show trend arrows (green up / red down) with percentage delta
- [ ] Project breakdown rows are clickable and navigate to `ROUTES.projects.board(slug, key)`
- [ ] BarChart bars show tooltip on hover with exact value and percentage of total
- [ ] Page remains performant with 100+ projects (no visible jank or loading delay)
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec org-analytics`)
