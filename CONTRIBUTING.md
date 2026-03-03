# Contributing to Nixelo

Thanks for your interest in contributing! This guide will help you get started.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/nixelo.git
cd nixelo

# Install dependencies
pnpm install

# Start development
pnpm run dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Frontend code goes in `src/`
- Backend code goes in `convex/`
- Follow existing patterns in the codebase

### 3. Test Your Changes

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run biome

# Frontend tests
pnpm test

# Backend tests
pnpm test:backend

# Run all checks
pnpm run check
```

### 4. Commit

Write clear commit messages:

```
feat: add dark mode toggle
fix: resolve issue card drag bug
docs: update setup instructions
refactor: simplify auth flow
```

### 5. Submit a Pull Request

- Fill out the PR template
- Link related issues
- Add screenshots for UI changes

## Project Structure

```
nixelo/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities
├── convex/              # Backend (Convex functions)
│   ├── schema.ts        # Database schema
│   ├── *.ts             # API functions
│   └── *.test.ts        # Backend tests
└── docs/                # Documentation
```

## Code Style

- **TypeScript** - Use strict types, avoid `any`
- **React** - Functional components with hooks
- **Tailwind** - Use utility classes, avoid custom CSS
- **Convex** - Use validators (`v.string()`, etc.)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `IssueCard.tsx` |
| Hooks | camelCase with `use` | `useProjects.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Convex functions | camelCase | `createIssue` |

### File Organization

- One component per file
- Keep components under 200 lines
- Extract reusable logic to hooks
- Use `@/` import alias for `src/`

## Backend Guidelines

### Convex Functions

```typescript
// Always authenticate
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");

// Always validate permissions
await assertIsProjectAdmin(ctx, projectId, userId);

// Use validators
args: {
  title: v.string(),
  projectId: v.id("projects"),
}
```

### Database

- Add indexes for query patterns
- Use `v.optional()` for nullable fields
- Document schema changes

## Testing

### Frontend Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Component", () => {
  it("should render", () => {
    render(<Component />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Backend Tests

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";

describe("function", () => {
  it("should work", async () => {
    const t = convexTest(schema);
    const result = await t.mutation(api.module.function, { args });
    expect(result).toBeDefined();
  });
});
```

## Areas for Contribution

### Good First Issues

Look for issues labeled `good first issue` - these are great for getting started.

Maintainer criteria for applying `good first issue`:

- Clear reproduction context and acceptance criteria exist in the issue body.
- Scope is realistically completable in one focused session.
- Required files/areas are already identified.
- A maintainer is available to review quickly.

When adding a starter issue, also add `help wanted`.

### Feature Ideas

- Slack integration
- GitHub issue sync
- Document version history
- Advanced search filters
- Mobile app (React Native)

### Documentation

- Improve setup guides
- Add code examples
- Translate to other languages

## Getting Help

- Open an issue for bugs or questions using the GitHub templates
- Use GitHub Discussions for product ideas and Q&A when enabled
- Tag maintainers in PRs for review

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

Thank you for contributing!
