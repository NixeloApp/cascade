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

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Sprint Tag:** `S1`  
**Effort:** Small

### Steps

- [ ] Import and reuse production `hashApiKey` in `convex/apiKeys.test.ts`
- [ ] Remove local duplicate hash implementation from tests
- [ ] Verify API key tests remain deterministic and passing
