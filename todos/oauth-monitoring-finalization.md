# OAuth Monitoring - Finalization

**Effort:** Medium
**Priority:** P2
**Related:** `/docs/oauth-monitoring-runbook.md`
**Status:** Blocked (awaiting external monitoring destination decision)
**Last Audited:** 2026-03-02

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

- [x] Store health check results in DB ✅ (`oauthHealthChecks` table)
  - `recordHealthCheck` persists `success`, `latencyMs`, `error`, `errorCode`, `timestamp`
- [x] Create admin dashboard query
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

- [x] Add feature flag in Convex
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
- [x] Update `GoogleAuthButton.tsx` to check flag
- [x] Create admin UI to toggle flag in emergencies
- [x] Document runbook for disabling Google auth

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

- [x] Health check logs persisted to DB
- [x] Admin can view OAuth health stats
- [x] Feature flag can disable Google auth gracefully
- [x] Alerts fire on failures (already working via Slack)

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1-S2`  
**Effort:** Medium

### Milestones

- [x] `S1` Admin health query + dashboard view (7d/30d success rate, p95 latency, recent failures)
- [x] `S1` Incident-oriented health summary fields (`firstFailAt`, `lastFailAt`, `recoveredAt`)
- [x] `S2` Feature flag table + admin toggle + GoogleAuthButton fallback UX
- [x] `S2` Runbook hardening: emergency disable/re-enable checklist + verification steps

### Alerting Details

- Warning threshold: `2` consecutive failures
- Critical threshold: `4` consecutive failures
- Add one immediate retry before alert emission to reduce false positives

### Dependencies

- Admin settings surface for operations controls
- Slack webhook reliability and alert destination ownership

### Definition of Done

- On-call can detect degraded OAuth health, disable Google auth quickly, and verify recovery.

---

## Progress Log

### 2026-03-02 - Batch A (S1 admin health query + settings dashboard)

- Decision:
  - implement S1 as an org-admin-only backend query plus an admin settings dashboard card before tackling feature-flag fallback controls.
- Change:
  - backend (`convex/oauthHealthCheck.ts`):
    - added `api.oauthHealthCheck.getOAuthHealthStats` (organization-scoped + admin-only access).
    - supports range input (`days` clamped to `1..30`) and returns:
      - `successRate`, `avgLatencyMs`, `p95LatencyMs`,
      - `consecutiveFailures`,
      - incident summary fields `firstFailAt`, `lastFailAt`, `recoveredAt`,
      - `recentFailures` and `lastCheckAt`.
  - frontend:
    - added `src/components/Admin/OAuthHealthDashboard.tsx` with 7d/30d toggle, health KPIs, incident summary, and recent failures list.
    - integrated the dashboard into admin settings tab in `src/components/Settings.tsx`.
  - tests:
    - extended `convex/oauthHealthCheck.test.ts` with:
      - admin aggregate stats coverage,
      - non-admin access rejection coverage.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/oauthHealthCheck.test.ts` => pass (`14 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - continue Priority `08` with S2 feature-flag path: add backend feature-flag storage/query + GoogleAuthButton fallback + admin toggle UI.

### 2026-03-02 - Batch B (S2 feature-flag emergency controls)

- Decision:
  - implement Google-auth kill-switch as a global feature flag with org-admin write access, while keeping public read access for unauthenticated auth pages.
- Change:
  - backend:
    - added `featureFlags` table to `convex/schema.ts` (`name`, `enabled`, `reason`, `updatedAt`, `updatedBy`) + indexes.
    - added `convex/featureFlags.ts`:
      - `api.featureFlags.isGoogleAuthEnabled` (public query, defaults to `true` if unset).
      - `api.featureFlags.setGoogleAuthEnabled` (organization-admin mutation).
    - added `featureFlags` to purge coverage in `convex/purge.ts`.
  - frontend:
    - updated `src/components/Auth/GoogleAuthButton.tsx` to check `api.featureFlags.isGoogleAuthEnabled` and render a disabled fallback state + guidance text when Google auth is off.
    - added `src/components/Admin/OAuthFeatureFlagSettings.tsx` for admin emergency toggle + reason input.
    - integrated feature-flag admin card into settings admin tab (`src/components/Settings.tsx`).
  - tests:
    - added `convex/featureFlags.test.ts` covering default-on behavior, admin toggle flow, and non-admin rejection.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/featureFlags.test.ts convex/oauthHealthCheck.test.ts` => pass (`17 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - complete remaining Priority `08` item: runbook hardening for emergency disable/re-enable checklist + verification steps.

### 2026-03-02 - Batch C (runbook hardening for emergency controls)

- Decision:
  - document explicit operator playbooks directly in `docs/oauth-monitoring-runbook.md` so on-call can execute disable/re-enable actions without relying on tribal context.
- Change:
  - updated `docs/oauth-monitoring-runbook.md` with a dedicated `Emergency Google Auth Kill Switch` section:
    - disable checklist (admin-only toggle flow + reason logging),
    - post-disable verification checklist (incognito button state, email auth fallback, monitoring continuity),
    - re-enable checklist (health preconditions + evidence capture),
    - post-recovery verification checklist (real Google sign-in + 15m health stability + Slack update).
  - aligned this todo’s Phase 5 checklist and S2 runbook milestone to done.
- Validation:
  - docs-only update; no code execution required.
- Blockers:
  - none for this subtask.
- Next Step:
  - decide whether to complete the remaining optional integration track (`external monitoring`) or close Priority `08` as done for current Convex+Slack scope.

### 2026-03-02 - Batch D (external monitoring integration status)

- Decision:
  - treat DataDog/Grafana push integration as blocked optional scope until an external metrics destination and owner are explicitly selected.
- Change:
  - kept `Integrate with external monitoring` unchecked.
  - marked todo status as blocked with clear reason (`external monitoring destination decision` pending).
  - marked Slack-based alert acceptance criterion as complete (`alerts fire on failures`).
- Validation:
  - no code change required for this status alignment.
- Blockers:
  - no configured external destination (DataDog/Grafana endpoint/API key/project owner) in current environment.
- Next Step:
  - once destination is chosen, implement HTTP push action + delivery validation; until then, proceed to next priority using existing Convex + Slack monitoring path.

### 2026-03-02 - Batch E (blocked-state checkpoint)

- Decision:
  - keep Priority `08` blocked; no in-repo work remains without an external monitoring destination decision.
- Change:
  - no code changes; status and blocker rationale reconfirmed.
- Validation:
  - current implemented scope remains complete: Convex health checks + admin dashboard + Google auth kill-switch + Slack alerts + runbook.
- Blockers:
  - missing external destination contract (DataDog/Grafana endpoint, credentials, and owner).
- Next Step:
  - once destination is provided, implement push action and delivery verification; otherwise continue strict order to Priority `09`.

### 2026-03-02 - Batch F (strict-order revalidation checkpoint)

- Decision:
  - keep Priority `08` blocked; no additional in-repo implementation remains without an external monitoring destination contract.
- Validation:
  - `pnpm test convex/oauthHealthCheck.test.ts convex/featureFlags.test.ts` => pass (`17 passed`)
  - implemented stack remains intact: health checks, admin stats view, emergency Google-auth kill switch, Slack alerting, and runbook procedures.
- Blockers:
  - external monitoring destination is still undefined (DataDog/Grafana endpoint, credentials, owner).
- Next Step:
  - when destination is provided, implement push integration + delivery validation; until then continue strict order at Priority `09`.
