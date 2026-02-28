# Labels and Tags - Deep UX Comparison

## Overview
Labels (tags) allow categorizing and filtering issues by custom attributes. This analysis compares Plane vs Cascade across label management, creation flow, and UX efficiency.

---

## Entry Points Comparison

### How Users Access Label Management

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Project settings** | Settings > Labels | Project settings | Tie |
| **Issue form inline** | Create label while adding | N/A | Plane |
| **Issue detail sidebar** | Click to add/create | Click to add | Plane (inline create) |
| **Quick action** | N/A | N/A | Tie |

---

## Label Management UI Layout

### Plane Labels Settings
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Settings > Labels                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Labels                                            [+ Add Label]     │
│ Manage labels for this project                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ┌ Inline Create Form (when adding) ──────────────────────────────┐  │
│ │ [Name input] [Color ●] [Parent: None ▼] [Save] [Cancel]       │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ Label List (drag-reorderable) ────────────────────────────────┐  │
│ │ ⋮ ● bug           Red     [Edit] [×]                          │  │
│ │ ⋮ ● feature       Blue    [Edit] [×]                          │  │
│ │ ⋮ ▼ documentation Green   [Edit] [×] ← Parent (expandable)    │  │
│ │     ⋮ ● api-docs  Green   [Edit] [×] ← Child (indented)       │  │
│ │     ⋮ ● guides    Green   [Edit] [×]                          │  │
│ │ ⋮ ● enhancement   Purple  [Edit] [×]                          │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ [Empty state if no labels: "Create your first label"]               │
└─────────────────────────────────────────────────────────────────────┘

Inline Edit Mode (replaces row):
┌─────────────────────────────────────────────────────────────────────┐
│ [⋮] [Name: bug______] [● Color picker] [Parent ▼] [✓ Save] [× Cancel]│
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Labels Settings
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Settings > Labels                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Labels                                   [New Group] [New Label]    │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Group: Priority (3 labels) ▼ ─────────────────────────────────┐  │
│ │ High priority labels                        [+] [✏️] [🗑️]      │  │
│ ├────────────────────────────────────────────────────────────────┤  │
│ │ [P1] #FF0000      [Edit] [Delete]                              │  │
│ │ [P2] #FFA500      [Edit] [Delete]                              │  │
│ │ [P3] #FFFF00      [Edit] [Delete]                              │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ Group: Type (2 labels) ▼ ─────────────────────────────────────┐  │
│ │ Issue type indicators                       [+] [✏️] [🗑️]      │  │
│ ├────────────────────────────────────────────────────────────────┤  │
│ │ [bug] #EF4444     [Edit] [Delete]                              │  │
│ │ [feature] #3B82F6 [Edit] [Delete]                              │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ Ungrouped (1 label) ▼ ────────────────────────────────────────┐  │
│ │                                              [+]                │  │
│ ├────────────────────────────────────────────────────────────────┤  │
│ │ [misc] #9CA3AF    [Edit] [Delete]                              │  │
│ └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Create/Edit Modal:
┌─────────────────────────────────────────────────────────────────────┐
│ Create Label                                                    [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Label Name *                                                         │
│ [Enter label name...                                   ]             │
│                                                                      │
│ Color                                                                │
│ [■■■ Color Picker with presets ■■■]                                 │
│                                                                      │
│ Group                                                                │
│ [Priority ▼ - dropdown]                                             │
│                                                                      │
│ Preview:                                                             │
│ [████ bug ████] ← Live preview of label appearance                  │
│                                                                      │
│                                    [Cancel] [Create Label]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Create Label Flow Comparison

### Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Create basic label** | 3 clicks (Add + name + Save) | 4 clicks (New Label + name + color + Create) | Plane wins |
| **Create with custom color** | 4 clicks | 4 clicks | Tie |
| **Create in group** | 4 clicks (select parent) | 4 clicks (select group) | Tie |
| **Edit label name** | 3 clicks (Edit + change + Save) | 4 clicks (Edit + modal + change + Save) | Plane wins |
| **Change label color** | 3 clicks | 4 clicks | Plane wins |
| **Delete label** | 2 clicks + confirm | 2 clicks + confirm | Tie |
| **Reorder labels** | 1 drag action | N/A | Plane only |

### Feature Comparison

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Inline create** | Form appears at top of list | Opens modal |
| **Inline edit** | Replaces row in-place | Opens modal |
| **Live preview** | N/A | Badge preview in modal |
| **Color presets** | Yes + custom | Yes + full picker |
| **Hex code display** | N/A | Shows color hex |
| **Drag reorder** | Yes | N/A |
| **Nested labels** | Parent/child | Groups only |
| **Group descriptions** | N/A | Yes |

---

## Label Assignment UI

### In Issue Form

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Selection type** | Multi-select dropdown | Toggle buttons |
| **Create inline** | "Create label" option | N/A (settings only) |
| **Search labels** | Type to filter | N/A |
| **Color display** | Dot + name | Badge with color |
| **Remove label** | Click X on tag | Click again to toggle |

### Plane Issue Form Label Select
```
┌───────────────────────────────────────┐
│ Labels                                 │
│ ┌─────────────────────────────────────┐
│ │ [bug ×] [feature ×]    [+ Add]     │
│ └─────────────────────────────────────┘
│                                        │
│ Dropdown (when clicking Add):          │
│ ┌─────────────────────────────────────┐
│ │ [🔍 Search labels...]              │
│ ├─────────────────────────────────────┤
│ │ ☑ ● bug                             │
│ │ ☑ ● feature                         │
│ │ ☐ ● enhancement                     │
│ │ ☐ ● documentation                   │
│ ├─────────────────────────────────────┤
│ │ [+ Create "new label"]              │
│ └─────────────────────────────────────┘
└───────────────────────────────────────┘
```

### Cascade Issue Form Labels
```
┌───────────────────────────────────────┐
│ Labels                                 │
│ ┌─────────────────────────────────────┐
│ │ [bug] [feature] [+ Add] [+ Create] │ ← Toggle buttons
│ │   ↑ active       ↑ inactive         │
│ └─────────────────────────────────────┘
│                                        │
│ Add dropdown:                          │
│ ┌─────────────────────────────────────┐
│ │ ☑ bug                               │
│ │ ☑ feature                           │
│ │ ☐ enhancement                       │
│ │ ☐ documentation                     │
│ └─────────────────────────────────────┘
└───────────────────────────────────────┘
```

---

## Color Picker Comparison

### Plane Color Picker
```
┌─────────────────────────────────────┐
│ [●] [●] [●] [●] [●] [●] [●] [●]    │ ← Preset colors
│ [●] [●] [●] [●] [●] [●] [●] [●]    │
│ [Custom color picker...]            │ ← Expands to full picker
└─────────────────────────────────────┘
```

### Cascade Color Picker
```
┌─────────────────────────────────────┐
│ Preset colors:                       │
│ [●] [●] [●] [●] [●] [●] [●] [●]    │
│ [●] [●] [●] [●] [●] [●] [●] [●]    │
├─────────────────────────────────────┤
│ Or custom:                           │
│ ┌─────────────────────────────────┐ │
│ │    Gradient color area          │ │
│ │    with hue slider              │ │
│ └─────────────────────────────────┘ │
│ Hex: [#3B82F6]                       │
└─────────────────────────────────────┘
```

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Tab through labels** | Yes | Yes (in modal) |
| **Enter to select** | Yes | Yes |
| **Escape to close** | Yes (cancel inline edit) | Yes (close modal) |
| **Type to search** | In dropdown | N/A |
| **Arrow keys** | Navigate dropdown | Navigate modal |

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **ARIA labels** | Buttons labeled | Modal + form labels |
| **Color contrast** | Color dots + text | Badge with accessible colors |
| **Screen reader** | Label names announced | Full form labels |
| **Focus management** | Inline focus | Modal focus trap |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Click efficiency | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane inline editing |
| Inline create | ⭐⭐⭐⭐⭐ | ⭐ | Plane in issue form |
| Color picker | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade full picker |
| Live preview | ⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Organization | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have groups |
| Drag reorder | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Nested labels | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has parent/child |
| Group descriptions | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Search/filter | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane in dropdown |
| Modal vs inline | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane less context switching |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Inline label create in issue form** - Allow creating labels directly from create/edit issue modal without leaving context

### P1 - High
2. **Drag-drop reordering** - Add drag handles to reorder labels within groups
3. **Label search** - Add search filter for projects with many labels
4. **Inline editing** - Edit labels directly in list without modal

### P2 - Medium
5. **Nested labels** - Support parent/child within groups
6. **Keyboard navigation** - Arrow keys in label list
7. **Bulk label operations** - Select multiple to delete/move

### P3 - Nice to Have
8. **Label usage stats** - Show how many issues use each label
9. **Label suggestions** - AI-suggested labels based on issue content
10. **Import/export labels** - Share label configs between projects

---

## Code References

### Plane
- Label List: `apps/web/core/components/labels/project-setting-label-list.tsx`
- Label Item: `apps/web/core/components/labels/project-setting-label-item.tsx`
- Label Group: `apps/web/core/components/labels/project-setting-label-group.tsx`
- Delete Modal: `apps/web/core/components/labels/delete-label-modal.tsx`
- Label Select: `apps/web/core/components/issues/select/label.tsx`

### Cascade
- Labels Manager: `src/components/LabelsManager.tsx`
- Color Picker: `src/components/ui/ColorPicker.tsx`
- Labels API: `convex/labels.ts`
- Label Groups API: `convex/labelGroups.ts`

### Cascade Data Structures
```typescript
interface Label {
  _id: Id<"labels">;
  projectId: Id<"projects">;
  name: string;
  color: string;
  groupId?: Id<"labelGroups">;
}

interface LabelGroup {
  _id: Id<"labelGroups"> | null;
  name: string;
  description?: string;
  displayOrder: number;
  labels: Label[];
}
```
