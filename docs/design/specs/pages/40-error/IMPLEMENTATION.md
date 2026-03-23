# Error Page - Implementation

> **Component file**: `src/components/ErrorBoundary.tsx`

## Architecture

- React class component (error boundaries require `componentDidCatch`)
- Wraps the entire app in `__root.tsx`
- Also used at component level for isolated error containment

## Props

| Prop | Type | Description |
|------|------|-------------|
| fallback | ReactNode | Optional custom fallback UI |
| onError | (error, errorInfo) => void | Optional error callback for logging |

## Error Display

- `IconCircle` with error variant
- Typography `h1` showing "500"
- Collapsible `<details>` with `error.message` and `error.stack`
- Button to `window.location.reload()`
