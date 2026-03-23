# Time Tracking Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### 1. Show burn rate for "All Projects" (MEDIUM)

When "All Projects" is selected, the burn rate and rates tabs disappear. Users don't
realize they need to pick a project. Either aggregate burn rate across projects or
show a prompt explaining the project requirement.

### 2. CSV export from entries tab (MEDIUM)

CSV export exists at the billing report level but not directly on this page. Add an
export button to the entries tab that downloads filtered entries as CSV.

### 3. Screenshot matrix expansion (LOW)

Add captures for: burn rate tab, user rates tab, empty state, project filter applied,
date range changed, truncation indicators, edit modal.

---

## Not Planned

- Non-admin access (time tracking data is admin-only by design)
- Timesheet approval workflow (would be a separate feature)
- Integration with external time tracking tools (Toggl, Clockify)
- PDF export (CSV is sufficient; PDF is tracked separately in tech-debt)

---

## Acceptance Criteria

- [ ] Burn rate tab shows aggregate data when "All Projects" selected, or prompts to select
- [ ] CSV export button on entries tab downloads filtered entries
- [ ] Screenshot matrix includes all listed missing captures
