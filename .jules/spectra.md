# Spectra's Journal - Critical Learnings

## 2025-02-17 - Convex Test Environment
**Learning:** `convex/testSetup.test-helper.ts` automatically sets `global.IS_TEST_ENV = true` and `process.env.IS_TEST_ENV = "true"`.
**Action:** No need to manually mock rate limiters or check env vars in tests; the environment is already configured for testing.

## 2025-02-17 - Biome Linting in Tests
**Learning:** `biome` is strict about non-null assertions (`!`), even in tests.
**Action:** Use `// biome-ignore lint/style/noNonNullAssertion: testing convenience` when asserting non-null values for convenience in test files.

## 2025-02-24 - Testing Date-Dependent Logic in Convex
**Learning:** `vi.useFakeTimers()` and `vi.setSystemTime()` effectively control `Date` and `Date.now()` within `convex-test` execution, allowing deterministic testing of time-based logic like monthly rotations.
**Action:** Use `vi.useFakeTimers()` in `beforeEach` to set a specific date when testing time-sensitive business logic.

## 2025-02-27 - Strict Validation with parseInt
**Learning:** `Number.parseInt("0/33")` returns `0` because it parses until a non-digit character, which can bypass validation checks (like `ipv4ToInt`) if strict regex matching (`/^\d+$/`) isn't applied.
**Action:** Always validate input format strictly with regex before relying on `parseInt` for security-critical values.
