# Feature Comparison: cal.com vs plane vs Cascade

> **Status:** ✅ Complete
> **Migrated:** 2026-03-02 (from `docs/feature-comparison/TODO.md`)
> **Category:** Completed research todo

## Objective

Compare UI/UX implementation of features across three codebases:
- **cal.com** (`~/Desktop/cal.com`) — scheduling/booking platform
- **plane** (`~/Desktop/plane`) — project management (issues, cycles, modules)
- **Cascade** (`~/Desktop/cascade`) — our app (issues, projects, sprints, docs)

**Goal:** Identify what we have, what they have, and how our UI/UX can improve.

---

## Output Structure

```
~/Desktop/cascade/docs/feature-comparison/
├── README.md                    # Index + summary of all features
├── TODO.md                      # Original task spec location (now moved to /todos/completed/)
├── scheduling/
│   ├── create-booking.md
│   ├── availability.md
│   ├── recurring-events.md
│   └── calendar-integrations.md
├── issues/
│   ├── create-issue.md
│   ├── issue-detail-view.md
│   ├── bulk-actions.md
│   ├── filters-and-search.md
│   ├── labels-and-tags.md
│   └── issue-relations.md
├── projects/
│   ├── create-project.md
│   ├── project-settings.md
│   └── project-members.md
├── sprints-cycles/
│   ├── create-sprint.md
│   ├── sprint-board.md
│   └── sprint-reports.md
├── views/
│   ├── kanban-board.md
│   ├── list-view.md
│   ├── calendar-view.md
│   └── gantt-chart.md
├── documents/
│   ├── create-document.md
│   ├── document-editor.md
│   └── document-sharing.md
├── notifications/
│   ├── in-app-notifications.md
│   ├── email-notifications.md
│   └── notification-preferences.md
├── settings/
│   ├── user-profile.md
│   ├── workspace-settings.md
│   └── integrations.md
└── auth/
    ├── login-signup.md
    ├── sso.md
    └── 2fa.md
```

---

## Document Format (per feature)

Each `.md` file should follow this structure:

```markdown
# [Feature Name]

## Overview
Brief description of what this feature does.

---

## cal.com
> Skip if feature doesn't exist in cal.com

### Trigger
- How user initiates this feature (button location, keyboard shortcut, etc.)

### UI Elements
- Modals, dropdowns, forms, sidebars involved
- List each field/input with type and validation

### Flow
1. Step-by-step user interaction
2. Include clicks, selections, form fills
3. Note loading states, transitions

### Feedback
- Toasts, success messages, error handling
- Redirects, UI updates

---

## plane
> Skip if feature doesn't exist in plane

[Same structure as above]

---

## Cascade
> Our implementation

[Same structure as above]

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Keyboard shortcut | — | ✅ `C` | ❌ | plane |
| Inline editing | — | ✅ | ⚠️ partial | plane |
| Bulk actions | — | ✅ | ✅ | tie |
| ... | | | | |

---

## Recommendations

1. **Priority 1:** [Specific improvement for Cascade]
2. **Priority 2:** [Another improvement]
3. ...

---

## Screenshots/References
- Links to relevant code files
- Component paths
```

---

## Execution Instructions

1. **Start with README.md** — Create index of all features to analyze
2. **Work through categories** — One category at a time (issues, projects, etc.)
3. **For each feature:**
   - Read the source code in all 3 repos
   - Document the UI/UX flow in detail
   - Create comparison table
   - Write recommendations
4. **Update README.md** — Mark features as ✅ done
5. **Commit progress** — After each category is complete

---

## Source Code Locations

### cal.com
- App routes: `~/Desktop/cal.com/apps/web/app/`
- Components: `~/Desktop/cal.com/packages/ui/components/`
- Features: `~/Desktop/cal.com/packages/features/`

### plane
- App routes: `~/Desktop/plane/web/app/`
- Components: `~/Desktop/plane/web/components/`
- Store: `~/Desktop/plane/web/store/`

### Cascade
- App routes: `~/Desktop/cascade/src/routes/`
- Components: `~/Desktop/cascade/src/components/`
- Convex functions: `~/Desktop/cascade/convex/`

---

## Progress Tracking

- [x] README.md created
- [~] scheduling/ (cal.com focus - **SKIPPED**: Not applicable to Cascade/Plane project management)
- [x] issues/ (plane + Cascade focus)
- [x] projects/
- [x] sprints-cycles/
- [x] views/
- [x] documents/
- [x] notifications/
- [x] settings/
- [x] auth/

---

## Notes

- cal.com is primarily scheduling — many features won't apply
- plane is closest competitor — prioritize comparing with plane
- Focus on UI/UX quality, not just feature existence
- "We have it but worse" is valid finding — document HOW it's worse
