# Security and Migration Issues

## P2 - Rate-limit portal validation by requester, not token guess

**File:** `convex/clientPortal.ts:158`

The client-portal validation limiter keys on `args.token.slice(0, 16)`, so each new token guess gets a fresh bucket. Attackers can bypass throttling by rotating guesses, defeating brute-force protection.

**Fix:** Include caller identity (IP/session) in rate limit key, not just token-derived data.

## P2 - Paginate legacy icon migration beyond first batch

**File:** `convex/documentTemplates.ts:795`

Migration always reads `take(limit)` from start of `documentTemplates` with no cursor. After first page is converted, reruns keep scanning same already-migrated rows, leaving later rows unmigrated.

**Fix:** Track cursor position or filter out already-migrated records.

## Priority

P2 - Security concern is limited by token entropy; migration is one-time operation.
