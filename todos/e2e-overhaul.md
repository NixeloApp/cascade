# E2E & Screenshot Infrastructure Overhaul

> **Status:** Mostly complete
> **Last Updated:** 2026-03-24

## Remaining

- [ ] Add a validator that counts private functions in the screenshot tool so the harness does not regress back into a large monolith.
- [ ] Ensure the TEST_ID validator explicitly covers the screenshot harness modules, not just spec files.
- [ ] Decide whether screenshot capture should be split across CI workers after the next full run; only do it if runtime stays a bottleneck.
- [ ] Keep the remaining raw locators on a ratchet: only convert them to TEST_IDs when they prove flaky or semantically ambiguous.

## Success Criteria

- [ ] Screenshot capture stays stable across all supported configs.
- [ ] E2E specs and screenshot flows continue sharing the same page objects and selector contracts.
- [ ] New E2E debt is tracked as remaining work, not buried under historical completed phases.
