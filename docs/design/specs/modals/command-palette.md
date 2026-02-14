# Command Palette

> **Component**: `CommandPalette.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 257

---

## Current State

The Command Palette (⌘K) is **well-implemented** using cmdk library.

### Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Type a command or search...                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Navigation                                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🏠 Go to Dashboard         View your personal dashboard                   │
│  📄 Go to Documents         View all documents                             │
│  📁 Go to Workspaces        View all workspaces                            │
│                                                                             │
│  Projects                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📊 Project Alpha           Go to Project Alpha board                      │
│  📊 Project Beta            Go to Project Beta board                       │
│                                                                             │
│  Create                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ➕ Create Issue            Create a new issue                             │
│  📄 Create Document         Create a new document                          │
│  📁 Create Project          Create a new project                           │
│                                                                             │
│  Recent Issues                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🐛 Fix login bug           PROJ-123 • Project Alpha                       │
│  ✨ Add dark mode           PROJ-124 • Project Alpha                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ↑↓ Navigate    ↵ Select    Esc Close                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Search | cmdk built-in with custom filter function |
| Grouping | Commands organized by type (Navigation, Projects, Create, Recent) |
| Keywords | Extended search via keywords array |
| Icons | Uses Icon component with Lucide icons |
| Keyboard hints | Footer shows navigation shortcuts |
| Test ID | Has data-testid for E2E testing |

---

## Component Architecture

```tsx
interface CommandAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  keywords?: string[];
  action: () => void;
  group?: string;
}

// Hook to build commands dynamically
export function useCommands({
  onCreateIssue,
  onCreateDocument,
  onCreateProject,
}: { ... }) {
  // Returns CommandAction[]
}
```

---

## Dynamic Commands

The `useCommands` hook builds commands from:
1. **Static navigation** - Dashboard, Documents, Workspaces
2. **User's projects** - From `api.dashboard.getMyProjects`
3. **Create actions** - If callbacks provided
4. **Recent issues** - From `api.dashboard.getMyIssues` (last 5)

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | No command for settings/preferences | LOW |
| 2 | No command for theme toggle | LOW |
| 3 | Recent issues go to board, not issue detail | LOW |

---

## Recommendations

### 1. Add More Commands

```typescript
// Theme toggle
{
  id: "toggle-theme",
  label: "Toggle Theme",
  icon: Moon,
  description: "Switch between light and dark mode",
  keywords: ["dark", "light", "mode", "theme"],
  action: () => toggleTheme(),
  group: "Settings",
},

// Settings
{
  id: "nav-settings",
  label: "Go to Settings",
  icon: Settings,
  description: "Manage your preferences",
  action: () => navigate({ to: ROUTES.settings.path }),
  group: "Navigation",
},
```

### 2. Fix Recent Issues Navigation

Navigate to issue detail instead of board:
```typescript
action: () => {
  navigate({
    to: ROUTES.issues.detail.path,
    params: { orgSlug, key: issue.key },
  });
},
```

---

## Verdict

**KEEP AS-IS** - Well-implemented command palette. Only minor enhancements possible.

---

## Checklist

- [x] Uses CommandDialog properly
- [x] Has search input with placeholder
- [x] Groups commands logically
- [x] Shows keyboard hints
- [x] Custom filter function
- [x] Dynamic commands from hooks
- [x] Proper close handling
- [x] Uses Icon component
- [x] Has test ID
- [x] No slop patterns
