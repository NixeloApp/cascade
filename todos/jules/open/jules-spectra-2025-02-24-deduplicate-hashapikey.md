# TODO: De-duplicate hashApiKey implementation

## Context
Found duplicate implementation of `hashApiKey` in `convex/apiKeys.test.ts`.

## Issue
`convex/apiKeys.test.ts` defines its own `hashApiKey` function using `node:crypto`, while `convex/lib/apiAuth.ts` has the production implementation using `crypto.subtle`.

## Action
Refactor `convex/apiKeys.test.ts` to use `hashApiKey` from `convex/lib/apiAuth.ts` to ensure tests use the same logic as production code.

## Audit (2026-03-02)

- Duplicate test-local `hashApiKey` still exists in `convex/apiKeys.test.ts`.
- Production `hashApiKey` remains in `convex/lib/apiAuth.ts`.
- Status: Open.
