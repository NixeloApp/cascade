# Issue Detail View

## Overview
The issue detail view displays all information about a single issue, including its properties, description, activity feed, comments, attachments, and related items. This is where users spend significant time reviewing and updating issues.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Click**: Click on any issue row in list/kanban/spreadsheet views
- **Keyboard**: `Enter` on focused issue
- **URL**: Direct link to `/workspace/project/issues/[issue-id]`
- **Peek overview**: Half-height preview panel (configurable)

### UI Elements

**Layout Options**
1. **Full page**: Takes entire screen
2. **Side peek**: Slides in from right (default in list view)
3. **Modal peek**: Centered modal with backdrop

**Header Section**
- Issue identifier (PROJECT-123)
- Breadcrumb (Project > Issue)
- Quick actions: Subscribe, Copy link, Move, Archive, Delete
- Close button (X)

**Main Content Area (Left)**
- **Title**: Inline editable, large text
- **Description**: Rich text editor with collaborative editing
- **Activity tabs**:
  - All (combined feed)
  - Comments
  - Activity (system events)
- **Comment input**: Rich text with file attachments

**Sidebar (Right) - Properties**
| Property | Component | Behavior |
|----------|-----------|----------|
| State | Dropdown | Inline change, groups by state |
| Assignees | Multi-select dropdown | Avatar display |
| Priority | Dropdown | Icon + text |
| Created by | Display only | Avatar + name |
| Start date | Date picker | With calendar |
| Due date | Date picker | Highlights overdue |
| Estimate | Dropdown | When enabled |
| Module | Multi-select | Project-level |
| Cycle | Dropdown | Project-level |
| Parent | Issue search modal | Shows identifier |
| Labels | Multi-select | With colors |
| Worklog | Custom widget | Time tracking |
| Additional properties | Dynamic | Custom fields |

**Widgets Section**
- Sub-issues list (collapsible)
- Related issues / Links
- Attachments

### Flow
1. User clicks on issue row
2. Side peek slides in (or full page loads)
3. All data loads reactively (MobX store)
4. User can edit any field inline
5. Changes save immediately (optimistic updates)
6. Activity feed shows real-time updates
7. User can switch between tabs
8. Close via X, Escape, or clicking outside

### Feedback
- **Loading**: Skeleton loaders for each section
- **Save**: No explicit save button - auto-saves
- **Error**: Toast for failed operations
- **Real-time**: Live updates from other users

### Notable Features
- **Inline editing**: Click any property to edit directly
- **Real-time collaboration**: See changes from teammates
- **Peek modes**: Full page, side peek, or modal
- **Quick actions menu**: Copy link, archive, delete
- **Activity timeline**: Mixed comments + system events
- **Worklog tracking**: Built-in time tracking widget
- **Custom properties**: Dynamic additional fields

---

## Cascade

### Trigger
- **Click**: Click on issue card/row
- **URL**: Direct link (assumed)

### UI Elements

**Layout**
- Two-column layout
- Left: Main content (header, description, comments)
- Right: Sidebar (properties, time tracking, attachments, dependencies)

**Header Section**
- Issue title (IssueDetailHeader component)
- Issue key/identifier

**Main Content Area (IssueDetailContent)**
- Description
- Activity feed
- Comments section

**Sidebar (IssueDetailSidebar)**

| Section | Contents |
|---------|----------|
| Properties | Status, Type, Assignee, Reporter, Story Points, Labels |
| Time Tracking | TimeTracker component with estimated hours |
| Attachments | FileAttachments component |
| Watchers | IssueWatchers component |
| Dependencies | IssueDependencies component |

### Flow
1. User clicks on issue
2. Detail view opens (layout or modal)
3. Data loaded via Convex queries
4. User edits via IssueMetadataSection dropdowns
5. Changes trigger mutations
6. Success/error toasts shown

### Feedback
- **Loading**: Standard loading states
- **Success**: Toast notifications
- **Error**: Toast with error details

### Notable Features
- **Watchers**: Subscribe to issue updates
- **Dependencies**: Blocks/relates/duplicates relationships
- **Time tracking**: Built-in time tracker with billing support
- **Attachments**: File upload and display

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Layout options | N/A | ✅ 3 modes (full/peek/modal) | ⚠️ 1 mode | plane |
| Inline title edit | N/A | ✅ Yes | ❌ Unknown | plane |
| Inline property edit | N/A | ✅ All properties | ⚠️ Some | plane |
| Rich text description | N/A | ✅ Full editor | ⚠️ Limited | plane |
| Activity tabs | N/A | ✅ All/Comments/Activity | ⚠️ Single feed | plane |
| Real-time updates | N/A | ✅ MobX reactive | ✅ Convex reactive | tie |
| Quick actions menu | N/A | ✅ Yes | ❌ Limited | plane |
| Copy link | N/A | ✅ Yes | ❌ Unknown | plane |
| Keyboard navigation | N/A | ✅ Escape to close | ⚠️ Limited | plane |
| Worklog/Time tracking | N/A | ✅ Yes | ✅ Yes | tie |
| Watchers/Subscribe | N/A | ✅ Subscription button | ✅ Watchers section | tie |
| Dependencies/Relations | N/A | ✅ Yes | ✅ Yes | tie |
| Attachments | N/A | ✅ Yes | ✅ Yes | tie |
| Custom fields | N/A | ✅ Dynamic | ❌ No | plane |
| Sub-issues widget | N/A | ✅ Yes | ❌ No | plane |
| Due date alerts | N/A | ✅ Overdue highlight | ❌ Unknown | plane |
| Start/Due dates | N/A | ✅ Both | ⚠️ Due only? | plane |
| Multiple assignees | N/A | ✅ Yes | ❌ No | plane |
| Parent issue display | N/A | ✅ Yes | ⚠️ Unknown | plane |

---

## Recommendations

### Priority 1: Add Peek/Side Panel Mode
Allow viewing issue details without leaving the current context (list view stays visible).

**Implementation:**
- Create `IssueDetailPeek` component that slides in from right
- Add view mode preference in user settings
- Support keyboard navigation (arrows to move between issues)

### Priority 2: Full Inline Editing
Make all properties editable by clicking directly on them without needing separate edit buttons.

### Priority 3: Multiple View Modes
Add options for:
- Side peek (slide-in panel)
- Modal (centered overlay)
- Full page (dedicated route)

### Priority 4: Activity Tab Separation
Split activity into tabs:
- **All**: Combined feed
- **Comments**: User comments only
- **History**: System events only

### Priority 5: Quick Actions Menu
Add dropdown with:
- Copy issue link
- Copy issue key
- Archive issue
- Delete issue
- Move to project (if supported)

### Priority 6: Sub-Issues Widget
Show child/sub-issues in a collapsible section within the detail view.

### Priority 7: Due Date Visual Alerts
Highlight overdue dates in red, upcoming dates in yellow.

---

## Screenshots/References

### Plane Code Paths
- Root: `~/Desktop/plane/apps/web/core/components/issues/issue-detail/root.tsx`
- Main Content: `~/Desktop/plane/apps/web/core/components/issues/issue-detail/main-content.tsx`
- Sidebar: `~/Desktop/plane/apps/web/core/components/issues/issue-detail/sidebar.tsx`
- Activity: `~/Desktop/plane/apps/web/core/components/issues/issue-detail/issue-activity/`
- Peek Overview: `~/Desktop/plane/apps/web/core/components/issues/peek-overview/`

### Cascade Code Paths
- Layout: `~/Desktop/cascade/src/components/IssueDetailView/IssueDetailLayout.tsx`
- Header: `~/Desktop/cascade/src/components/IssueDetailView/IssueDetailHeader.tsx`
- Content: `~/Desktop/cascade/src/components/IssueDetailView/IssueDetailContent.tsx`
- Sidebar: `~/Desktop/cascade/src/components/IssueDetailView/IssueDetailSidebar.tsx`
- Hook: `~/Desktop/cascade/src/components/IssueDetailView/useIssueDetail.ts`
