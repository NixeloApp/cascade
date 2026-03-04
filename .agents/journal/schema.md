# Schema Agent Journal

## Critical Learnings

- **Mutation Return Types:** Standardize mutation return types to `{ success: true }` (or similar object) instead of `void`. This improves consistency across modules (`teams.ts`, `organizations.ts`, `projects.ts`) and future-proofs the API.
