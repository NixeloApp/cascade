# Client Portal - Current State

> **Routes**: `/portal/$token` and `/portal/$token/projects/$projectId`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-28

---

## Purpose

The client portal is the public, magic-link route pair for external stakeholders. It answers:

1. Which projects are visible through this token?
2. Which issues are visible inside a shared project?
3. Is the token still valid and scoped to the expected client context?

This is intentionally a narrow read-only surface. It is not a full external workspace.

---

## Permissions & Access

- No app authentication is required; access is controlled entirely by the portal token.
- Tokens must be 64-character hex strings and must not be revoked or expired.
- Validation is rate-limited by requester and token prefix to make brute-force probing harder.
- Portal tokens can only reference projects in one organization and cannot include deleted
  projects.
- The backend permission bundle supports `viewIssues`, `viewDocuments`, `viewTimeline`, and
  `addComments`, but the current UI only renders project listing, issue listing, and simple portal
  timeline entries.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional reviewed states

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|--------------|---------------|--------------|--------------|
| Project detail route | `desktop-dark-project.png` | `desktop-light-project.png` | `tablet-light-project.png` | `mobile-light-project.png` |

---

## Primary Flow

1. An admin generates a portal token from the authenticated clients workspace.
2. The external recipient opens `/portal/$token`.
3. The entry route validates the token, resolves the client name, and lists the visible projects.
4. The recipient opens a project card to reach `/portal/$token/projects/$projectId`.
5. The project route lists the visible issues for that project and renders a simple activity
   timeline entry.

---

## Alternate / Failure Flows

- If token validation fails or the token no longer resolves to visible projects, the entry route
  still renders the shared portal shell and shows `No projects are available for this portal token.`
- The client-name subtitle falls back to `Read-only project access via secure magic link` until the
  validation mutation succeeds.
- The project route renders `No visible issues for this project.` when the scoped issue query
  returns nothing.
- There is no dedicated invalid-token illustration or expired-token route branch yet; the current
  product falls back to the generic empty-project message.

---

## Empty / Loading / Error States

- The entry page renders before client-name validation resolves; the subtitle updates once the
  validation mutation completes.
- `getProjectsForToken` and `getIssuesForToken` return empty arrays rather than throwing public
  errors, so the public UI resolves into empty-state cards instead of route-level error pages.
- The screenshot harness waits for either the portal timeline entry or the empty-project message so
  captures do not race the async token validation path.

---

## Current Composition

### 1. Entry route

- `src/routes/portal.$token.tsx`
- Validates the token in a `useEffect`.
- Lists portal-visible projects via `getProjectsForToken`.
- Renders `PortalHeader`, `PortalProjectView`, and a minimal `PortalTimeline`.

### 2. Project route

- `src/routes/portal.$token.projects.$projectId.tsx`
- Reads the project-scoped issue list with `getIssuesForToken`.
- Renders a simple issue list plus `PortalTimeline`.

### 3. Shared UI

- `PortalHeader` owns the consistent title/subtitle shell.
- `PortalProjectView` renders the linked project card used from the entry route.
- `ClientPortalPage` in Playwright owns readiness checks for both public portal captures.

---

## Source Map

| File | Purpose |
|------|---------|
| `src/routes/portal.$token.tsx` | Public client-portal entry route |
| `src/routes/portal.$token.projects.$projectId.tsx` | Public project-detail route |
| `src/components/ClientPortal/PortalHeader.tsx` | Shared client-portal heading |
| `src/components/ClientPortal/PortalProjectView.tsx` | Linked project card from entry route |
| `src/components/ClientPortal/PortalTimeline.tsx` | Lightweight activity timeline |
| `convex/clientPortal.ts` | Token generation, validation, project scope, and issue scope |
| `convex/clientPortal.test.ts` | Token lifecycle, scope, expiry, and organization-boundary coverage |
| `e2e/pages/client-portal.page.ts` | Public portal readiness logic |
| `e2e/screenshot-lib/public-pages.ts` | Canonical portal and portal-project screenshot capture |

---

## Acceptance Criteria

- The public entry route and project-detail route are both documented in one place.
- Token validity, scope, and public-sharing limits are explicit.
- Canonical entry screenshots and reviewed project-detail screenshots are linked by filename.
- Empty and invalid-token behavior is described without requiring direct source inspection.

---

## Known Gaps

- The UI does not yet surface dedicated revoked or expired token messaging.
- The permission bundle is broader than the current UI surface; documents, richer timeline views,
  and external comments are not implemented yet.
- The project-detail header currently shows the raw `projectId` in the subtitle instead of resolved
  project metadata.
