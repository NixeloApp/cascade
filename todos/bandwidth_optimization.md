# Database Bandwidth Optimization

> **Priority:** P2
> **Status:** Active
> **Last Audited:** 2026-03-15

## Completed

- [x] **Sidebar queries** — added `listForSidebar` variants for workspaces, teams, documents. Eliminates N+1 count queries and returns only `{ _id, slug, name }`. ~70% bandwidth savings per sidebar load.
- [x] **Project list** — slimmed `getCurrentUserProjects` to return explicit fields instead of `...project`. Drops `workflowStates`, `updatedAt`, `workspaceId`, etc. ~50% savings.
- [x] **Sprint list** — slimmed `sprints.listByProject` to return only needed fields. Drops `createdBy`, `updatedAt`, `boardViewConfig`. ~40% savings.

## Remaining Work

- [x] Slim `notifications.list` — returns explicit fields only. ~35% savings.
- [x] Slim `calendarEvents.listByDateRange` — explicit field picks in shared enrichment function. ~25% savings (callers need more fields than initially estimated).
- [x] Slim `dashboard.getMyProjects` — returns `_id`, `name`, `key`, `description`, `role`, `totalIssues`, `myIssues` only. ~50% savings.
- [ ] Consider slim variant for `issues.listProjectIssues` — complex due to enrichment (assignee, reporter, labels). Would need to split enrichment into list vs detail tiers. ~40% savings but high implementation complexity.
- [ ] Publish before/after bandwidth report using Convex dashboard metrics.

## Guardrails

- Avoid `.collect()` or large `.take()` values for counts.
- Prefer index-backed query paths before adding in-memory filtering.
- Keep sidebar and navigation queries especially small.
- Use `FunctionReturnType<typeof api.*>` for caller types — never `Doc<"table">` for query results.
