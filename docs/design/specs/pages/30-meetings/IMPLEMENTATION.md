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

- Add targeted meetings captures if the base page screenshot does not reliably show:
  - the selected recording detail
  - transcript search/results
  - memory rail with seeded content
- Keep these as explicit named captures instead of overloading the base route screenshot.

---

## Phase 4: E2E Tests

- Add `e2e/meetings.spec.ts` for:
  - empty state
  - seeded recording list/detail
  - transcript filtering
  - action-item to issue creation
  - memory rail filtering by project lens
- Add meetings page objects under `e2e/pages/` once the interaction coverage lands.

