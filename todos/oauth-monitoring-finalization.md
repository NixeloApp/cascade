# OAuth Monitoring - Finalization

**Effort:** Medium
**Priority:** P2
**Related:** `/docs/oauth-monitoring-runbook.md`

## Overview

OAuth synthetic monitoring is implemented. This task covers finalizing the remaining components.

## Completed

- [x] Contract tests (`googleOAuth.contract.test.ts`) - 20 tests
- [x] Playwright mock OAuth helpers (`e2e/utils/google-oauth-mock.ts`)
- [x] Playwright mock OAuth tests (`e2e/oauth-mocked.spec.ts`)
- [x] Health check action (`convex/oauthHealthCheck.ts`)
- [x] Cron job in `convex/crons.ts` - 15 min interval
- [x] Documentation runbook

## Remaining Tasks

### Phase 4: Metrics Integration

- [ ] Store health check results in `oauthHealthLogs` table
  - Modify `recordHealthCheck` mutation to persist to DB
  - Add fields: `success`, `latencyMs`, `error`, `errorCode`, `timestamp`
- [ ] Create admin dashboard query
  ```typescript
  export const getOAuthHealthStats = query({
    args: { days: v.optional(v.number()) },
    handler: async (ctx, { days = 7 }) => {
      // Return success rate, avg latency, recent failures
    }
  });
  ```
- [ ] Integrate with external monitoring (if using DataDog/Grafana)
  - Add HTTP action to push metrics
  - Or use Convex dashboard + Slack alerts (current setup)

### Phase 5: Fallback UI

- [ ] Add feature flag in Convex
  ```typescript
  // convex/featureFlags.ts
  export const isGoogleAuthEnabled = query({
    handler: async (ctx) => {
      const flag = await ctx.db.query('featureFlags')
        .filter(q => q.eq(q.field('name'), 'google_auth_enabled'))
        .first();
      return flag?.enabled ?? true;
    }
  });
  ```
- [ ] Update `GoogleAuthButton.tsx` to check flag
- [ ] Create admin UI to toggle flag in emergencies
- [ ] Document runbook for disabling Google auth

## Environment Variables Required

Already documented in runbook, ensure set in Convex Dashboard:

```bash
# Synthetic monitoring (get from OAuth Playground)
OAUTH_MONITOR_GOOGLE_CLIENT_ID=xxx
OAUTH_MONITOR_GOOGLE_CLIENT_SECRET=xxx
OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN=xxx

# Alerting
SLACK_OAUTH_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## Acceptance Criteria

- [ ] Health check logs persisted to DB
- [ ] Admin can view OAuth health stats
- [ ] Feature flag can disable Google auth gracefully
- [ ] Alerts fire on failures (already working via Slack)
