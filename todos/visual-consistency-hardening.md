# Visual Consistency Hardening

> **Priority:** P2
> **Status:** Open
> **Last Updated:** 2026-03-27

## Remaining

### Screenshot-driven cleanup (process discipline)

- [ ] Treat screenshot approval as real design review: inspect actual before/after images, don't just rely on green diff checks.
- [ ] Review approved screenshots page by page and turn broken/weird states into explicit todos.
- [ ] Fix screenshot-exposed broken states before approving new baselines.

### Screenshot coverage depth

- [ ] 12 specs still have only canonical screenshots (4 files each): landing, backlog, verify-email, unsubscribe, clients, authentication, add-ons, mcp-server, activity, billing, timesheet, error. Expand where interaction states matter.
- [ ] Backfill empty-state screenshots for routes with strong filled coverage but no empty captures (dashboard, editor, calendar, settings, workspace-detail, team-detail, outreach).
- [ ] Error-state screenshots are absent across all specs.
- [ ] Loading-state screenshots exist in ~9 of ~30 expanded specs.

### Human-review blind spots (not automatable)

- [ ] Motion / animation consistency review pass
- [ ] Density and hierarchy consistency inside large surfaces
- [ ] "Looks polished but not like our product" review pass
- [ ] CURRENT.md files track only a subset of actual screenshots in many specs — sync them

## Exit Criteria

- [ ] Screenshot review has no obvious uncaptured consistency holes for important surfaces.
- [ ] Human-review blind spots are either covered by guardrails or tracked as explicit debt.
