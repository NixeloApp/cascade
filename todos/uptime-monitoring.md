# Uptime Monitoring & Status Pages

> **Priority:** P3 (Future Feature)
> **Effort:** Medium (~1-2 weeks)
> **Value:** High differentiator - competitors charge $29+/mo for status pages
> **Status:** Blocked (architecture + infra prerequisites)

## Overview

Add built-in uptime monitoring and public status pages to Nixelo, making it a true all-in-one platform for teams.

**Pitch:** "Why pay for Jira + Confluence + Statuspage when Nixelo does all three?"

## Features

### 1. Monitors
- [ ] HTTP(S) endpoint monitoring
- [ ] Configurable check intervals (1min, 5min, 15min)
- [ ] Expected status codes (200, 2xx, etc.)
- [ ] Timeout thresholds
- [ ] Response time tracking
- [ ] SSL certificate expiry monitoring

### 2. Alerting
- [ ] Integrate with existing notification system (Pumble, Slack, email)
- [ ] Alert on: down, degraded, recovered, SSL expiring
- [ ] Configurable alert thresholds (e.g., 2 failures before alert)
- [ ] Alert escalation (email first, then Pumble after 5min)

### 3. Incident Management
- [ ] Auto-create issue in project when monitor goes down
- [ ] Link incident to affected services
- [ ] Track MTTR (mean time to recovery)
- [ ] Incident timeline with status updates

### 4. Public Status Page
- [ ] Customizable public URL (e.g., status.company.com)
- [ ] Show current status of all monitors
- [ ] Historical uptime (30/90 day %)
- [ ] Incident history with updates
- [ ] Subscribe to updates (email)
- [ ] Embed widget for external sites

### 5. Dashboard
- [ ] Uptime overview in project dashboard
- [ ] Response time graphs
- [ ] Downtime calendar view
- [ ] SLA tracking (99.9% uptime goal)

## Technical Implementation

### Backend (Convex)

```typescript
// Schema additions
monitors: defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  url: v.string(),
  method: v.union(v.literal("GET"), v.literal("HEAD"), v.literal("POST")),
  intervalMinutes: v.number(),
  expectedStatus: v.number(),
  timeoutMs: v.number(),
  status: v.union(v.literal("up"), v.literal("down"), v.literal("degraded")),
  lastCheckedAt: v.optional(v.number()),
  lastResponseTimeMs: v.optional(v.number()),
}),

monitorChecks: defineTable({
  monitorId: v.id("monitors"),
  status: v.union(v.literal("up"), v.literal("down"), v.literal("timeout")),
  responseTimeMs: v.optional(v.number()),
  statusCode: v.optional(v.number()),
  error: v.optional(v.string()),
  checkedAt: v.number(),
}),

incidents: defineTable({
  projectId: v.id("projects"),
  monitorId: v.id("monitors"),
  issueId: v.optional(v.id("issues")),
  status: v.union(v.literal("investigating"), v.literal("identified"), v.literal("monitoring"), v.literal("resolved")),
  startedAt: v.number(),
  resolvedAt: v.optional(v.number()),
}),
```

### Cron Jobs

```typescript
// convex/crons.ts
crons.interval("check-monitors", { minutes: 1 }, internal.monitors.checkAll);
```

### External Checks

Option A: Convex HTTP action (limited by Convex execution time)
Option B: External worker (Cloudflare Worker, Vercel Edge) that calls Convex

## UI Mockups

### Monitor List
```
┌─────────────────────────────────────────────────────┐
│ Monitors                              [+ Add Monitor]│
├─────────────────────────────────────────────────────┤
│ ● API (api.example.com)           UP    45ms   99.9%│
│ ● Web (www.example.com)           UP    120ms  99.8%│
│ ○ CDN (cdn.example.com)           DOWN  -      98.2%│
└─────────────────────────────────────────────────────┘
```

### Public Status Page
```
┌─────────────────────────────────────────────────────┐
│                    Company Status                    │
│              All Systems Operational ✓               │
├─────────────────────────────────────────────────────┤
│ API              ████████████████████████████ 100%  │
│ Website          ████████████████████████████ 99.9% │
│ CDN              ████████████████████████░░░░ 98.2% │
├─────────────────────────────────────────────────────┤
│ Past Incidents                                       │
│ Feb 5 - CDN Outage (resolved in 23min)              │
└─────────────────────────────────────────────────────┘
```

## Competitive Analysis

| Feature | Nixelo | UptimeRobot | Better Uptime | Statuspage |
|---------|--------|-------------|---------------|------------|
| Price | Included | Free/$7/mo | $20/mo | $29/mo |
| Monitors | ✅ | ✅ | ✅ | ❌ |
| Status Page | ✅ | ✅ | ✅ | ✅ |
| Incident → Issue | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| Project mgmt | ✅ | ❌ | ❌ | ❌ |

## Out of Scope (v1)

- [ ] Multi-region checks
- [ ] Synthetic monitoring (browser tests)
- [ ] API monitoring (GraphQL, gRPC)
- [ ] Custom check scripts

## Related

- Existing notification system: `convex/notifications.ts`
- Issue creation: `convex/issues.ts`
- Project settings: `src/components/settings/`

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S9+` (future feature)  
**Effort:** Large

### MVP Boundary

- Include: monitor CRUD, periodic checks, incident creation, basic public status page
- Exclude: multi-region checks, synthetic browser tests, advanced escalation rules

### Milestones

- [ ] `S4` Schema + monitor CRUD + check execution architecture decision
- [ ] `S5` Cron/worker checks + persisted results + alert pipeline integration
- [ ] `S6` Incident linkage with issues + status page v1
- [ ] `S7` Dashboard analytics (uptime %, response trends, downtime calendar)

### Dependencies

- Decide check runner model (`Convex action` vs external worker)
- Domain/public routing strategy for status pages

### Definition of Done

- A monitor failure can trigger an incident and reflect on a public status page with historical data.

---

## Progress Log

### 2026-03-02 (Batch A)

**Progress**

- Audited repository state for uptime/status-page implementation:
  - No monitor/status-page schema or runtime check pipeline is currently implemented.
  - Existing OAuth health monitoring is separate and not reusable as a full generic uptime feature without architecture work.
- Reconciled this todo with strict-priority execution and added explicit block status.

**Decisions**

- Marked this track as `Blocked (architecture + infra prerequisites)` instead of starting partial implementation without a runner/routing decision.
- Recommended default architecture direction for unblock:
  - Check execution via external worker calling Convex APIs (avoids Convex action execution ceilings for large monitor fleets).
  - Public status page hosted under explicit route/domain strategy before implementing data model.

**Blockers**

- Runner-model decision (`Convex action` vs external worker) and associated operational ownership.
- Public status-page routing/domain strategy (custom domains vs subpath/subdomain).
- Alerting policy baseline (notification channels, threshold/escalation defaults) to avoid churn in monitor/incident schema.

**Next step**

- When prerequisites are provided, start `S4` by implementing schema + monitor CRUD with runner contract chosen up front.

### 2026-03-02 (Batch B)

**Progress**

- Reconfirmed Priority `19` remains blocked with no additional repository-side actions possible before architecture decisions are supplied.

**Decisions**

- Kept this lane blocked and avoided partial schema/route scaffolding that could be invalidated by runner/routing direction changes.

**Blockers**

- Unchanged: runner model, public routing/domain strategy, and alert policy baseline decisions.

**Next step**

- Start `S4` immediately once prerequisites are provided; until then continue next strict-order cycle from Priority `01`.

### 2026-03-02 (Batch C)

**Progress**

- Revalidated this track in strict-order flow: no monitor/status-page feature implementation has been added since prior audit, and blocker assumptions remain intact.

**Validation**

- `pnpm run typecheck` (pass)
- repository scan for uptime/status-page implementation confirms only TODO/research/runbook references and existing OAuth-monitoring paths, not a generic monitor/status-page product implementation.

**Decisions**

- Keep Priority `19` blocked and avoid partial schema/runtime scaffolding before architecture and ownership prerequisites are finalized.

**Blockers**

- Unchanged:
  - check runner model decision (`Convex action` vs external worker),
  - public status-page routing/domain strategy,
  - alerting baseline and operational ownership.

**Next step**

- Continue next strict-order cycle from Priority `01` until architecture prerequisites are provided.
