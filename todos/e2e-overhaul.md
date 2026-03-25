# E2E & Screenshot Infrastructure Overhaul

> **Status:** Mostly complete
> **Last Updated:** 2026-03-24

## Remaining

- [ ] Decide whether screenshot capture should be split across CI workers after the next full run; only do it if runtime stays a bottleneck.
- [ ] Keep the remaining raw locators on a ratchet: only convert them to TEST_IDs when they prove flaky or semantically ambiguous.

## Success Criteria

- [ ] Screenshot capture stays stable across all supported configs.
- [ ] E2E specs and screenshot flows continue sharing the same page objects and selector contracts.
- [ ] New E2E debt is tracked as remaining work, not buried under historical completed phases.

## Closed On This Branch

- Screenshot coverage now scans the modular capture sources instead of only `e2e/screenshot-pages.ts`, which removes the old false-negative route audit.
- The screenshot harness now has a dedicated validator ratchet for private top-level helper counts, so files cannot quietly bloat again without CI noticing.
- The TEST_ID validator now explicitly includes screenshot harness modules as first-class checked files.
