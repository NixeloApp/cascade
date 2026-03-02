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

- [x] Import and reuse production `hashApiKey` in `convex/apiKeys.test.ts`
- [x] Remove local duplicate hash implementation from tests
- [x] Verify API key tests remain deterministic and passing

## Progress Log

### 2026-03-02 - Batch A (hash helper dedup complete)

- Decision:
  - make test hashing source-of-truth identical to production by importing `hashApiKey` from `convex/lib/apiAuth.ts`.
- Change:
  - updated `convex/apiKeys.test.ts`:
    - removed local `node:crypto` hash helper.
    - imported `hashApiKey` from `convex/lib/apiAuth.ts`.
    - updated API-key validation assertions to await async `hashApiKey(...)` calls.
- Validation:
  - `pnpm exec biome check convex/apiKeys.test.ts` => pass
  - `pnpm test convex/apiKeys.test.ts` => pass (`13 passed`)
- Blockers:
  - none.
- Next Step:
  - no follow-up required for this issue; keep API key hashing behavior aligned through shared helper usage.

### 2026-03-02 - Batch B (resolution confirmation)

- Decision:
  - close as resolved; test hashing remains deduplicated and aligned to production helper.
- Validation:
  - `pnpm test convex/apiKeys.test.ts` => pass (`13 passed`)
  - confirmed `convex/apiKeys.test.ts` imports `hashApiKey` from `convex/lib/apiAuth.ts` and has no local duplicate implementation.
- Blockers:
  - none.
- Next Step:
  - move to Priority `06` (`multi-level-views.md`).
