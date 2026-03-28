# Plane Features To Evaluate

> **Priority:** P3
> **Status:** Complete
> **Last Updated:** 2026-03-28

## Shipped

- [x] Added one shared issue-event routing path in `convex/issues/externalNotifications.ts` so issue create/update/comment flows no longer know about channel-specific delivery details.
- [x] Wired issue mutation scheduling through that shared router in `convex/issues/mutations.ts` instead of a Slack-only precheck.
- [x] Kept Slack delivery project-scoped via shared project recipient resolution in `convex/lib/projectNotificationDestinations.ts`.
- [x] Fixed Pumble issue delivery so scheduled backend work no longer depends on authenticated frontend-only queries/actions.
- [x] Routed generic project webhooks through the same issue-event flow instead of leaving them disconnected from issue mutations.
- [x] Added regression coverage in `convex/issues/externalNotifications.test.ts` and updated `convex/pumble.test.ts` to lock in the scheduler-safe Pumble path.
