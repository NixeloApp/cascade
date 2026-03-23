# Error Page - Implementation

> **Component**: `src/components/ErrorBoundary.tsx`

---

## Queries

None. The error boundary is a pure React component with no data fetching.

---

## Mutations

None.

---

## State

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `hasError` | `boolean` | `false` | Whether an error has been caught |
| `error` | `Error \| null` | `null` | The caught error object (for details display) |

State is managed via React class component `this.state`, not hooks.

---

## Props

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `children` | `ReactNode` | Yes | The component tree to protect |
| `fallback` | `ReactNode` | No | Custom fallback UI (replaces default 500 card) |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | No | Callback for external error logging |

---

## Lifecycle Methods

| Method | Purpose |
|--------|---------|
| `getDerivedStateFromError(error)` | Static -- sets `hasError: true` and stores the error |
| `componentDidCatch(error, errorInfo)` | Instance -- logs to console and calls `onError` prop |

---

## Component Tree

```text
ErrorBoundary (class component)
├── [hasError === false]  {children}  (transparent passthrough)
├── [hasError === true, fallback provided]  {fallback}
└── [hasError === true, no fallback]
    └── Flex (min-h-screen, centered, bg-ui-bg, animate-fade-in)
        └── Card (variant="flat", padding="lg", max-w-md)
            └── Stack (align="center", gap="lg")
                ├── IconCircle (size="xl", variant="error")
                │   └── AlertTriangle (size-10, text-status-error)
                ├── Typography (variant="errorCodeDisplay")  "500"
                ├── Stack (gap="sm", align="center")
                │   ├── Typography (variant="large")  "Something went wrong"
                │   └── Typography (color="tertiary")  "We encountered..."
                ├── <details>  (if error exists)
                │   ├── <summary>  "View error details"
                │   └── <div>  (bg-ui-bg-soft, max-h-40, overflow-auto)
                │       └── <pre>  error.message
                └── Button (size="lg")  "Reload page"
```

---

## Integration Points

| Location | Usage |
|----------|-------|
| `src/routes/__root.tsx` | Wraps the main `<Outlet />` inside `<ErrorBoundary>` -- catches all route-level crashes |
| Component-level | Can wrap individual components for isolated error containment |

---

## Permissions

None. The error boundary operates regardless of authentication state since
it needs to function even when auth-related code crashes.
