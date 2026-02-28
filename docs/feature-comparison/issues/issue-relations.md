# Issue Relations

## Overview
Issue relations (dependencies, links) allow connecting issues together to express relationships like "blocks", "relates to", "duplicates", or parent/child. This helps track dependencies between work items and understand impact.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Issue Detail Sidebar**: Add relation button
- **Issue Detail Widgets**: Relations section
- **Command Palette**: Quick relation commands

### UI Elements

**Relations Widget (issue-detail-widgets/relations)**
- Collapsible section in issue detail
- Lists all related issues
- Add relation button

**Relation Select (relation-select.tsx)**
- Modal to search and select target issue
- Relation type dropdown
- Issue search with filters

**Relation Types**
| Type | Direction | Description |
|------|-----------|-------------|
| Blocks | Outgoing | This issue blocks another |
| Is blocked by | Incoming | Another issue blocks this |
| Relates to | Bidirectional | General relationship |
| Duplicates | Outgoing | This duplicates another |
| Is duplicated by | Incoming | Another duplicates this |

**Related Issue Display (issue-list-item.tsx)**
- Issue identifier (PROJECT-123)
- Issue title
- State badge
- Priority indicator
- Assignee avatars
- Remove button

**Inline Properties (properties.tsx)**
- State dropdown (editable)
- Priority dropdown (editable)
- Assignee dropdown (editable)
- Can update related issue properties inline

### Flow

**Adding Relation**
1. Open issue detail
2. Navigate to Relations section
3. Click "Add relation"
4. Select relation type (blocks, relates, duplicates)
5. Search for target issue
6. Click to add
7. Relation appears in list

**Viewing Relations**
1. Relations grouped by type
2. Outgoing (this issue affects...)
3. Incoming (...affects this issue)
4. Click to navigate to related issue

**Removing Relation**
1. Click remove/delete on relation row
2. Relation removed
3. Both issues updated

**Editing Related Issue**
1. Change state/priority/assignee directly in relation row
2. Updates apply to related issue
3. No need to navigate away

### Feedback
- **Search**: Live results while typing
- **Add**: Issue added to relation list
- **Remove**: Removed from list
- **Update**: Inline changes save immediately

### Notable Features
- **Bidirectional**: Relations show on both issues
- **Inline editing**: Update related issue properties
- **Multiple types**: Blocks, relates, duplicates
- **Search within modal**: Find issues quickly

---

## Cascade

### Trigger
- **Issue Detail Sidebar**: Dependencies section
- **"+ Add Dependency" button**: Opens add dialog

### UI Elements

**IssueDependencies Component**
- Stack layout with sections
- Add Dependency button at top

**Dependencies Section (Outgoing)**
- Title: "Dependencies"
- Cards for each link
- Badge showing relationship type
- Issue display (icon + key + title)
- Remove button (X)

**Referenced By Section (Incoming)**
- Title: "Referenced By"
- Same card format
- Shows inverse relationship

**Add Dependency Sheet**
| Element | Description |
|---------|-------------|
| Relationship Type | Select: blocks, relates, duplicates |
| Search Issue | Text input (min 2 chars) |
| Results List | Clickable issue cards |
| Selected | Shows selected issue key |
| Cancel/Add buttons | Footer actions |

**Issue Display Component**
- Type icon
- Issue key (PROJECT-123)
- Issue title (truncated)

**Link Type Labels**
| Type | Outgoing | Incoming |
|------|----------|----------|
| blocks | "Blocks" | "Blocked by" |
| relates | "Relates to" | "Related by" |
| duplicates | "Duplicates" | "Duplicated by" |

### Flow

**Adding Dependency**
1. Click "+ Add Dependency" button
2. Sheet slides in from side
3. Select relationship type
4. Type to search issues (min 2 chars)
5. Results appear below
6. Click issue to select
7. Click "Add Dependency"
8. Sheet closes, link added

**Viewing Dependencies**
1. Outgoing: "Dependencies" section shows what this blocks/relates
2. Incoming: "Referenced By" shows what blocks/relates this
3. Each shows as card with badge + issue info

**Removing Dependency**
1. Click X button on link card
2. Confirmation dialog opens
3. Confirm to remove
4. Link removed from both issues

### Feedback
- **Search**: Results appear after 2+ chars
- **Add**: Toast "Dependency added"
- **Remove**: Confirmation required, toast "Dependency removed"
- **Error**: Toast with error context
- **Empty**: "No dependencies yet" message

### Code Structure
```typescript
// Link types
type LinkType = "blocks" | "relates" | "duplicates";

// Link with details
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

// API
api.issueLinks.getForIssue({ issueId }) // Returns { outgoing, incoming }
api.issueLinks.create({ fromIssueId, toIssueId, linkType })
api.issueLinks.remove({ linkId })
```

### Notable Features
- **Bidirectional display**: Shows both directions
- **Sheet UI**: Uses Sheet instead of modal (avoids nesting issues)
- **Search exclusion**: Current issue excluded from search results
- **Semantic labels**: "Blocks" vs "Blocked by" based on direction

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Create relations | N/A | ✅ Yes | ✅ Yes | tie |
| Remove relations | N/A | ✅ Yes | ✅ Yes | tie |
| Bidirectional display | N/A | ✅ Yes | ✅ Yes | tie |
| Blocks/Blocked by | N/A | ✅ Yes | ✅ Yes | tie |
| Relates to | N/A | ✅ Yes | ✅ Yes | tie |
| Duplicates | N/A | ✅ Yes | ✅ Yes | tie |
| Parent/Child | N/A | ✅ Separate feature | ❌ No | plane |
| Inline property edit | N/A | ✅ State/Priority/Assignee | ❌ No | plane |
| Issue search | N/A | ✅ With filters | ✅ Basic | plane |
| Navigate to related | N/A | ✅ Click to open | ⚠️ Unknown | plane |
| Bulk add relations | N/A | ⚠️ Unknown | ❌ No | — |
| Visual graph | N/A | ❌ No | ❌ No | — |
| Confirmation on remove | N/A | ⚠️ Unknown | ✅ Yes | Cascade |
| Empty state | N/A | ⚠️ Unknown | ✅ Yes | Cascade |

---

## Recommendations

### Priority 1: Click to Navigate to Related Issue
Make related issue cards clickable to navigate to that issue.

**Implementation:**
```tsx
<Card 
  as={Link} 
  href={`/project/${projectId}/issues/${issue._id}`}
  // ... existing props
>
```

### Priority 2: Inline Property Editing
Allow changing state/priority/assignee of related issues directly from the relation list.

**Benefits:**
- Quick triage without leaving context
- Update blockers without switching views
- Faster workflow

### Priority 3: Parent/Child Relations
Add parent/child (sub-issue) relationship type.

**Use cases:**
- Epic → Story breakdown
- Story → Task breakdown
- Bug → Sub-task fixes

### Priority 4: Visual Dependency Graph
Add optional visualization of issue dependencies.

**Options:**
- Simple tree view
- Graph visualization (using D3 or similar)
- Gantt-style dependency view

### Priority 5: Add "Is blocked by" Quick Action
When an issue is blocked, show a prominent indicator and quick action to view/resolve blockers.

### Priority 6: Relation Impact Preview
When viewing a relation, show if the related issue would affect:
- Sprint completion
- Due dates
- Blocking chains

---

## Screenshots/References

### Plane Code Paths
- Relations Widget: `~/Desktop/plane/apps/web/core/components/issues/issue-detail-widgets/relations/`
- Relation Select: `~/Desktop/plane/apps/web/core/components/issues/issue-detail/relation-select.tsx`
- Issue List Item: `~/Desktop/plane/apps/web/core/components/issues/relations/issue-list-item.tsx`
- Properties: `~/Desktop/plane/apps/web/core/components/issues/relations/properties.tsx`

### Cascade Code Paths
- Dependencies: `~/Desktop/cascade/src/components/IssueDependencies.tsx`
- Tests: `~/Desktop/cascade/src/components/IssueDependencies.test.tsx`
- Issue Links API: `~/Desktop/cascade/convex/issueLinks.ts`
- Issues Search API: `~/Desktop/cascade/convex/issues.ts` (search function with excludeIssueId)
