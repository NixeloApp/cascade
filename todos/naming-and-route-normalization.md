# Naming And Route Normalization

> **Priority:** P1
> **Status:** Done
> **Last Updated:** 2026-03-28

## Shipped

- [x] Renamed the public invite-entry route from `/invite/$token` to `/join/$token`.
  Implemented in:
  - `convex/shared/routes.ts`
  - `src/routes/join.$token.tsx`
  - `convex/invites.ts`
  - `src/config/routes.test.ts`
  - `e2e/join.spec.ts`
  - `e2e/pages/join.page.ts`
  - `docs/AUTHENTICATION.md`
- [x] Normalized the client portal route naming in shared route constants from `ROUTES.portal.*` to `ROUTES.clientPortal.*`.
  Implemented in:
  - `convex/shared/routes.ts`
  - `src/config/routes.test.ts`
  - `e2e/screenshot-lib/public-pages.ts`
  - `e2e/pages/client-portal.page.ts`
  - `e2e/pages/index.ts`
- [x] Split public join-page test IDs from admin invite-management test IDs so the public route and the admin collection no longer share one `TEST_IDS.INVITE` namespace.
  Implemented in:
  - `src/lib/test-ids.ts`
  - `src/routes/join.$token.tsx`
  - `src/components/Admin/UserManagement.tsx`
  - `e2e/pages/settings.page.ts`
  - `e2e/pages/join.page.ts`
- [x] Replaced dash-prefixed route-test filenames with adjacent `__tests__` directories throughout `src/routes/**`.
  Example endpoints now look like:
  - `src/routes/__tests__/join.$token.test.tsx`
  - `src/routes/_auth/_app/$orgSlug/__tests__/assistant.test.tsx`
  - `src/routes/_auth/_app/$orgSlug/documents/__tests__/index.test.tsx`
  - `src/routes/_auth/_app/$orgSlug/projects/$key/__tests__/route.test.tsx`
  - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/__tests__/route.test.tsx`
- [x] Added validator coverage so route tests cannot quietly return to `src/routes/**` without `__tests__/`.
  Implemented in:
  - `scripts/validate/check-route-drift.js`
  - `scripts/validate/check-route-drift.test.ts`
- [x] Documented the new route-test placement rule and updated spec docs that referenced the old hidden filenames.
  Implemented in:
  - `CONTRIBUTING.md`
  - `docs/design/specs/pages/20-my-issues/CURRENT.md`
  - `docs/design/specs/pages/20-my-issues/IMPLEMENTATION.md`
  - `docs/design/specs/pages/23-org-calendar/CURRENT.md`
  - `docs/design/specs/pages/33-assistant/CURRENT.md`
  - `docs/design/specs/pages/33-assistant/IMPLEMENTATION.md`

## Why This Was P0

- [x] The branch had accumulated naming that was technically valid but hard to parse in practice.
- [x] The repo relied on hidden route-directory conventions like `-invite.$token.test.tsx` and `-index.test.tsx` to keep tests beside file-routed pages without generating routes.
- [x] This was structural debt, not style debt.

## Route And API Naming Cleanup

- [x] Decide the public-token naming rule first.
- [x] Normalize local frontend naming where collection APIs were correct but the route code became hard to read.
- [x] Audit the adjacent tokenized flows that had the same readability risk.
- [x] Produce a file-by-file rename list instead of another abstract audit note.

## Route Test Placement Cleanup

- [x] Replace the `-*.test.tsx` workaround inside `src/routes/**` with adjacent `__tests__` directories.
- [x] Use one replacement structure consistently: colocated `__tests__`.
- [x] Remove the dash-prefix variants consistently once the replacement structure lands.
- [x] Document the new route-test placement rule so future route work does not reintroduce hidden non-route files into the routed directory.
- [x] Add validator coverage so `src/routes/**` cannot quietly accumulate non-route files through naming hacks again.

## Normalization Sweep

- [x] Search for the route-adjacent naming and placement hacks that required inside knowledge to understand.
- [x] Remove or rename confusing compatibility aliases where the replacement behavior is now canonical.
- [x] Normalize route constant names, page-object names, and route component names together where one layer had drifted.
- [x] Keep this todo concrete with a file-by-file shipped list.

## Exit Criteria

- [x] A new contributor can open a routed feature and understand which file is the route, which file is the test, and which API module owns the data without learning repo-specific hacks first.
- [x] Public tokenized flows read coherently in code without singular/plural collisions obscuring intent, and admin collection pages use obviously administrative names.
- [x] The repo no longer relies on dash-prefixed route-test filenames as a hidden file-routing escape hatch.
