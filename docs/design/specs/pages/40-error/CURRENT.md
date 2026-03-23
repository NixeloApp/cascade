# Error Page - Current State

> **Component**: `src/components/ErrorBoundary.tsx`
> **Last Updated**: 2026-03-23

## Purpose

React error boundary that catches render-time crashes and shows a recovery UI instead of a blank screen.

## Layout

- Centered card with error icon (IconCircle, error variant)
- Large "500" heading
- "Something went wrong" message
- Collapsible error details (expandable `<details>` with stack trace)
- "Reload page" button

## States

- **Error caught**: full error card with details
- **Custom fallback**: optional `fallback` prop for component-level boundaries
- **No error**: renders children normally (transparent wrapper)
