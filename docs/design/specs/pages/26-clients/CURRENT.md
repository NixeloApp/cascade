# Clients Page - Current State

> **Route**: `/:orgSlug/clients`
> **Status**: IMPLEMENTED
> **Last Updated**: 2026-03-22

---

## Purpose

The clients page manages billing contacts for agency-style organizations and provides client portal access controls. It answers:

- Who are the organization's billing clients?
- What is each client's email, company, and hourly rate?
- How do I generate a portal link for a client?
- What portal tokens exist for each client, and how do I revoke them?

---

## Route Anatomy

```
/:orgSlug/clients
│
├── PageLayout
│   ├── PageHeader
│   │   ├── title = "Clients"
│   │   └── description = "Manage billing contacts and default rates."
│   │
│   └── Stack (gap="md")
│       ├── Card ("New Client" form)
│       │   ├── CardHeader → CardTitle ("New Client")
│       │   └── CardContent
│       │       ├── Grid (1 col, 4 cols on lg) — Input fields
│       │       │   ├── Input (Client name)
│       │       │   ├── Input (Email)
│       │       │   ├── Input (Company)
│       │       │   └── Input (Hourly rate, type=number)
│       │       └── Button ("Create client")
│       │
│       ├── [empty state] EmptyState (when no clients)
│       │   ├── icon = Users
│       │   └── title = "No clients yet"
│       │
│       └── [list state] Grid (1 col, 2 cols on lg)
│           └── ClientCard[] (per client)
│               ├── CardHeader → CardTitle (client name)
│               └── CardContent
│                   ├── Typography (email)
│                   ├── Typography (company, conditional)
│                   ├── Typography (hourly rate)
│                   ├── Button ("Generate portal link")
│                   ├── Button ("Refresh tokens")
│                   ├── Typography (generated portal link, conditional)
│                   └── PortalTokenDetails[] (per token)
│                       ├── Typography (token ID, status, updated, last accessed, expires)
│                       └── Button ("Revoke token", conditional on active)
```

---

## Current Composition Walkthrough

1. **Route component**: `ClientsListPage` is a 310-line file that contains the full page plus two inline components: `ClientCard` and `PortalTokenDetails`.
2. **Queries**: Fetches `api.clients.list` for the client list and `api.projects.getCurrentUserProjects` to scope portal token generation to a project.
3. **Create form**: An inline form at the top of the page with four input fields (name, email, company, hourly rate) and a "Create client" button. Form state is managed with individual `useState` hooks. Fields reset on success.
4. **Portal link generation**: `handleGeneratePortalLink` calls `clientPortalApi.generateToken` with permissions scoped to the first matching project. The generated link is stored in local state (`generatedPortalLinks` map).
5. **Token management**: `handleRefreshPortalTokens` calls `clientPortalApi.listTokensByClient` and stores results in local state. `handleRevokePortalToken` revokes a specific token and refreshes the list.
6. **anyApi usage**: Portal API calls use `anyApi.clientPortal` because the `clientPortal` module may not be in the standard generated API.
7. **Loading gate**: While `clients` is falsy, renders `<PageContent isLoading>`.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The entire page (310 lines) is in one file with inline sub-components (`ClientCard`, `PortalTokenDetails`) -- should be extracted | architecture | MEDIUM |
| ~~2~~ | ~~Create form mixed with list~~ **Fixed** — moved to Dialog modal with Cancel/Create buttons, "+ New Client" button in header and empty state | ~~UX~~ | ~~MEDIUM~~ |
| ~~3~~ | ~~Portal token uses untyped anyApi~~ **Fixed** — replaced `useMutation(anyApi.clientPortal.*)` with typed `useAuthenticatedMutation(api.clientPortal.*)` | ~~type safety~~ | ~~MEDIUM~~ |
| 4 | Token details display raw token IDs to the user, which is not meaningful information | UX | LOW |
| ~~5~~ | ~~Portal link grabs first project~~ **Fixed** — each client card has a project selector dropdown; user explicitly chooses which project to scope the portal link to | ~~correctness~~ | ~~HIGH~~ |
| 6 | Hourly rate input defaults to "0" string and uses `Number.parseFloat` -- edge cases with empty or invalid input | robustness | LOW |
| 7 | No search or filter functionality for the client list | scalability | LOW |
| 8 | No pagination -- all clients load at once | scalability | MEDIUM |
| 9 | Portal token state is managed locally (not reactive) -- tokens won't update if changed elsewhere | reactivity | MEDIUM |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/clients/index.tsx` | Route component with inline ClientCard and PortalTokenDetails (310 lines) |
| `convex/clients.ts` | Client CRUD (create, list, update, delete) |
| `convex/clientPortal.ts` | Portal token management (generateToken, listTokensByClient, revokeToken) |
| `convex/projects.ts` | `getCurrentUserProjects` (used to scope portal tokens) |
