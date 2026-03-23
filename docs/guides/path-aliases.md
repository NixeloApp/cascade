# Path Aliases

This document explains the configured import path aliases and best practices.

## Configured Aliases

We have two path aliases configured in both `tsconfig.app.json` and `vite.config.ts`:

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@/*` | `./src/*` | Frontend code (components, routes, utils) |
| `@convex/*` | `./convex/*` | Backend Convex functions and types |

## Usage Examples

### ✅ Good - Using Aliases

```typescript
// Frontend imports
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

// Backend imports (from frontend)
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// Backend imports (within convex/ directory)
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
```

### ❌ Bad - Relative Imports

```typescript
// DON'T DO THIS (11 levels deep!)
import { api } from "../../../../../../../../../../convex/_generated/api";

// Use this instead:
import { api } from "@convex/_generated/api";
```

```typescript
// DON'T DO THIS
import { Button } from "../../../components/ui/Button";

// Use this instead:
import { Button } from "@/components/ui/Button";
```

## Special Cases

### Convex Generated Types

Always use the `@convex` alias for generated types:

```typescript
import { api } from "@convex/_generated/api";
import type { Id, Doc } from "@convex/_generated/dataModel";
```

### Within Convex Directory

When you're already inside `convex/`, you can use relative imports for sibling files:

```typescript
// In convex/projects.ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server"; // Relative is OK here
import { assertMinimumRole } from "./rbac"; // Relative is OK here
```

But for cross-directory imports within convex, prefer absolute:

```typescript
// In convex/projects/analytics.ts
import { getUserRole } from "@convex/rbac"; // Better than ../rbac
```

## Configuration

### TypeScript (`tsconfig.app.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@convex/*": ["./convex/*"]
    }
  }
}
```

### Vite (`vite.config.ts`)

```typescript
{
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    }
  }
}
```

## Benefits

1. **No Deep Nesting**: Avoid `../../../..` hell
2. **Refactor-Safe**: Move files without breaking imports
3. **IDE Support**: Better autocomplete and go-to-definition
4. **Consistent**: Same import path from anywhere in the project
5. **Readable**: Clear distinction between local and external imports

## Migration

To migrate existing relative imports to aliases:

```bash
# Find files with deep relative imports
rg "from ['\"](\.\./){3,}" --type ts --type tsx

# Manual replacement (be careful with generated files)
# Replace patterns like:
#   from "../../../components/ui/Button"
# With:
#   from "@/components/ui/Button"
```

## Linting

Biome is configured to organize imports automatically. It will group:
1. External packages (react, convex, etc.)
2. `@/` imports (frontend code)
3. `@convex/` imports (backend code)
4. Relative imports (siblings)

Run `pnpm biome` to auto-organize imports.

---

**Last Updated:** 2025-12-17
