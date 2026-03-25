# Meetings Page - Implementation

> **Priority**: P1 - Current failure pipeline
> **Scope**: Screenshot/spec coverage, then interaction coverage

---

## Phase 1: Screenshot Coverage

- Add the meetings route to `PAGE_TO_SPEC_FOLDER`.
- Capture both empty and seeded meetings states from `e2e/screenshot-pages.ts`.
- Wait for meetings-specific content before capturing so the harness avoids spinner or shell-only screenshots.
- Create the canonical page spec folder at `docs/design/specs/pages/30-meetings/`.

---

## Phase 2: Baselines

- Run `pnpm screenshots -- --match meetings` with the app running.
- Review all four canonical configs:
  - `desktop-dark`
  - `desktop-light`
  - `tablet-light`
  - `mobile-light`
- Approve intentional output into `.screenshot-hashes.json`.

---

## Phase 3: Deeper Visual States

- Add explicit meetings subcaptures in `e2e/screenshot-pages.ts` for:
  - selected recording detail
  - transcript search/results
  - project-lens filtered memory rail
- Keep these as named captures instead of overloading the base route screenshot:
  - `filled-meetings-detail`
  - `filled-meetings-transcript-search`
  - `filled-meetings-memory-lens`
- Only keep per-viewport variants that visibly change the captured composition. Do not track mobile or
  tablet aliases that collapse to the same above-the-fold screenshot as the canonical route.

---

## Phase 4: E2E Tests

- Add `e2e/meetings.spec.ts` for:
  - empty state
  - seeded recording list/detail
  - transcript filtering
  - action-item to issue creation
  - memory rail filtering by project lens
- Add meetings page objects under `e2e/pages/` once the interaction coverage lands.

These E2E steps are now implemented; remaining work is baseline generation, manifest approval, and visual review.
