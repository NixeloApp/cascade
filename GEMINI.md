# GEMINI.md - Antigravity Agent Instructions for Nixelo

This file provides persistent context for Antigravity agents working on the Nixelo codebase. It is automatically read by Gemini-based agents.

## Critical Rules

### 1. Read Project Documentation First

**BEFORE making any code changes**, you MUST:

1. Read `AGENTS.md` for project conventions
2. Read `CLAUDE.md` for comprehensive architecture details
3. Understand the existing patterns in the codebase

### 2. Styling System

**NEVER use inline `var()` styles or hardcoded hex colors.**

✅ **CORRECT - Use Tailwind utility classes with semantic tokens:**

```tsx
// Most semantic tokens adapt automatically via the theme
<div className="bg-ui-bg-primary text-ui-text-primary border-ui-border-primary">
```

❌ **WRONG - Do NOT use redundant dark mode variants for semantic tokens:**

```tsx
// DO NOT DO THIS anymore:
<div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark">
```

**Why?** The codebase has been refactored to use an automatic variable swap pattern in `index.css`. Semantic tokens like `bg-ui-bg-primary` automatically update their values when the `.dark` class is present.

**Exceptions:** Non-semantic colors (like specific brand shades) still require explicit `dark:` variants if you need to switch shades (e.g., `bg-brand-600 dark:bg-brand-500`).

### 3. Semantic Token Usage

When choosing color tokens, use **semantically appropriate** variables:

- **UI Backgrounds:** `bg-ui-bg-primary`, `bg-ui-bg-secondary`, `bg-ui-bg-tertiary`
- **UI Text:** `text-ui-text-primary`, `text-ui-text-secondary`, `text-ui-text-tertiary`
- **UI Borders:** `border-ui-border-primary`, `border-ui-border-secondary`
- **Status Colors:** `bg-status-success`, `bg-status-error`, `bg-status-warning`, `bg-status-info`
- **Brand Colors:** `bg-brand-500`, `bg-brand-600` (for primary actions)
- **Accent Colors:** `bg-accent-500`, `bg-accent-600` (for secondary highlights)

❌ **NEVER use priority tokens for non-priority UI:**

```tsx
// WRONG - priority tokens are for issue priority badges only
color: "var(--color-priority-lowest)";
```

✅ **Use the right semantic token:**

```tsx
// CORRECT - use UI text tokens for general text
className = "text-ui-text-tertiary dark:text-ui-text-tertiary-dark";
```

### 4. Route Constants

**ALWAYS use centralized route constants from `src/config/routes.ts`.**

✅ **CORRECT:**

```tsx
import { ROUTES } from "@/config/routes";
<Link to={ROUTES.dashboard(orgSlug)}>Dashboard</Link>;
```

❌ **WRONG:**

```tsx
<Link to={`/${slug}/dashboard`}>Dashboard</Link>
```

### 5. Component Library

**Use the existing UI component library** (`src/components/ui/`) instead of raw HTML:

- Use `<Button>` instead of `<button>`
- Use `<Flex>` instead of `<div className="flex">`
- Use `<Typography>` instead of `<h1>`, `<p>`, etc.
- Use `<Input>`, `<Textarea>`, `<Select>` for forms

### 6. TypeScript Strictness

- **NO `any` types** - use proper TypeScript types
- Use Convex's generated types from `convex/_generated/dataModel`
- Use `v` validators for runtime type safety in Convex functions

### 7. Testing Requirements

**New logic requires new tests:**

- Unit tests for utilities/hooks (Vitest)
- Component tests (React Testing Library)
- E2E tests for critical flows (Playwright)

Run `pnpm run static` before committing.

## Common Mistakes to Avoid

1. ❌ Using `var()` in inline styles instead of Tailwind classes
2. ❌ Hardcoding hex colors like `#3b82f6`
3. ❌ Using wrong semantic tokens (e.g., priority colors for UI elements)
4. ❌ Hardcoding URL paths instead of using `ROUTES.*` constants
5. ❌ Using raw HTML elements instead of UI component library
6. ❌ Skipping documentation review before making changes
7. ❌ Using arbitrary Tailwind values like `h-[50px]` instead of standard tokens

## When in Doubt

1. **Check existing code** - grep for similar patterns
2. **Read the docs** - `AGENTS.md` and `CLAUDE.md` have the answers
3. **Ask the user** - don't assume, clarify requirements

## Project Tech Stack Summary

- **Frontend:** React 19 + Vite + TanStack Router
- **Backend:** Convex (serverless, real-time)
- **Styling:** Tailwind CSS v4 with semantic tokens
- **Language:** Strict TypeScript
- **Tooling:** Biome (lint/format), Vitest (tests), Playwright (E2E)
- **Package Manager:** pnpm

---

**Remember:** This project has established patterns. Your job is to follow them, not reinvent them.
