# Assistant - Implementation

> **Route**: `/:orgSlug/assistant`

## Data Sources

| Query | Purpose |
|-------|---------|
| `api.ai.queries.getUsageStats` | Total requests, total cost, token volume, provider split, operation split, success rate |
| `api.ai.queries.getUserChats` | Recent user-owned AI chats for the conversations tab |

## UI Contract

1. The route owns only presentation and review states.
2. It is a read-only summary surface, not a settings screen.
3. Overview always renders:
   - three summary cards
   - a workspace AI snapshot card
   - either breakdown cards or a no-activity empty state
4. Conversations always renders:
   - a card shell
   - either seeded chat rows or an embedded empty state
5. Loading is route-scoped and screenshotable through `window.__NIXELO_E2E_ASSISTANT_LOADING__`.

## E2E / Screenshot Support

| File | Responsibility |
|------|----------------|
| `convex/e2e.ts` | Seeds default assistant usage/chat data and exposes `configure-assistant-state` (`default` / `empty`) |
| `convex/router.ts` | Registers `/e2e/configure-assistant-state` |
| `e2e/config.ts` | E2E endpoint constant |
| `e2e/utils/test-user-service.ts` | Client wrapper for assistant state changes |
| `e2e/pages/assistant.page.ts` | Route page object for tabs/readiness |
| `e2e/screenshot-lib/interactive-captures.ts` | Captures canonical, conversations, empty, and loading assistant states |
| `e2e/screenshot-pages.ts` | Declares assistant screenshot page ids |

## Tests

| File | Coverage |
|------|----------|
| `src/routes/_auth/_app/$orgSlug/__tests__/assistant.test.tsx` | overview rendering, no-activity overview state, conversations tab, empty conversations, loading override |

## Notes

- The fake toggle/config controls were removed on purpose. Reintroducing assistant settings should
  happen only with real persistence and permission rules.
- Screenshot seeding clears and rebuilds `aiUsage`, `aiChats`, and `aiMessages` for the screenshot
  owner so assistant captures stay deterministic across reruns.
