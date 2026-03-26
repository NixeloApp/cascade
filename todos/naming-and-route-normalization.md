# Naming And Route Normalization

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-26

## Why This Is P0

- [ ] The branch has accumulated naming that is technically valid but hard to parse in practice. If a human has to stop and decode whether `invite`, `invites`, `token`, or `getInviteByToken` refer to the route, the page object, the table, or the API namespace, the structure is already too muddy.
- [ ] The repo relies on hidden route-directory conventions like `-invite.$token.test.tsx` and `-index.test.tsx` to keep tests beside file-routed pages without generating routes. That works only if someone already knows the trick.
- [ ] This is structural debt, not style debt. If we keep layering more features and screenshot work on top of unreadable naming and non-standard file placement, the repo gets harder to reason about every week.

## Route And API Naming Cleanup

- [ ] Decide the public-token naming rule first.
  First targets:
  - `/invite/$token` vs a clearer public name like `/join/$token`
  - authenticated admin collection pages like `/settings/invites`
  - route constants, page objects, and route component names for the same flow
- [ ] Normalize local frontend naming where collection APIs are correct but the route code becomes hard to read.
  The immediate smell to remove is `invite` vs `invites` vs `token` soup in one file.
- [ ] Audit other tokenized flows with the same risk:
  - password reset
  - unsubscribe
  - client portal/public entry
- [ ] Produce a file-by-file rename list instead of another abstract audit note.

## Route Test Placement Cleanup

- [ ] Replace the `-*.test.tsx` workaround inside `src/routes/**` with a clearer route-test structure.
  First targets:
  - `src/routes/-invite.$token.test.tsx`
  - `src/routes/-signup.test.tsx`
  - `src/routes/-forgot-password.test.tsx`
  - nested `-index.test.tsx` / `-route.test.tsx` files under `src/routes/_auth/**`
- [ ] Choose one replacement structure and use it consistently:
  - colocated `__tests__`
  - or a mirrored `src/route-tests/**` tree
- [ ] Remove the dash-prefix variants consistently once the replacement structure is in place.
- [ ] Remove the dash-prefix variants consistently once the replacement structure is in place.
- [ ] Document the new route-test placement rule so future route work does not reintroduce hidden non-route files into the routed directory.
- [ ] Add validator coverage once the structure lands so `src/routes/**` cannot quietly accumulate non-route files through naming hacks again.

## Normalization Sweep

- [ ] Search for other repo-folklore naming and placement hacks that require inside knowledge to understand.
  Focus on route-adjacent files, page objects, screenshot readiness helpers, and resource modules where humans routinely hit “what is this?” moments.
- [ ] Remove or rename confusing compatibility aliases when the underlying behavior is already gone.
  The goal is to delete ambiguity, not just rename comments.
- [ ] Normalize route constant names, page-object names, and route component names together where one layer was renamed and the others drifted.
- [ ] Keep this todo concrete. As each audit lands, replace broad bullets with a file-by-file rename list.

## Exit Criteria

- [ ] A new contributor can open a routed feature and understand which file is the route, which file is the test, and which API module owns the data without learning repo-specific hacks first.
- [ ] Public tokenized flows read coherently in code without singular/plural collisions obscuring intent, and admin collection pages use obviously administrative names.
- [ ] The repo no longer relies on dash-prefixed route-test filenames as a hidden file-routing escape hatch.
