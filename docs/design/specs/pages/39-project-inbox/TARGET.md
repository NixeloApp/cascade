# Project Inbox Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### 1. Search within inbox (MEDIUM)

No way to search inbox items by title or submitter. For projects with high intake
volume this requires visual scanning. Add a search input above the issue rows that
filters client-side by title, key, or submitter name.

### 2. Custom snooze duration (LOW)

Snooze is hardcoded to 1 day, 3 days, or 1 week. Add a "Custom" option with a date
picker for specific snooze-until dates.

### 3. Duplicate search picker (LOW)

"Mark as Duplicate" currently requires knowing the target issue key. Add a search
input that queries project issues by title/key and lets the user pick the duplicate target.

### 4. Screenshot matrix expansion (LOW)

Add captures for: empty tabs, bulk selection bar, snooze dropdown, closed tab content.

---

## Not Planned

- Auto-triage rules (accept if from known domain, etc.) — separate feature
- Email-to-inbox pipeline — requires email parsing infrastructure
- SLA indicators — requires tracking submission-to-triage time
- Public submission form — the API endpoint is sufficient

---

## Acceptance Criteria

- [ ] Search input filters inbox items by title/key/submitter
- [ ] Custom snooze date picker available alongside preset durations
- [ ] Duplicate picker searches project issues instead of requiring raw key
- [ ] Screenshot matrix includes all listed missing captures
