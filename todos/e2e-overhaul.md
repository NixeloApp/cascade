# E2E & Screenshot Infrastructure Overhaul

> **Status:** Nearly complete
> **Last Updated:** 2026-03-25

Current state: screenshot coverage, TEST_ID enforcement, screenshot harness structure, silent-catch handling, and raw page-level locator debt all have CI ratchets now. The only remaining decision is whether screenshot capture runtime justifies a future worker split.

## Remaining

- [ ] Decide whether screenshot capture should be split across CI workers after the next full run; only do it if runtime stays a bottleneck.
