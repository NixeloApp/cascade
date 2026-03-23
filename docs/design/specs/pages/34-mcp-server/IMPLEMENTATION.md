# MCP Server Page - Implementation

> **Route**: `/:slug/mcp-server`

---

## Queries

None. The page is a static placeholder with no data fetching.

---

## Mutations

None.

---

## State

None. No `useState`, no URL search params, no context.

---

## Component Tree

```text
McpServerPage
├── PageLayout
│   ├── PageHeader  title="MCP Server"
│   └── EmptyState  icon={Server}
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- No role-based gating -- all authenticated org members see the placeholder.
