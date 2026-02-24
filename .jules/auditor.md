# Auditor's Journal

## Daily Log

- **[Date]**: Initialized journal.
- **[Date]**: Found inconsistency: Mutations returning raw IDs vs Objects. Selected fix: Standardize return types to Objects (Envelope Pattern).
- **[Date]**: Found inconsistency: `deleteWorkspace` in `convex/workspaces.ts` returns `void`. Fix: Updated to return `{ success: true, deleted: true }` and added validators to other void-returning mutations in the same file.
- **[Date]**: Found inconsistency: `deleteComment` in `convex/documents.ts` returned `{ success: true }` and manually set `isDeleted: true`. Fix: Updated to return `{ success: true, deleted: true }` (Envelope Pattern), updated schema to include `deletedAt`/`deletedBy`, and used `softDeleteFields` for consistency. Verified with new test `convex/documentsComments.test.ts`.
- **[2026-02-24]**: Found inconsistency: `convex/customFields.ts` mutations returned `void` instead of objects. Fix: Updated `update`, `remove`, `setValue`, and `removeValue` to return `{ success: true }` or `{ success: true, deleted: true }` (Envelope Pattern), and added explicit `returns` validators.
- **[2026-02-24]**: Found inconsistency: Mutations in `convex/teams.ts`, `convex/projects.ts`, and `convex/issues/mutations.ts` were missing `returns` validators or returning unstructured data. Fix: Enforced Envelope Pattern by adding `returns` validators and ensuring `{ success: true }` (or similar) return objects for consistency.
