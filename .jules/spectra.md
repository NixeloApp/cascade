# Spectra's Journal - Critical Learnings

## 2025-02-17 - Convex Test Environment
**Learning:** `convex/testSetup.test-helper.ts` automatically sets `global.IS_TEST_ENV = true` and `process.env.IS_TEST_ENV = "true"`.
**Action:** No need to manually mock rate limiters or check env vars in tests; the environment is already configured for testing.

## 2025-02-17 - Biome Linting in Tests
**Learning:** `biome` is strict about non-null assertions (`!`), even in tests.
**Action:** Use `// biome-ignore lint/style/noNonNullAssertion: testing convenience` when asserting non-null values for convenience in test files.
