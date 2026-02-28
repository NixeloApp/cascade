# Create Issue - Deep UX Comparison

## Overview
The create issue flow is one of the most critical UX paths in any project management tool. This analysis compares Plane vs Cascade across every UX dimension.

---

## Entry Points Comparison

### How Users Trigger "Create Issue"

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Keyboard shortcut** | ✅ `C` (global) | ✅ `C` (global) | Tie |
| **Sidebar button** | ✅ "New work item" with icon | ✅ Button in sidebar | Tie |
| **Header button** | ✅ Per-view header buttons | ✅ Per-page header | Tie |
| **Right-click context menu** | ✅ On board columns/list items | ❌ None | Plane |
| **Empty state CTA** | ✅ "Create your first issue" button | ✅ Empty state button | Tie |
| **Command palette** | ✅ `Cmd+K` → "Create issue" | ❌ No command palette | Plane |
| **Floating action button (mobile)** | ❌ | ❌ | Tie |
| **Quick add row in list** | ✅ Inline row at bottom | ❌ | Plane |
| **Drag from draft** | ✅ Draft sidebar → drag to project | ❌ | Plane |

**Entry Points Score:** Plane 5, Cascade 0, Tie 5

---

## Button/Trigger Locations

### Plane
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] [Search] [Notifications] [+] ← Header create    │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Project View Header                        │
│          │  ┌──────────────────────────────────────┐   │
│ [+ New   │  │ [Filters] [Display] [+ Add Issue] ← │   │
│  Item] ← │  └──────────────────────────────────────┘   │
│          │                                              │
│ Favorites│  Board/List/Calendar                        │
│ Projects │  ┌─────────┬─────────┬─────────┐            │
│          │  │ Column  │ Column  │ Column  │            │
│          │  │ [+] ←───┼─[+]─────┼─[+]     │ ← Per-col  │
│          │  │ Card    │ Card    │ Card    │            │
│          │  │ [⋮] ────┼─────────┼─────────│ ← Context  │
│          │  └─────────┴─────────┴─────────┘   menu     │
└──────────┴──────────────────────────────────────────────┘
```

### Cascade
```
┌─────────────────────────────────────────────────────────┐
│ [Logo] [Breadcrumb] [Search]        [Create Issue] ←   │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Project View Header                        │
│          │  ┌──────────────────────────────────────┐   │
│ Projects │  │ [Filters] [Display] [+ Create] ←     │   │
│ Docs     │  └──────────────────────────────────────┘   │
│ Settings │                                              │
│          │  Board/List/Calendar                        │
│          │  ┌─────────┬─────────┬─────────┐            │
│          │  │ Column  │ Column  │ Column  │            │
│          │  │ [+] ←───┼─[+]─────┼─[+]     │ ← Per-col  │
│          │  │ Card    │ Card    │ Card    │            │
│          │  └─────────┴─────────┴─────────┘            │
└──────────┴──────────────────────────────────────────────┘
```

---

## Modal Analysis

### Modal Dimensions & Position

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Width** | ~720px (2-col when duplicates) | ~500px (single col) |
| **Height** | Dynamic, max 80vh | Dynamic, max 85vh |
| **Position** | Center, fixed | Center, fixed |
| **Backdrop** | Semi-transparent overlay | Semi-transparent overlay |
| **Animation** | Fade + scale in | Fade + scale in |
| **Z-index** | Modal layer (50) | Modal layer (50) |

### Modal Structure

**Plane (2-column layout possible):**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create new issue                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Project ▼] [Type ▼] [Template ▼]        [2 duplicates found →] ←  │
├────────────────────────────────────┬────────────────────────────────┤
│                                    │ Duplicate Panel (optional)     │
│ ┌─ Parent tag (if set) ──────────┐│ ┌──────────────────────────┐  │
│ │ Sub-issue of PROJ-123          ││ │ Similar: PROJ-456        │  │
│ └────────────────────────────────┘│ │ "Fix login button..."    │  │
│                                    │ │ [View] [Link as dup]     │  │
│ [Title input - large, focused] ←   │ └──────────────────────────┘  │
│                                    │ ┌──────────────────────────┐  │
│ ┌─ Rich text editor ─────────────┐│ │ Similar: PROJ-789        │  │
│ │ [B][I][Link][Code][AI ✨]      ││ │ "Login page not..."      │  │
│ │                                ││ │ [View] [Link as dup]     │  │
│ │ Description with markdown...   ││ └──────────────────────────┘  │
│ │                                ││                                │
│ └────────────────────────────────┘│                                │
├────────────────────────────────────┴────────────────────────────────┤
│ Properties (collapsible sections)                                    │
│ ┌───────────┬───────────┬───────────┬───────────┬─────────────────┐│
│ │ State ▼   │ Priority ▼│ Assignees │ Labels    │ Dates           ││
│ │ Backlog   │ None      │ [+Add]    │ [+Add]    │ Start: [date]   ││
│ └───────────┴───────────┴───────────┴───────────┴─────────────────┘│
│ [+ Add more properties]                                              │
├─────────────────────────────────────────────────────────────────────┤
│ [□ Create more]                         [Discard] [Save] ←          │
└─────────────────────────────────────────────────────────────────────┘
```

**Cascade (single column):**
```
┌───────────────────────────────────────────┐
│ Create Issue                        [×]   │
├───────────────────────────────────────────┤
│ ┌─ Draft restored banner ───────────────┐ │
│ │ Draft from 2 min ago restored [×]     │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ Project (if no context)                   │
│ [Select project ▼]                        │
│                                           │
│ Template                                  │
│ [Select template ▼]                       │
│                                           │
│ Title *                                   │
│ [Enter issue title...              ]      │
│                                           │
│ ┌─ AI Suggestions ──────────────────────┐ │
│ │ [✨ Generate AI Suggestions]          │ │
│ │ Applied: description, priority        │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ Description                               │
│ ┌───────────────────────────────────────┐ │
│ │ [Plain textarea, 6 rows]              │ │ ← NOT rich text
│ └───────────────────────────────────────┘ │
│                                           │
│ [Type ▼ Task    ] [Priority ▼ None   ]   │
│                                           │
│ Assignee              Story Points        │
│ [Select ▼    ]        [Select ▼    ]     │
│                                           │
│ Labels                                    │
│ [Bug ×] [Feature ×] [+ Add] [+ Create]   │
│                                           │
│ ┌─ Duplicates (if found) ───────────────┐ │
│ │ ⚠ 2 potential duplicates found        │ │
│ │ • PROJ-123: Fix login...              │ │
│ │ • PROJ-456: Login page...             │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ [□ Create another]                        │
│                                           │
│            [Cancel] [Create Issue]        │
└───────────────────────────────────────────┘
```

---

## Form Fields Comparison

| Field | Plane | Cascade | Notes |
|-------|-------|---------|-------|
| **Project selector** | ✅ Dropdown, disabled if in context | ✅ Dropdown, hidden if in context | Similar |
| **Issue type** | ✅ Dropdown with icons | ✅ Radio-style dropdown | Similar |
| **Template** | ✅ Dropdown, resets form | ✅ Dropdown, resets form | Similar |
| **Title** | ✅ Large input, auto-focus | ✅ Standard input, auto-focus | Plane larger |
| **Description** | ✅ **Rich text** (markdown, images, mentions) | ❌ **Plain textarea** | **Plane wins** |
| **State/Status** | ✅ Dropdown | ❌ Not in create modal | Plane |
| **Priority** | ✅ Dropdown with icons | ✅ Dropdown with icons | Tie |
| **Assignee** | ✅ Multi-select with avatars | ✅ Single-select with avatar | Plane (multi) |
| **Labels** | ✅ Multi-select | ✅ Multi-select + inline create | Cascade (inline create) |
| **Start date** | ✅ Date picker | ❌ Not in create modal | Plane |
| **Due date** | ✅ Date picker | ✅ Pre-filled from calendar | Tie |
| **Estimate/Points** | ✅ Dropdown (when enabled) | ✅ Dropdown | Tie |
| **Cycle/Sprint** | ✅ Dropdown (when in context) | ✅ Auto-assigned from context | Tie |
| **Module** | ✅ Multi-select | N/A | Plane |
| **Parent issue** | ✅ Search modal | ❌ Not in create modal | Plane |

**Field Count:** Plane ~14 fields, Cascade ~9 fields

---

## Click Analysis

### Minimum Clicks to Create Issue

| Scenario | Plane | Cascade |
|----------|-------|---------|
| **Basic issue (title only)** | 2 clicks (open + save) | 2 clicks |
| **Issue with priority** | 4 clicks | 4 clicks |
| **Issue with assignee** | 5 clicks | 5 clicks |
| **Issue with description** | 2 clicks + typing | 2 clicks + typing |
| **Issue with new label** | 6+ clicks (separate flow) | 4 clicks (inline) |

### Keyboard Efficiency

| Action | Plane | Cascade |
|--------|-------|---------|
| **Open modal** | `C` | `C` |
| **Tab through fields** | ✅ Full tab support | ✅ Full tab support |
| **Submit** | `Cmd+Enter` | `Enter` (on button focus) |
| **Close** | `Escape` | `Escape` |
| **Create another** | Toggle stays, Enter submits | Toggle stays, button click |

---

## Special Features Comparison

### Duplicate Detection

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Trigger** | Debounced title + description search | Debounced title search |
| **Display** | Side panel (2-column layout) | Inline alert box |
| **Actions** | View, Link as duplicate | View only |
| **Dismiss** | Toggle panel closed | Alert dismisses auto |

### AI Assistance

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Trigger** | Button in description editor | Separate "Generate" button |
| **Capabilities** | Description writing | Description, priority, labels |
| **Integration** | Inline in editor | Populates form fields |

### Draft System

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Auto-save** | ✅ To workspace drafts | ✅ To localStorage |
| **Recovery** | Sidebar draft list, re-open | Banner on modal open |
| **Per-project** | ✅ Workspace-wide drafts | ✅ Per-project drafts |
| **Move to project** | ✅ Drag draft to project | ❌ Auto-restores only |

### Create More Toggle

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Location** | Footer, left side | Footer, left side |
| **Behavior** | Resets form, keeps project/type | Resets form, keeps project |
| **Shortcut** | None | None |

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Focus trap** | ✅ | ✅ |
| **Escape to close** | ✅ | ✅ |
| **Screen reader labels** | ✅ aria-labels | ✅ aria-labels |
| **Required field indicators** | ✅ Asterisk + validation | ✅ Asterisk + validation |
| **Error messages** | ✅ Inline + toast | ✅ Inline + toast |
| **Tab order** | ✅ Logical | ✅ Logical |
| **Color contrast** | ✅ | ✅ |

---

## Loading & Error States

| State | Plane | Cascade |
|-------|-------|---------|
| **Initial load** | Skeleton in fields | Full modal loads |
| **Submitting** | Button spinner + disabled | Button spinner + disabled |
| **Success** | Toast + close/reset | Toast + close/reset |
| **Error** | Toast with message | Toast with message |
| **Validation** | Inline red borders + text | Inline red borders + text |

---

## Mobile/Responsive

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Modal width** | Full width on mobile | Full width on mobile |
| **Input sizing** | Touch-friendly | Touch-friendly |
| **Duplicate panel** | Stacks below form | Inline (same layout) |
| **Sticky footer** | ✅ Fixed buttons | ✅ Fixed buttons |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Entry points | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has more ways to create |
| Form completeness | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has more fields |
| Description editor | ⭐⭐⭐⭐⭐ | ⭐⭐ | **Plane: rich text, Cascade: plain** |
| Duplicate detection | ⭐⭐⭐⭐ | ⭐⭐⭐ | Plane side-panel UX better |
| Inline label create | ⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade wins here |
| Draft system | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane's sidebar drafts better |
| AI assistance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both have AI |
| Click efficiency | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Similar |
| Keyboard support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane slightly better |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Rich text description editor** - Replace textarea with Plate/TipTap. Biggest gap.

### P1 - High
2. **Command palette** - Add `Cmd+K` with "Create issue" action
3. **Right-click context menu** - On board cards and columns
4. **State selector in create modal** - Let users set initial state

### P2 - Medium
5. **Multi-assignee support** - Allow multiple assignees
6. **Quick add row in list view** - Inline creation without modal
7. **Parent issue selector** - Sub-issue creation from modal
8. **Start date field** - Add to modal

### P3 - Nice to Have
9. **Draft sidebar** - Visual draft management
10. **Duplicate side panel** - 2-column layout for better UX

---

## Code References

### Plane
- Modal: `apps/web/core/components/issues/issue-modal/modal.tsx`
- Form: `apps/web/core/components/issues/issue-modal/form.tsx`
- Components: `apps/web/core/components/issues/issue-modal/components/`
- Trigger: `apps/web/core/components/workspace/sidebar/quick-actions.tsx`
- Shortcuts: Uses `useCommandPalette` hook from `hooks/store/use-command-palette`

### Cascade
- Modal: `src/components/CreateIssueModal.tsx` (597 lines)
- Draft hook: `src/hooks/useDraftAutoSave.ts`
- Duplicate detection: `src/components/DuplicateDetection.tsx`
- Issue utils: `src/lib/issue-utils.ts`
- Convex mutations: `convex/issues.ts`
