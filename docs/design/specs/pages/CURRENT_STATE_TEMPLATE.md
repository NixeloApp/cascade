# Current-State Feature Doc Template

Use this template for `CURRENT.md` files that describe what the product does today.

## Required Sections

### Header

```md
# Surface Name - Current State

> **Route**: `...`
> **Status**: REVIEWED | IMPLEMENTED | IN PROGRESS
> **Last Updated**: YYYY-MM-DD
```

### Purpose

- User goals the route answers.
- Scope boundaries.
- Whether the surface is read-only, editable, public, admin-only, or scoped to a project.

### Permissions & Access

- Role or token requirements.
- Redirect or denial behavior.
- Public-sharing limits, if applicable.

### Screenshot Matrix

- Canonical route captures by viewport/theme.
- Additional reviewed states with the exact screenshot filenames that are considered canonical for
  those branches.

### Primary Flow

- The default happy path from route load to the main action or insight.

### Alternate / Failure Flows

- Setup vs connected branches.
- Destructive flows.
- Permission-denied, revoked, expired, or empty filtered branches.
- Branches currently validated by tests but not yet in screenshots.

### Empty / Loading / Error States

- What renders while queries are unresolved.
- What the user sees when no data exists.
- What the route shows when the resource is missing or inaccessible.

### Current Composition

- Route wrapper.
- Major components.
- Backend functions or queries.
- E2E or screenshot harness entry points when relevant.

### Source Map

- Routes
- Components
- Convex functions
- Tests
- Screenshot capture sources

### Acceptance Criteria

- Flat checklist of behaviors a reviewer should be able to confirm from the current code and
  screenshot/test suite.

### Known Gaps

- Real limitations or follow-up opportunities, not vague future dreams.

## Skeleton

```md
# Surface Name - Current State

> **Route**: `...`
> **Status**: REVIEWED
> **Last Updated**: YYYY-MM-DD

---

## Purpose

## Permissions & Access

## Screenshot Matrix

### Canonical route captures

### Additional reviewed states

## Primary Flow

## Alternate / Failure Flows

## Empty / Loading / Error States

## Current Composition

## Source Map

## Acceptance Criteria

## Known Gaps
```
