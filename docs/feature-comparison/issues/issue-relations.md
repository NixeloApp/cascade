# Issue Relations - Deep UX Comparison

## Overview
Issue relations (dependencies/links) connect issues to express relationships like "blocks", "relates to", or "duplicates". This analysis compares Plane vs Cascade across relation types, creation flow, and UX efficiency.

---

## Entry Points Comparison

### How Users Add Relations

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Issue detail sidebar** | Add relation button | Add Dependency button | Tie |
| **Issue detail widgets** | Relations section | Dependencies section | Tie |
| **Quick action** | Command palette | N/A | Plane |
| **Context menu** | N/A | N/A | Tie |
| **Drag between issues** | N/A | N/A | Tie |

---

## Relations UI Layout

### Plane Relations Widget
```
┌─────────────────────────────────────────────────────────────────────┐
│ Issue Detail                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ [Content]                          │ [Properties Sidebar]           │
│                                    ├─────────────────────────────────
│                                    │ State: [In Progress ▼]        │
│                                    │ Priority: [High ▼]            │
│                                    │ ...                            │
├────────────────────────────────────┴─────────────────────────────────┤
│ ┌─ Widgets ───────────────────────────────────────────────────────┐ │
│ │                                                                  │ │
│ │ ┌─ Relations ▼ ───────────────────────────────────────────────┐ │ │
│ │ │                                          [+ Add Relation]   │ │ │
│ │ ├──────────────────────────────────────────────────────────────┤ │ │
│ │ │ Blocks (2)                                                   │ │ │
│ │ │ ┌────────────────────────────────────────────────────────┐  │ │ │
│ │ │ │ PROJ-456  Fix auth flow      [In Progress ▼] [🗑️]     │  │ │ │
│ │ │ │           ↑ clickable        ↑ editable inline         │  │ │ │
│ │ │ └────────────────────────────────────────────────────────┘  │ │ │
│ │ │ ┌────────────────────────────────────────────────────────┐  │ │ │
│ │ │ │ PROJ-789  Update API         [To Do ▼]        [🗑️]     │  │ │ │
│ │ │ └────────────────────────────────────────────────────────┘  │ │ │
│ │ │                                                              │ │ │
│ │ │ Blocked by (1)                                               │ │ │
│ │ │ ┌────────────────────────────────────────────────────────┐  │ │ │
│ │ │ │ PROJ-123  Database migration  [Done ✓]        [🗑️]     │  │ │ │
│ │ │ └────────────────────────────────────────────────────────┘  │ │ │
│ │ │                                                              │ │ │
│ │ │ Relates to (1)                                               │ │ │
│ │ │ ┌────────────────────────────────────────────────────────┐  │ │ │
│ │ │ │ PROJ-234  Design mockups     [In Review]      [🗑️]     │  │ │ │
│ │ │ └────────────────────────────────────────────────────────┘  │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Add Relation Modal:
┌─────────────────────────────────────────────────────────────────────┐
│ Add Relation                                                    [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Relation Type                                                        │
│ [Blocks ▼]                                                          │
│                                                                      │
│ Search Issues                                                        │
│ [🔍 Search by title or key...]                                      │
│                                                                      │
│ ┌─ Results ──────────────────────────────────────────────────────┐  │
│ │ PROJ-456  Fix authentication flow              High  To Do     │  │
│ │ PROJ-789  Update API endpoints                 Medium In Prog  │  │
│ │ PROJ-234  Design mockups                       Low    Review   │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                                    [Cancel] [Add Relation]           │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Dependencies Section
```
┌─────────────────────────────────────────────────────────────────────┐
│ Issue Detail Sheet/Page                                              │
├─────────────────────────────────────────────────────────────────────┤
│ [Title & Content]                                                    │
│                                                                      │
│ [Metadata Section]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Dependencies ────────────────────────────────────────────────┐   │
│ │                                        [+ Add Dependency]     │   │
│ ├────────────────────────────────────────────────────────────────┤   │
│ │ Dependencies (outgoing):                                       │   │
│ │ ┌────────────────────────────────────────────────────────────┐│   │
│ │ │ [Blocks]  🔧 PROJ-456  Fix auth flow                   [×] ││   │
│ │ └────────────────────────────────────────────────────────────┘│   │
│ │ ┌────────────────────────────────────────────────────────────┐│   │
│ │ │ [Relates] 🐛 PROJ-789  Update API                      [×] ││   │
│ │ └────────────────────────────────────────────────────────────┘│   │
│ │                                                                │   │
│ │ Referenced By (incoming):                                      │   │
│ │ ┌────────────────────────────────────────────────────────────┐│   │
│ │ │ [Blocked by] 📖 PROJ-123  Database migration           [×] ││   │
│ │ └────────────────────────────────────────────────────────────┘│   │
│ └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Add Dependency Sheet (slides in from right):
┌─────────────────────────────────────────────────────────────────────┐
│ Add Dependency                                                  [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Relationship Type                                                    │
│ ( ) Blocks - This issue blocks another                              │
│ (●) Relates to - General relationship                               │
│ ( ) Duplicates - This issue duplicates another                      │
│                                                                      │
│ Search Issue (min 2 characters)                                      │
│ [🔍 Search issues...                                    ]           │
│                                                                      │
│ ┌─ Results ──────────────────────────────────────────────────────┐  │
│ │ 🔧 PROJ-456  Fix authentication flow                           │  │
│ │ 🐛 PROJ-789  Update API endpoints                              │  │
│ │ 📖 PROJ-234  Design mockups                                    │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ Selected: PROJ-456                                                   │
│                                                                      │
│                                    [Cancel] [Add Dependency]         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Relation Types

| Type | Plane | Cascade | Description |
|------|-------|---------|-------------|
| **Blocks / Blocked by** | Yes | Yes | Dependency relationship |
| **Relates to** | Yes | Yes | General association |
| **Duplicates / Duplicated by** | Yes | Yes | Duplicate detection |
| **Parent / Child** | Yes (separate) | N/A | Sub-issue relationship |
| **Custom relation types** | N/A | N/A | Neither supports |

---

## Click Analysis

### Minimum Clicks to Complete Actions

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Open add relation** | 1 click | 1 click | Tie |
| **Add blocking relation** | 4 clicks (type + search + select + add) | 4 clicks | Tie |
| **Navigate to related issue** | 1 click | Unknown | Plane wins |
| **Remove relation** | 1 click | 2 clicks (+ confirm) | Plane faster, Cascade safer |
| **Change related issue status** | 2 clicks (inline dropdown) | N/A | Plane only |
| **Change related issue priority** | 2 clicks (inline dropdown) | N/A | Plane only |

---

## Inline Editing Comparison

### Plane Inline Properties
```
Related Issue Row:
┌─────────────────────────────────────────────────────────────────────┐
│ PROJ-456  Fix auth flow   [In Progress ▼] [High ▼] [@user] [🗑️]   │
│                           ↑ clickable dropdown edits target issue  │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade (No inline editing)
```
Related Issue Card:
┌─────────────────────────────────────────────────────────────────────┐
│ [Blocks]  🔧 PROJ-456  Fix auth flow                           [×] │
│ ↑ badge   ↑ type icon                                              │
└─────────────────────────────────────────────────────────────────────┘
```

| Inline Feature | Plane | Cascade |
|----------------|-------|---------|
| **State/Status** | Editable dropdown | Display only |
| **Priority** | Editable dropdown | Display only |
| **Assignee** | Editable dropdown | Display only |
| **Navigate** | Click title | Unknown |

---

## Bidirectional Display

### How Both Sides Show Relations

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Outgoing section** | "Blocks", "Relates to", "Duplicates" | "Dependencies" |
| **Incoming section** | "Blocked by", "Related by", "Duplicated by" | "Referenced By" |
| **Labels** | Semantic direction labels | Badge + semantic labels |
| **Grouping** | By relation type | By direction |

---

## Search Functionality

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Search scope** | All project issues | All project issues |
| **Exclude current** | Yes | Yes |
| **Filter by type** | Unknown | N/A |
| **Filter by status** | Unknown | N/A |
| **Min characters** | Unknown | 2 characters |
| **Live results** | Yes | Yes |

---

## Confirmation & Feedback

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Add confirmation** | No (immediate) | No (immediate) |
| **Remove confirmation** | Unknown | Yes (dialog) |
| **Success feedback** | Visual update | Toast message |
| **Error feedback** | Toast | Toast with context |
| **Empty state** | Unknown | "No dependencies yet" |

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Tab through results** | Yes | Yes |
| **Enter to select** | Yes | Yes |
| **Escape to close** | Yes | Yes |
| **Arrow keys** | Navigate results | Navigate results |
| **Quick add shortcut** | Command palette | N/A |

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Section headings** | Yes | Yes |
| **Button labels** | ARIA labels | Button labels |
| **Keyboard navigation** | Full | Full |
| **Screen reader** | Relation type announced | Relation type in badge |
| **Focus management** | Modal focus trap | Sheet focus trap |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Relation types | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane has parent/child |
| Click efficiency | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Similar workflow |
| Inline editing | ⭐⭐⭐⭐⭐ | ⭐ | Plane edits inline |
| Navigation | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane click to navigate |
| Bidirectional | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both show both sides |
| Search | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Similar capability |
| Safety (remove) | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has confirm |
| Empty state | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has message |
| Visual design | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both clean |
| Accessibility | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both good |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Click to navigate** - Make related issue cards clickable to navigate to that issue
   ```tsx
   <Card
     as={Link}
     to={ROUTES.issues.detail(orgSlug, issue.key)}
     // ... existing props
   >
   ```

### P1 - High
2. **Inline property editing** - Allow changing status/priority/assignee of related issues directly
3. **Parent/child relations** - Add sub-issue relationship type

### P2 - Medium
4. **Visual dependency graph** - Add optional visualization
   ```
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ PROJ-1  │────▶│ PROJ-2  │────▶│ PROJ-3  │
   └─────────┘     └─────────┘     └─────────┘
   ```
5. **Blocked indicator** - Show prominent indicator when issue is blocked
6. **Bulk add relations** - Add multiple related issues at once

### P3 - Nice to Have
7. **Relation impact preview** - Show how relation affects sprint/timeline
8. **Quick unblock action** - One-click to view blockers when issue is blocked
9. **Relation suggestions** - AI-suggested relations based on issue content

---

## Code References

### Plane
- Relations Widget: `apps/web/core/components/issues/issue-detail-widgets/relations/`
- Relation Select: `apps/web/core/components/issues/issue-detail/relation-select.tsx`
- Issue List Item: `apps/web/core/components/issues/relations/issue-list-item.tsx`
- Properties: `apps/web/core/components/issues/relations/properties.tsx`
- Relation Store: `apps/web/core/store/issue/relation.store.ts`

### Cascade
- Dependencies: `src/components/IssueDependencies.tsx`
- Tests: `src/components/IssueDependencies.test.tsx`
- Issue Links API: `convex/issueLinks.ts`
- Search API: `convex/issues.ts` → `search` function

### Cascade Data Structures
```typescript
type LinkType = "blocks" | "relates" | "duplicates";

interface IssueLinkWithDetails {
  _id: Id<"issueLinks">;
  fromIssueId: Id<"issues">;
  toIssueId: Id<"issues">;
  linkType: LinkType;
  issue: {
    type: IssueType;
    key: string;
    title: string;
  };
}

// API returns { outgoing, incoming }
api.issueLinks.getForIssue({ issueId });
api.issueLinks.create({ fromIssueId, toIssueId, linkType });
api.issueLinks.remove({ linkId });
```
