# Client Portal - Implementation Notes

## Route Map

| Route | File | Purpose |
|------|------|---------|
| `/portal/$token` | `src/routes/portal.$token.tsx` | Public entry route that validates the token and lists visible projects |
| `/portal/$token/projects/$projectId` | `src/routes/portal.$token.projects.$projectId.tsx` | Public project-detail route that lists visible issues |

## Backend Contracts

| Function | File | Purpose |
|----------|------|---------|
| `generateToken` | `convex/clientPortal.ts` | Creates a scoped portal token for one client and one-or-more projects |
| `validateToken` | `convex/clientPortal.ts` | Public validation mutation with rate limiting and last-access updates |
| `getProjectsForToken` | `convex/clientPortal.ts` | Public query for visible projects |
| `getIssuesForToken` | `convex/clientPortal.ts` | Public query for visible issues in one shared project |

## Supporting UI

| Component | File | Purpose |
|-----------|------|---------|
| `PortalHeader` | `src/components/ClientPortal/PortalHeader.tsx` | Shared public portal header |
| `PortalProjectView` | `src/components/ClientPortal/PortalProjectView.tsx` | Project card with project-route link |
| `PortalTimeline` | `src/components/ClientPortal/PortalTimeline.tsx` | Minimal public activity timeline |

## Verification Sources

- `convex/clientPortal.test.ts`
- `src/components/ClientPortal/PortalProjectView.test.tsx`
- `e2e/pages/client-portal.page.ts`
- `e2e/screenshot-lib/public-pages.ts`
