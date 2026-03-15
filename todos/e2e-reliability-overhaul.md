# E2E Reliability Overhaul

> **Priority:** P2 (maintenance)
> **Status:** Complete (core work done)
> **Last Updated:** 2026-03-15

## Results

- **Zero** `waitForTimeout` across the entire E2E suite
- **Zero** `networkidle` usage (replaced with `domcontentloaded`)
- **Zero** deprecated `waitForSelector` (replaced with `locator().waitFor()`)
- **Zero** `.animate-spin` selectors (replaced with `getByRole("status")`)
- All screenshot waits use `waitForScreenshotReady()` deterministic helper

## Remaining (maintenance)

- Monitor for new flakes as features land
- Keep `forbidOnly` and no-skip policy enforced
- Expand `TEST_IDS` coverage as new features ship
