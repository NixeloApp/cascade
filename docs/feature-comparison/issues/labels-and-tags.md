# Labels and Tags

## Overview
Labels (tags) allow categorizing and filtering issues by custom attributes like type, area, component, or any user-defined taxonomy. Good label management includes creation, editing, deletion, grouping, and reordering.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Project Settings**: Settings > Labels section
- **Issue Form**: Inline label selection with create option
- **Issue Detail**: Sidebar label property

### UI Elements

**Label List (ProjectSettingsLabelList)**
- Header: Title, description, "Add label" button
- List: Hierarchical tree view of labels
- Groups: Parent labels with children (nested structure)
- Items: Individual label rows

**Label Item (ProjectSettingLabelItem)**
| Element | Description |
|---------|-------------|
| Drag handle | For reordering |
| Color dot | Visual indicator |
| Name | Label name text |
| Edit button | Opens inline form |
| Delete button | Opens confirmation |

**Label Group (ProjectSettingLabelGroup)**
- Parent label with expand/collapse
- Children labels indented
- Drag-drop for reordering within group

**Inline Create/Edit Form**
- Name input
- Color picker (preset colors + custom)
- Parent selector (for nested labels)
- Save/Cancel buttons

### Flow

**Creating Label**
1. Click "Add label" button
2. Inline form appears at top
3. Enter name, select color
4. Optionally select parent label
5. Click Save

**Editing Label**
1. Click Edit on label row
2. Inline form replaces row
3. Edit name, color, or parent
4. Click Save

**Deleting Label**
1. Click Delete on label row
2. Confirmation modal opens
3. Confirm to delete
4. Label removed from all issues

**Reordering**
1. Drag label by handle
2. Drop at new position
3. Position updates via `updateLabelPosition`

### Feedback
- **Loading**: Skeleton loaders while fetching
- **Success**: Label updates immediately
- **Error**: Toast notification
- **Empty state**: "Create your first label" prompt

### Notable Features
- **Hierarchical labels**: Parent/child relationship
- **Drag-drop reorder**: Manual ordering
- **Inline editing**: Edit without modal
- **Color picker**: Preset + custom colors
- **Permission-aware**: Only admins can edit

---

## Cascade

### Trigger
- **Project Settings**: Labels section in project settings
- **Issue Form**: Label toggle buttons
- **Issue Detail**: Labels in metadata section

### UI Elements

**LabelsManager Component**
- Card layout with header and body
- Actions: "New Group" and "New Label" buttons

**Label Groups (Collapsible)**
| Element | Description |
|---------|-------------|
| Expand/collapse | Chevron toggle |
| Group name | With label count |
| Description | Optional (hidden on mobile) |
| Add button | Create label in group |
| Edit button | Edit group (not for "Ungrouped") |
| Delete button | Delete group |

**Labels within Groups**
| Element | Description |
|---------|-------------|
| Color badge | Displays name with color |
| Color code | Hex value shown |
| Edit button | Opens edit modal |
| Delete button | Opens confirmation |

**Create/Edit Label Modal (Dialog)**
| Field | Type | Notes |
|-------|------|-------|
| Label Name | Text input | Required |
| Color | ColorPicker | Default brand color |
| Group | Select dropdown | Optional |
| Preview | Live badge preview | Shows result |

**Create/Edit Group Modal (Dialog)**
| Field | Type | Notes |
|-------|------|-------|
| Group Name | Text input | Required |
| Description | Text input | Optional |

### Flow

**Creating Label**
1. Click "New Label" button (or "Add" in group)
2. Modal opens
3. Enter name
4. Select color via picker
5. Optionally assign to group
6. See preview
7. Click "Create Label"
8. Modal closes, list updates

**Creating Group**
1. Click "New Group" button
2. Modal opens
3. Enter group name and description
4. Click "Create Group"
5. New group appears in list

**Editing**
1. Click Edit on label/group
2. Modal opens with current values
3. Make changes
4. Click Update
5. Changes saved

**Deleting**
1. Click Delete button
2. Confirmation dialog opens
3. Shows impact message
4. Confirm to delete

### Feedback
- **Loading**: Spinner while fetching
- **Success**: Toast "Label created/updated/deleted"
- **Error**: Toast with error
- **Empty state**: EmptyState component with CTA
- **Preview**: Live preview of label appearance

### Code Structure
```typescript
// Label data
interface Label {
  _id: Id<"labels">;
  projectId: Id<"projects">;
  name: string;
  color: string;
  groupId?: Id<"labelGroups">;
}

// Group data
interface LabelGroup {
  _id: Id<"labelGroups"> | null;
  name: string;
  description?: string;
  displayOrder: number;
  labels: Label[];
}
```

### Notable Features
- **Label groups**: Organize labels by category
- **Color picker**: Custom color selection
- **Live preview**: See label before saving
- **Collapsible groups**: Clean organization
- **Ungrouped section**: Labels without groups

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Create labels | N/A | ✅ Yes | ✅ Yes | tie |
| Edit labels | N/A | ✅ Inline | ✅ Modal | plane (less clicks) |
| Delete labels | N/A | ✅ Yes | ✅ Yes | tie |
| Color picker | N/A | ✅ Preset + custom | ✅ Full picker | Cascade |
| Live preview | N/A | ❌ No | ✅ Yes | Cascade |
| Label groups | N/A | ✅ Parent/child | ✅ Separate groups | tie |
| Drag-drop reorder | N/A | ✅ Yes | ❌ No | plane |
| Inline editing | N/A | ✅ Yes | ❌ Modal only | plane |
| Group descriptions | N/A | ❌ No | ✅ Yes | Cascade |
| Collapse groups | N/A | ✅ Yes | ✅ Yes | tie |
| Empty state | N/A | ✅ Yes | ✅ Yes | tie |
| Permission control | N/A | ✅ Admin only | ⚠️ Unknown | plane |
| Inline create in issue form | N/A | ✅ Yes | ❌ No | plane |
| Label color code display | N/A | ❌ No | ✅ Yes | Cascade |
| Nested labels | N/A | ✅ Yes | ❌ Groups only | plane |

---

## Recommendations

### Priority 1: Add Drag-Drop Reordering
Allow reordering labels and groups via drag-drop.

**Implementation:**
```typescript
// Use @dnd-kit or similar
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Add displayOrder field to labels
// Update position on drop
```

### Priority 2: Inline Editing Mode
Add inline editing similar to Plane - click to edit without opening modal.

**Benefits:**
- Faster editing workflow
- Less context switching
- More efficient for bulk edits

### Priority 3: Inline Create in Issue Form
Allow creating labels directly from the issue create/edit form.

**Implementation:**
```tsx
// In CreateIssueModal or similar
<LabelSelect
  value={selectedLabels}
  onChange={setSelectedLabels}
  createEnabled={true}
  onCreateLabel={async (name) => {
    const label = await createLabel({ projectId, name, color: randomColor() });
    return label._id;
  }}
/>
```

### Priority 4: Add Permission Controls
Only allow project admins or owners to manage labels.

### Priority 5: Nested Labels Support
Consider supporting parent/child labels for complex taxonomies (e.g., "Bug > Critical" vs separate groups).

### Priority 6: Label Search
Add search/filter for projects with many labels.

---

## Screenshots/References

### Plane Code Paths
- Label List: `~/Desktop/plane/apps/web/core/components/labels/project-setting-label-list.tsx`
- Label Item: `~/Desktop/plane/apps/web/core/components/labels/project-setting-label-item.tsx`
- Label Group: `~/Desktop/plane/apps/web/core/components/labels/project-setting-label-group.tsx`
- Delete Modal: `~/Desktop/plane/apps/web/core/components/labels/delete-label-modal.tsx`
- Store: `~/Desktop/plane/apps/web/core/store/`

### Cascade Code Paths
- Labels Manager: `~/Desktop/cascade/src/components/LabelsManager.tsx`
- Color Picker: `~/Desktop/cascade/src/components/ui/ColorPicker.tsx`
- Labels API: `~/Desktop/cascade/convex/labels.ts`
- Label Groups API: `~/Desktop/cascade/convex/labelGroups.ts`
