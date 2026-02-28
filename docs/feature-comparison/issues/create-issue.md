# Create Issue

## Overview
The create issue modal allows users to quickly create new work items/issues with relevant metadata like title, description, type, priority, assignee, and labels.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Keyboard shortcut**: `C` (global shortcut when in project context)
- **Button**: "Create work item" button in header
- **Context menu**: Right-click on kanban column or list view
- **Cycle/Module context**: Auto-assigns cycle or module when creating from within those views

### UI Elements

**Modal Layout (2-column when duplicate detection active)**
- Left panel: Main form
- Right panel: Duplicate issue suggestions (optional)

**Header Section**
- Project selector (dropdown)
- Issue type selector (Task, Bug, Feature, etc.)
- Work item template selector (optional)

**Main Form Fields**
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Title | Text input | Required | Auto-focuses on open |
| Description | Rich text editor (Plane editor) | Optional | Supports markdown, images, mentions |
| State | Dropdown | Required | Default: first "unstarted" state |
| Priority | Dropdown | Optional | Default: None |
| Assignees | Multi-select dropdown | Optional | Shows avatars |
| Labels | Multi-select | Optional | With inline create |
| Start Date | Date picker | Optional | Min: none, Max: target_date |
| Due Date | Date picker | Optional | Min: start_date |
| Cycle | Dropdown | Optional | When cycle_view enabled |
| Module | Multi-select | Optional | When module_view enabled |
| Estimate | Dropdown | Optional | When estimates enabled |
| Parent | Issue search | Optional | Opens separate modal |

**Footer Section**
- "Create more" toggle switch
- Discard button (secondary)
- Save/Submit button (primary)

### Flow
1. User triggers modal via shortcut `C` or button
2. Modal opens with focus on title input
3. Project auto-selected if in project context
4. User fills in title (required)
5. User optionally fills other fields
6. If title matches existing issues, duplicate panel appears on right
7. User can review duplicates or ignore
8. Click "Save" to create issue
9. If "Create more" enabled, form resets; otherwise modal closes
10. Toast shows success with issue link

### Feedback
- **Loading**: Button shows spinner during submission
- **Success**: Toast with "Issue created" + link to view
- **Error**: Toast with error message
- **Duplicate warning**: Side panel with similar issues
- **Draft auto-save**: Work saved to workspace drafts if abandoned

### Notable Features
- **Duplicate detection**: Real-time search for similar issues while typing
- **Work item types**: Different forms/workflows based on issue type
- **Templates**: Pre-fill form with template values
- **Draft system**: Auto-saves to workspace drafts, can be moved to projects later
- **GPT Assistant**: AI button to help write descriptions
- **Create more**: Toggle to keep modal open for rapid creation

---

## Cascade

### Trigger
- **Button**: "Create Issue" button in header/sidebar
- **No keyboard shortcut** (❌ Gap)

### UI Elements

**Modal Layout (single column dialog)**
- Standard Dialog component with title "Create Issue"

**Form Fields**
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Project | Dropdown | Required if not in context | Only shown when no projectId prop |
| Template | Dropdown | Optional | Applies preset values |
| Title | Text input | Required, min 1 char | Uses FormInput |
| AI Suggestions | Button | N/A | Generates description/priority/labels |
| Description | Textarea | Optional | Plain text, 6 rows |
| Type | Radix Select | Required | task, bug, story, epic, subtask |
| Priority | Radix Select | Required | lowest to highest |
| Assignee | Radix Select | Optional | "Unassigned" default |
| Story Points | Number input | Optional | step 0.5 |
| Labels | Toggle buttons | Optional | Multi-select via toggle |

**Footer**
- Cancel button (secondary)
- Create Issue button (primary with loading state)

### Flow
1. User clicks "Create Issue" button
2. Modal opens with focus on title (implicit)
3. If no projectId passed, user must select project first
4. Default template auto-selected if exists
5. User fills in title
6. Optionally clicks "Get AI Suggestions" for smart defaults
7. User fills remaining fields
8. Click "Create Issue"
9. Success toast shown
10. Modal closes

### Feedback
- **Loading**: Button shows loading spinner
- **Success**: Toast "Issue created successfully"
- **Error**: Toast with error details
- **AI Applied**: "AI suggestions applied" indicator shows

### Notable Features
- **AI Suggestions**: One-click AI to fill description, priority, labels
- **Templates**: Apply preset configurations
- **Label toggles**: Visual toggle buttons vs dropdown

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Keyboard shortcut | N/A | ✅ `C` | ❌ None | plane |
| Duplicate detection | N/A | ✅ Real-time | ❌ None | plane |
| Draft auto-save | N/A | ✅ Yes | ❌ None | plane |
| AI assistance | N/A | ✅ GPT in editor | ✅ AI button | tie |
| Templates | N/A | ✅ Full system | ✅ Basic | plane |
| Work item types | N/A | ✅ Configurable | ⚠️ Fixed list | plane |
| Rich text editor | N/A | ✅ Plane editor | ❌ Plain textarea | plane |
| Inline label create | N/A | ✅ Yes | ❌ No | plane |
| Create more toggle | N/A | ✅ Yes | ❌ No | plane |
| Assignee avatars | N/A | ✅ Yes | ✅ Yes | tie |
| Multiple assignees | N/A | ✅ Yes | ❌ No | plane |
| Start date | N/A | ✅ Yes | ❌ No | plane |
| Due date | N/A | ✅ Yes | ❌ No | plane |
| Cycle/Module link | N/A | ✅ Yes | ⚠️ Sprint only | plane |
| Parent issue | N/A | ✅ Yes | ❌ No | plane |
| Form validation | N/A | ✅ react-hook-form | ✅ TanStack Form + Zod | tie |

---

## Recommendations

### Priority 1: Add Keyboard Shortcut
Add global `C` shortcut to trigger create issue modal from anywhere in project context.

**Implementation:**
```tsx
// In CommandPalette or global key handler
useHotkeys('c', () => setCreateIssueOpen(true), { 
  enabled: isInProjectContext 
});
```

### Priority 2: Rich Text Editor for Description
Replace plain textarea with a proper rich text editor (TipTap or similar).

**Benefits:**
- Markdown support
- Image uploads
- @mentions
- Better parity with competitors

### Priority 3: Add "Create More" Toggle
Let power users create multiple issues without closing the modal.

### Priority 4: Duplicate Detection
Search existing issues as user types title, show warning if potential duplicates exist.

### Priority 5: Add Missing Fields
- Start date / Due date
- Parent issue selector
- Multiple assignees

### Priority 6: Auto-Save Drafts
Save form state to localStorage or backend draft system to prevent data loss.

---

## Screenshots/References

### Plane Code Paths
- Modal: `~/Desktop/plane/apps/web/core/components/issues/issue-modal/modal.tsx`
- Form: `~/Desktop/plane/apps/web/core/components/issues/issue-modal/form.tsx`
- Properties: `~/Desktop/plane/apps/web/core/components/issues/issue-modal/components/default-properties.tsx`
- Store: `~/Desktop/plane/apps/web/core/store/`

### Cascade Code Paths
- Modal: `~/Desktop/cascade/src/components/CreateIssueModal.tsx`
- Issue utils: `~/Desktop/cascade/src/lib/issue-utils.ts`
- Convex mutations: `~/Desktop/cascade/convex/issues.ts`
