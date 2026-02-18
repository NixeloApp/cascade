# Phase 6: Performance & Backend Testing

> **Status:** ✅ Complete (39/39 items)
> **Last Updated:** 2026-02-17

Optimize bundle size, add Convex function tests, improve CI reliability.

---

## 6.1 E2E Test Stability — SKIPPED

> Mikhail requested to skip E2E work for now (2026-02-17)

---

## 6.2 Bundle Analysis ✅

**Current State:**

| Bundle | Uncompressed | Gzip | Brotli |
|--------|--------------|------|--------|
| Main (index-*.js) | 2,049 KB | 605 KB | 474 KB |
| Secondary (index-*.js) | 183 KB | 60 KB | 51 KB |
| Settings (lazy) | 122 KB | 30 KB | 25 KB |
| CSS | 384 KB | 55 KB | 40 KB |

**Largest Dependencies (disk):**
- lucide-react - 45MB
- date-fns - 33MB
- posthog-js - 30MB
- @mantine/core - 24MB
- framer-motion - 5.7MB

**Tasks:**
- [x] Install bundle analyzer (already in vite.config.ts)
- [x] Generate bundle report (`pnpm vite build --mode analyze`)
- [x] Identify large dependencies
- [x] Lazy load heavy routes (PlateEditor, AnalyticsDashboard, TimeTrackingPage, Settings)
- [x] Document bundle budget (700KB gzip, CI enforced)

**Budget:** 700KB gzip main bundle. Current: ~605KB gzip ✅

---

## 6.3 Convex Function Tests ✅

**23 Convex modules tested:**

| Function | File | Tests |
|----------|------|-------|
| createIssue | issues/mutations.ts | 22 |
| updateIssue | issues/mutations.ts | ✅ |
| bulkUpdateIssues | issues/mutations.ts | ✅ |
| moveIssue | issues/mutations.ts | ✅ |
| createSprint | sprints.ts | 25 |
| completeSprint | sprints.ts | ✅ |
| acceptInboxIssue | inbox.ts | 9 |
| bulkAccept | inbox.ts | ✅ |
| sendEventReminders | eventReminders.ts | 15 |
| validateProjectAccess | projects.ts | 43 |
| savedFilters.* | savedFilters.ts | 17 |
| watchers.* | watchers.ts | 18 |
| labelGroups.* | labelGroups.ts | 15 |
| documentVersions.* | documentVersions.ts | 17 |
| calendarEventsAttendance.* | calendarEventsAttendance.ts | 17 |
| attachments.* | attachments.ts | 3 |
| notificationPreferences.* | notificationPreferences.ts | 10 |
| userSettings.* | userSettings.ts | 13 |
| userProfiles.* | userProfiles.ts | 23 |
| export.* | export.ts | 16 |
| documentTemplates.* | documentTemplates.ts | 22 |
| pushNotifications.* | pushNotifications.ts | 19 |
| files.* | files.ts | 15 |

**Test Pattern:**
```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("createIssue", () => {
  it("should create issue with required fields", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const issueId = await ctx.mutation(api.issues.mutations.createIssue, {...});
      expect(issueId).toBeDefined();
    });
  });
});
```

---

## 6.4 Code Splitting ✅

| Route | Status |
|-------|--------|
| /settings/* | ✅ React.lazy |
| /analytics | ✅ AnalyticsDashboard lazy |
| /time-tracking | ✅ TimeTrackingPage lazy |
| /documents/* | ✅ PlateEditor lazy |
| Heavy components | ✅ Wrapped in lazy() |

**Pattern:**
```typescript
const PlateEditor = lazy(() =>
  import("@/components/PlateEditor").then((m) => ({ default: m.PlateEditor }))
);

<Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
  <PlateEditor documentId={id} />
</Suspense>
```

---

## 6.5 CI Performance ✅

| Task | Status | Notes |
|------|--------|-------|
| Cache pnpm store | ✅ | Explicit actions/cache@v4 in all jobs |
| Parallelize lint/type/test | ✅ | 3 parallel jobs: biome-and-typecheck, unit-tests, backend-tests |
| Skip unchanged packages | N/A | Not a monorepo |
| Bundle size check | ✅ | 700KB gzip budget, fails if exceeded |

**CI Architecture:**
- 3 parallel jobs run concurrently
- `build` job runs after all 3 pass
- E2E tests sharded across 4 workers (when enabled)
- pnpm store cached per pnpm-lock.yaml hash

---

## Progress Summary

| Section | Status | Items |
|---------|--------|-------|
| 6.1 E2E Stability | ⏸️ | Skipped |
| 6.2 Bundle Analysis | ✅ | 5/5 |
| 6.3 Convex Tests | ✅ | 23/23 |
| 6.4 Code Splitting | ✅ | 5/5 |
| 6.5 CI Performance | ✅ | 4/4 |
| **Total** | **100%** | **39/39** |

---

## Commands

```bash
# Generate bundle visualization
pnpm vite build --mode analyze

# Run full validation
pnpm run check

# Run custom validators
node scripts/validate.js
```
