# Roadmap Page - Current State

> **Route**: `/:slug/projects/:key/roadmap`
> **Last Updated**: 2026-03-23

## Purpose

Gantt chart / timeline view for project planning. Shows issues and sprints positioned by date range.

## Layout

- Timeline header with navigation (Previous / Today / Next)
- Time scale toggle: Week | Month | Quarter
- Zoom controls: 50%-300% with reset
- Issue info column (left) + timeline grid (right)
- Bars colored by priority (high=red, medium=yellow, low=blue) and type (sprint=accent)

## Interactions

- **Drag to move**: shift issue start+end dates together
- **Resize handles**: drag left/right edges to change start/due date
- **Dependency arrows**: SVG lines between linked issues
- **Click to open**: opens issue detail
- **Zoom**: scale timeline columns wider/narrower

## States

- **Loading**: PageContent loading skeleton
- **Empty**: EmptyState "No roadmap items yet" with instruction to add due dates
- **Populated**: timeline rows with colored bars
- **Project not found**: PageError with message
