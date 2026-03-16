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
- [x] Slim board issue enrichment — `enrichIssuesForList` skips reporter/epic lookups. Board queries (`listByProjectSmart`, `listByTeamSmart`) use slim enrichment. Detail queries keep full `enrichIssues`. ~40% savings per board load.
- [x] Bandwidth optimization report (see below).

## Bandwidth Optimization Report

| Query | Before | After | Est. Savings |
|---|---|---|---|
| `workspaces.listForSidebar` | Full doc + N+1 team/project counts per workspace | `{ _id, slug, name }`, no counts | ~70% |
| `teams.listForSidebar` | Full doc + role checks + member/project counts | `{ _id, slug, name, workspaceId }` | ~70% |
| `documents.listForSidebar` | Full doc + creator enrichment + pagination | `{ _id, title }` | ~70% |
| `projects.getCurrentUserProjects` | `...project` (full doc incl. workflowStates array) | 10 explicit fields | ~50% |
| `sprints.listByProject` | `...sprint` (full doc) | 10 explicit fields | ~40% |
| `notifications.list` | `...notification` (full doc) | 11 explicit fields | ~35% |
| `dashboard.getMyProjects` | `...projectsFields` validator (full schema) | 7 display fields | ~50% |
| `calendarEvents` (6 queries) | `...event` (full doc) via shared enrichment | 17 explicit fields | ~25% |
| `issues.listByProjectSmart` | `enrichIssues` (reporter + epic + full doc) | `enrichIssuesForList` (assignee + labels only, 12 fields) | ~40% |

**Approach:** Replace `...doc` spreads with explicit field picks. Add `listForSidebar` variants for sidebar-only callers. Split issue enrichment into list (slim) vs detail (full) tiers.

**Type discipline:** All callers now use `FunctionReturnType<typeof api.*>` instead of `Doc<"table">` for query results. TypeScript catches any removed field at compile time.

**Convex dashboard metrics:** Not captured (requires manual dashboard access). The savings above are estimated from field counts and document structure analysis.

## Guardrails

- Avoid `.collect()` or large `.take()` values for counts.
- Prefer index-backed query paths before adding in-memory filtering.
- Keep sidebar and navigation queries especially small.
- Use `FunctionReturnType<typeof api.*>` for caller types — never `Doc<"table">` for query results.
