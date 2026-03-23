# Issues Page - Current State

> **Route**: `/:slug/issues`
> **Last Updated**: 2026-03-23

## Purpose

Organization-wide issue list. Shows all issues across all projects the user has access to.

## Layout

- Responsive grid (1-4 columns based on viewport)
- Search bar (title/key filter)
- Status filter dropdown (workflow states)
- View mode toggle (card/list)
- Create issue button
- Issue cards link to detail panel

## Key Components

- `IssueCard` — card with key, title, priority badge, assignee avatar
- `CreateIssueModal` — modal for new issue creation
- `IssueDetailViewer` — side panel for viewing/editing issue

## States

- **Loading**: skeleton grid
- **Empty**: EmptyState with "No issues" message
- **Populated**: paginated grid of issue cards
- **Detail open**: side panel showing selected issue
- **Filtered**: subset of issues matching search/status
