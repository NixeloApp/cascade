# Clients Page - Implementation

> **Route**: `/:orgSlug/clients`

---

## Queries

| Query | Source | Args | Purpose |
|-------|--------|------|---------|
| `api.clients.list` | `convex/clients.ts` | `{ organizationId }` | Fetch all clients in the organization |
| `api.projects.getCurrentUserProjects` | `convex/projects.ts` | `{}` | Fetch user's projects (used to scope portal token generation) |

---

## Mutations

| Mutation | Source | Args | Purpose |
|----------|--------|------|---------|
| `api.clients.create` | `convex/clients.ts` | `{ organizationId, name, email, company?, hourlyRate? }` | Create a new client |
| `clientPortalApi.generateToken` | `convex/clientPortal.ts` | `{ organizationId, clientId, projectIds, permissions }` | Generate a portal access token for a client |
| `clientPortalApi.listTokensByClient` | `convex/clientPortal.ts` | `{ organizationId, clientId }` | List all portal tokens for a client (used imperatively, not reactively) |
| `clientPortalApi.revokeToken` | `convex/clientPortal.ts` | `{ organizationId, tokenId }` | Revoke a specific portal token |

### Portal Permissions Shape

```typescript
{
  viewIssues: boolean;
  viewDocuments: boolean;
  viewTimeline: boolean;
  addComments: boolean;
}
```

---

## State Management

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `name` | `string` | `useState` | New client form: name field |
| `email` | `string` | `useState` | New client form: email field |
| `company` | `string` | `useState` | New client form: company field |
| `hourlyRate` | `string` | `useState` | New client form: hourly rate (stored as string for input binding) |
| `generatedPortalLinks` | `Record<string, string>` | `useState` | Map of clientId -> generated portal path |
| `portalTokensByClient` | `Record<string, ClientPortalTokenRow[]>` | `useState` | Map of clientId -> token list (populated on demand) |

---

## Component Tree

```
ClientsListPage (route)
├── PageLayout
│   ├── PageHeader
│   └── Stack
│       ├── Card ("New Client" form)
│       │   ├── CardHeader → CardTitle
│       │   └── CardContent → Stack
│       │       ├── Grid (4-col on lg)
│       │       │   ├── Input (name)
│       │       │   ├── Input (email)
│       │       │   ├── Input (company)
│       │       │   └── Input (hourly rate)
│       │       └── Button ("Create client")
│       │
│       ├── [branch: empty]
│       │   └── EmptyState (icon: Users)
│       │
│       └── [branch: populated]
│           └── Grid (2-col on lg)
│               └── ClientCard[] (inline component)
│                   ├── Card
│                   │   ├── CardHeader → CardTitle (client.name)
│                   │   └── CardContent → Stack
│                   │       ├── Typography (email)
│                   │       ├── Typography (company, conditional)
│                   │       ├── Typography (hourly rate)
│                   │       ├── Flex (action buttons)
│                   │       │   ├── Button ("Generate portal link")
│                   │       │   └── Button ("Refresh tokens")
│                   │       ├── Typography (portal link, conditional)
│                   │       └── PortalTokenDetails[] (inline component)
│                   │           ├── Typography (token ID)
│                   │           ├── Typography (status)
│                   │           ├── Typography (updated, last accessed, expires)
│                   │           └── Button ("Revoke token", conditional)
```

---

## Permissions

- **Authentication**: Required. Route is under `_auth` layout guard.
- **Organization membership**: Required. `clients.list` is an `organizationQuery`.
- **Create client**: `clients.create` uses `organizationAdminMutation` -- only admins can create clients.
- **Portal token management**: `generateToken`, `listTokensByClient`, and `revokeToken` in `clientPortal.ts` require org admin role via `organizationAdminMutation`.
- **View projects**: `getCurrentUserProjects` returns only projects the user is a member of.

---

## Data Flow

1. Route mounts, queries `clients.list` and `projects.getCurrentUserProjects` in parallel.
2. User fills in the "New Client" form and clicks "Create client" -> `clients.create` mutation -> toast -> reactive list update -> form fields reset.
3. User clicks "Generate portal link" on a client card -> `generateToken` mutation scoped to first available project -> portal link stored in local state and displayed.
4. User clicks "Refresh tokens" -> imperative `listTokensByClient` call -> results stored in local state and displayed.
5. User clicks "Revoke token" -> `revokeToken` mutation -> token list refreshed automatically.
