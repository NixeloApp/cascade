# Uptime Monitoring & Status Pages

> **Priority:** P3 (Future Feature)
> **Effort:** Medium (~1-2 weeks)
> **Value:** High differentiator - competitors charge $29+/mo for status pages

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
