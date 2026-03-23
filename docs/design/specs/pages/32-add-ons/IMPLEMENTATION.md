# Add-ons Page - Implementation

> **Route**: `/:slug/add-ons`

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
AddOnsPage
├── PageLayout
│   ├── PageHeader  title="Add-ons"
│   └── EmptyState  icon={Puzzle}
```

---

## Permissions

- Requires authentication (route is under `_auth` layout).
- Requires organization membership (route is under `_app/$orgSlug` layout).
- No role-based gating -- all authenticated org members see the placeholder.
