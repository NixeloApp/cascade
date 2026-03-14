# Uptime Monitoring And Status Pages

> **Priority:** P3
> **Status:** Blocked
> **Last Reviewed:** 2026-03-12
> **Blocker:** Architecture and infrastructure decisions are still required before implementation should resume.

## Remaining MVP Work

- [ ] Decide the check runner model (`Convex action` vs external worker).
- [ ] Decide the routing and domain strategy for public status pages.
- [ ] Define the baseline alerting policy and escalation defaults.
- [ ] Implement monitor CRUD and check execution architecture.
- [ ] Persist check results and integrate alert delivery.
- [ ] Link incidents to issues and ship status page v1.
- [ ] Add dashboard analytics for uptime, response trends, and downtime history.

## Definition of Done

- A monitor failure triggers an incident and is reflected on a public status page with historical data.
