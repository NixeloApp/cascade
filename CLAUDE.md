# CLAUDE.md - Nixelo Project Guide

**IMPORTANT: You MUST read RULES.md before starting any task. The @RULES.md reference below does not auto-include the file contents.**

@RULES.md

---

## Project Overview

**Nixelo** is a collaborative project management platform combining document management (Confluence-like) with issue tracking (Jira-like). Features real-time collaboration, presence indicators, and live updates.

**Key Features:** Real-time docs with BlockNote, Kanban boards, sprint planning, custom workflows, RBAC, calendar events, REST API, Google Calendar sync, multi-provider auth, email notifications, Text AI (chat, search), Voice AI (meeting bot).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, TanStack Router, Tailwind CSS 4, BlockNote |
| Backend | Convex (serverless + real-time DB), @convex-dev/auth |
| UI Primitives | Radix UI (via shadcn/ui wrapper pattern) |
| Tools | pnpm, Biome 2.3, TypeScript 5.9, Vitest 4 |

## Codebase Structure

```
nixelo/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   ├── components/       # React components (ui/, AI/)
│   │   └── ui/           # shadcn/ui primitives (Radix wrappers)
│   ├── lib/
│   │   ├── utils.ts      # cn() utility
│   │   └── constants.ts  # App-wide constants (ANIMATION, DISPLAY_LIMITS, etc.)
│   ├── config/routes.ts  # ROUTES object - always use this!
│   └── index.css         # Design tokens (@theme block) + global styles
├── convex/               # Backend functions, schema.ts
├── emails/               # React Email templates
├── bot-service/          # Voice AI meeting bot
├── scripts/validate/     # Custom validation checks (run with: node scripts/validate.js)
└── docs/                 # Feature documentation
```

## Database Schema (Core Tables)

- **documents**: title, isPublic, createdBy, projectId
- **projects**: name, key, members[], workflowStates[]
- **issues**: key (PROJ-123), title, status, priority, assigneeId, sprintId
- **sprints**: name, goal, startDate, endDate, status
- **calendarEvents**: title, startTime, endTime, attendeeIds[], isRequired

## Routing

**IMPORTANT:** Always use `ROUTES` from `@/config/routes.ts`. Never hardcode paths.

```typescript
import { ROUTES } from "@/config/routes";

ROUTES.dashboard(slug)              // "/:slug/dashboard"
ROUTES.projects.board(slug, key)    // "/:slug/projects/:key/board"
ROUTES.issues.detail(slug, key)     // "/:slug/issues/:key"
```

## UI Components

Use components from `src/components/ui/` instead of raw HTML:

`Button`, `Flex`, `Typography`, `Card`, `Input`, `Dialog`, `Tooltip`, `Badge`, `Avatar`, `LoadingSpinner`, `EmptyState`, `DropdownMenu`

**Key rules:**
- Use `<Flex>` instead of `<div className="flex">` for layout containers. The validator flags raw flex divs.
- Use `<Typography>` instead of raw `<p>`, `<h1>`–`<h6>` tags.
- Use `cn()` from `@/lib/utils` for conditional class merging. Never use template literals or string concatenation for className.

## UI Patterns

See [docs/design/PATTERNS.md](./docs/design/PATTERNS.md) for component usage patterns ("do this, not that").

Quick reference:

| Instead of | Use |
|------------|-----|
| `<div className="flex">` | `<Flex>` |
| `<span className="...">` | `<MetadataItem>`, `<Badge>`, or plain text |
| Manual `•` separators | `<Metadata>` (auto-separates) |
| `<span>{date}</span>` | `<MetadataTimestamp>` |
| Emoji icons | `<Icon icon={...}>` |
| `<span className="text-sm">` | `<Typography variant="small">` |
| `<div className="font-medium">` | `<Typography variant="label">` |

## Design Tokens (Tailwind v4)

This project uses **Tailwind CSS v4** with a `@theme` block in `src/index.css` — not a `tailwind.config.js` for theming. All design tokens are CSS custom properties.

**Color system:** Two-tier architecture.
- **Tier 1** (`:root`): Raw color primitives (`--p-indigo-500`, `--p-gray-200`, etc.). Never use directly in components.
- **Tier 2** (`@theme`): Semantic tokens (`--color-ui-bg`, `--color-brand`, `--color-status-error`, etc.) using `light-dark()` for automatic dark mode. Use these via Tailwind classes: `bg-ui-bg`, `text-brand`, `border-status-error`.

**Non-color tokens in `@theme`:** blur (`blur-glow`), z-index (`z-toast-critical`), text sizes (`text-caption`), spacing, radius, scale. Check `src/index.css` before adding arbitrary values. For panel/modal heights, use Tailwind arbitrary values inline (e.g., `max-h-[80vh]`).

**Rule:** Never use arbitrary bracket syntax (`w-[Npx]`, `max-h-[Xvh]`) for values used in more than one place. Define a token in the `@theme` block instead. The validator will flag violations.

## Convex Patterns

```typescript
// Query
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Check permissions, return data
  },
});

// Mutation
export const update = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Validate, update, log activity
  },
});
```

**Auth:** Always use `getAuthUserId(ctx)`, check `if (!userId)`, throw for unauthorized.

**RBAC:** Roles are admin > editor > viewer. Use `convex/rbac.ts` utilities.

## Scripts

```bash
pnpm dev              # Start frontend + backend
pnpm run check        # Typecheck + lint + validate + tests (full CI check)
pnpm run fixme        # Auto-fix lint/format + typecheck (run after big changes)
pnpm run biome        # Lint with auto-fix
pnpm run typecheck    # TypeScript check
pnpm run validate     # Custom validators (colors, arbitrary TW, standards, etc.)
pnpm run test         # Vitest unit tests
pnpm e2e:ui           # E2E tests (interactive, Playwright)
```

### AI: When to run `pnpm fixme`

Run `pnpm fixme` after completing a significant chunk of work (new feature, multi-file refactor, major bug fix). Do NOT run it after every small edit — only when a logical unit of work is done and you're ready to validate.

### AI: Custom validator

Run `node scripts/validate.js` to check for:
1. **Standards** — raw HTML tags, flex divs, className concat, raw TW colors, shorthands
2. **Color audit** — hardcoded hex/rgb, non-semantic color usage
3. **API calls** — validates api.X.Y calls match Convex exports
4. **Query issues** — N+1 queries, unbounded `.collect()`, missing indexes
5. **Arbitrary Tailwind** — flags bracket syntax; allowlist in `ALLOWED_PATTERNS`
6. **Undefined TW colors** — classes referencing colors not in the theme

Run this after UI changes. Target: 0 errors.

## Deployment

- **Backend:** `pnpm convex deploy`
- **Frontend:** Vercel with `npx convex deploy --cmd 'pnpm run build'`
- **Dashboard:** https://dashboard.convex.dev/d/peaceful-salmon-964

## Key Patterns

- **Real-time:** ProseMirror Sync for docs, Convex Presence for users
- **Queries:** Always use indexes (`.withIndex()`), reactive with `useQuery`
- **Errors:** Use `showError(error, "Context")`, `ErrorBoundary` components

## E2E Testing Rules

**NEVER use hardcoded timeouts** (`page.waitForTimeout()`, `setTimeout`, etc.) in E2E tests. Hardcoded waits:
- Hide real performance issues and inefficiencies
- Make tests flaky (too short = failures, too long = slow CI)
- Don't adapt to varying system load

**Instead, use Playwright's built-in waiting mechanisms:**
```typescript
// ✅ CORRECT - Wait for specific conditions
await expect(element).toBeVisible();
await expect(page).toHaveURL(/\/dashboard/);
await page.waitForLoadState("domcontentloaded");
await element.waitFor({ state: "visible" });

// ✅ CORRECT - Retry logic for flaky UI transitions
await expect(async () => {
  await button.click();
  await expect(result).toBeVisible();
}).toPass({ intervals: [500, 1000, 2000] });

// ❌ WRONG - Hardcoded delays
await page.waitForTimeout(1000);
await new Promise(resolve => setTimeout(resolve, 500));
```

**Use `expect().toPass()` for retry logic** when an action may need multiple attempts (e.g., clicking a button that triggers a React state transition). The intervals provide built-in waits between retries.

If a test needs a timeout to pass, the underlying code likely has a performance or loading state issue that should be fixed.

## Resources

- [Convex Best Practices](./docs/CONVEX_BEST_PRACTICES.md)
- [Testing Guide](./docs/testing/README.md)
- [Pagination Patterns](./docs/PAGINATION_PATTERNS.md)
- [Email System](./docs/email/README.md)
- [AI Features](./docs/ai/README.md)

---

**Convex Deployment:** peaceful-salmon-964 | **Node:** 18+ | **Package Manager:** pnpm
