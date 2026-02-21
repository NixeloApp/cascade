# Refactor Journal

This journal tracks critical learnings and major refactoring decisions.

## 2026-02-20 - Initial Setup
- Created refactor journal.
- Refactored `convex/users.ts` to consolidate parallel project counting logic into `countByProjectParallel` helper.
- Learned: When extracting helpers for "fast path" optimizations, ensure that clamping logic (e.g. `Math.min`) is applied at the appropriate level (per-project vs global) to preserve exact behavior.

## 2026-02-20 - Documents Access Refactor
- Refactored `convex/documents.ts` to centralize document retrieval and access checks into `getAccessibleDocument` helper.
- Learned: When replacing manual checks with a helper, verify that the helper's error types (e.g., `NOT_FOUND` vs returning `null`) match the original behavior for each call site. In this case, mutations and specific queries expected `throw notFound`, which matched the helper.

## 2026-02-20 - MeetingBot Access Refactor
- Refactored `convex/meetingBot.ts` to centralize recording access checks into `canAccessRecording` and `assertCanAccessRecording` helpers.
- Learned: Extracting repeated access control logic into helpers not only reduces duplication but also ensures consistency across different API endpoints (queries vs mutations). It allows distinguishing between "check and return null" and "check and throw forbidden" patterns while reusing the core logic.
