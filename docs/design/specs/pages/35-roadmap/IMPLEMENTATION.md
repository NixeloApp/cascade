# Roadmap Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/projects/$key/roadmap.tsx`

## Data

- `api.issues.listRoadmapIssues` — issues with due dates, backend-filtered
- `api.sprints.listByProject` — sprints with date ranges
- `api.issues.update` — for drag/resize date changes

## Components

| Component | Location |
|-----------|----------|
| RoadmapPage | `src/routes/.../roadmap.tsx` |
| RoadmapView | `src/components/RoadmapView.tsx` (2671 lines) |

## Key Architecture

- Percentage-based bar positioning: `left = (itemStart - rangeStart) / rangeDuration * 100`
- Mouse event handlers for drag-to-move and edge-resize
- SVG overlay layer for dependency arrow rendering
- `canEdit` prop gates all mutation interactions (viewer = read-only)

## Permissions

- Requires project access (viewer+)
- Drag/resize requires editor+ role
