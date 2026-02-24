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

## 2025-03-03 - Workspace Access Helpers & Soft Deletion
**Learning:** The helper functions in `convex/lib/workspaceAccess.ts` (`getWorkspaceRole`, etc.) query `workspaceMembers` by `[workspaceId, userId]` index but do *not* filter out records where `isDeleted: true`.
**Action:** Be aware that these helpers return roles for soft-deleted members. If access should be denied for deleted members, the query in `workspaceAccess.ts` needs to be updated to filter `q.eq("isDeleted", undefined)` or similar. Tests added in `convex/lib/workspaceAccess.test.ts` document this current behavior.
