# Notifications Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### 1. Paginate archived notifications (MEDIUM)

`listArchived` currently loads all archived notifications at once. For users with months of
history this will degrade. Add `usePaginatedQuery` with load-more like the inbox tab.

### 2. Notification grouping / collapsing (LOW)

Multiple updates on the same issue (e.g., 5 status changes) create 5 separate rows.
Consider collapsing them: `"5 updates on PROJ-42"` with expand to see individual items.

### 3. Screenshot matrix completion (LOW)

Add captures for:
- Empty inbox state
- Empty archive state
- Bulk action loading state
- 99+ badge overflow

---

## Not Planned

- Notification search (category filters are sufficient for the current volume)
- Real-time sound alerts (belongs at app shell / push notification level)
- Notification preferences on this page (lives in Settings > Notifications)
- Cross-user notification admin (notifications are always per-user)

---

## Acceptance Criteria

- [ ] Archived tab uses `usePaginatedQuery` with load-more
- [ ] No regressions in date grouping or filter behavior
- [ ] Screenshot matrix includes all listed missing captures
