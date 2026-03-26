# Naming And Route Normalization

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-26

## Why This Is P0

- [ ] The branch has accumulated naming that is technically valid but hard to parse in practice. If a human has to stop and decode whether `invite`, `invites`, `token`, or `getInviteByToken` refer to the route, the page object, the table, or the API namespace, the structure is already too muddy.
- [ ] The repo relies on hidden route-directory conventions like `-invite.$token.test.tsx` and `-index.test.tsx` to keep tests beside file-routed pages without generating routes. That works only if someone already knows the trick.
- [ ] This is structural debt, not style debt. If we keep layering more features and screenshot work on top of unreadable naming and non-standard file placement, the repo gets harder to reason about every week.

## Route And API Naming Cleanup

- [ ] Audit public tokenized flows first: invite acceptance, password-reset-style routes, and similar entry points where singular route names sit beside plural API namespaces and token helpers.
- [ ] Define one naming rule for collection resources vs single-resource flows.
  The goal is not to force singular or plural everywhere; it is to make route names, page objects, queries, mutations, and local variables read coherently together.
- [ ] Normalize local frontend naming where collection APIs are correct but the route code becomes hard to read.
  Use frontend-owned aliases, hooks, or wrapper helpers if needed so route files stop reading like `invite` vs `invites` vs `token` soup.
- [ ] Audit route/page-object/test naming for similarly confusing singular-plural mismatches outside invites.

## Route Test Placement Cleanup

- [ ] Replace the `-*.test.tsx` workaround inside `src/routes/**` with a clearer route-test structure.
  Candidate direction: colocated `__tests__` directories or a mirrored `src/route-tests/**` tree that does not depend on magic filename prefixes.
- [ ] Remove the dash-prefix variants consistently once the replacement structure is in place.
  This includes `-route.test.tsx`, `-index.test.tsx`, and top-level `-foo.test.tsx` files.
- [ ] Document the new route-test placement rule so future route work does not reintroduce hidden non-route files into the routed directory.

## Normalization Sweep

- [ ] Search for other repo-folklore naming and placement hacks that require inside knowledge to understand.
  Focus on route-adjacent files, page objects, screenshot readiness helpers, and resource modules where humans routinely hit “what is this?” moments.
- [ ] Remove or rename confusing compatibility aliases when the underlying behavior is already gone.
  The goal is to delete ambiguity, not just rename comments.
- [ ] Update the backlog once the audit is complete so the remaining work is a concrete file-by-file list instead of a vague “normalization” bucket.

## Exit Criteria

- [ ] A new contributor can open a routed feature and understand which file is the route, which file is the test, and which API module owns the data without learning repo-specific hacks first.
- [ ] Public tokenized flows read coherently in code without singular/plural collisions obscuring intent.
- [ ] The repo no longer relies on dash-prefixed route-test filenames as a hidden file-routing escape hatch.
