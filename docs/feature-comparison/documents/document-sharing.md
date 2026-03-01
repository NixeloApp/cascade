# Document Sharing - Deep UX Comparison

## Overview
Document sharing controls who can view and edit documents. This includes access levels, permission management, collaboration features, and public link sharing. This analysis compares Plane vs Cascade across sharing controls, permissions, and UX efficiency.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Header icon** | Share button in header | Lock/Globe icon | Tie |
| **Document menu** | Actions dropdown | Menu dropdown | Tie |
| **Keyboard shortcut** | N/A | N/A | Tie |
| **Quick action** | Lock icon (1-click) | Toggle button | Tie |
| **Bulk share** | N/A | N/A | Tie |

---

## Layout Comparison

### Plane Sharing Controls
```
Document Header:
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back   📄 Document Title                                                  │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ [👥 Collaborators pile] [🔒 Lock] [🌐 Share ▼] [⭐ Fav] [📁 Move] [⋯]│  │
│ │         ↑                   ↑          ↑          ↑         ↑         │  │
│ │    Show editors        Lock page   Share menu  Favorite  Move page   │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Share Dropdown:
┌─────────────────────────────────────┐
│ Access                              │
│ ┌─────────────────────────────────┐ │
│ │ (●) 🔓 Public                   │ │
│ │     All project members can view│ │
│ │ ( ) 🔒 Private                  │ │
│ │     Only you can access         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [📋 Copy Link]                      │
│                                     │
└─────────────────────────────────────┘

Lock Control (when clicked):
┌─────────────────────────────────────┐
│ 🔒 Lock Page                        │
│ ─────────────────────────────────── │
│ ☐ Lock all child pages too         │
│                                     │
│         [Cancel] [Lock Page]        │
└─────────────────────────────────────┘

Locked State Indicator:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔒 Locked by Alice on Jan 15, 2026                              [Unlock]   │
│ ↑ Banner appears at top of editor                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Sharing Controls
```
Document Header:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📄 Document Title                                                           │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ [👥 3 online] [🔒/🌐 Toggle] [⋯ Menu]                                 │  │
│ │       ↑            ↑            ↑                                     │  │
│ │   Presence    Visibility    Actions                                   │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Visibility Toggle (click icon):
┌─────────────────────────────┐
│ Current: Private 🔒        │
│                            │
│ [Make Public]              │
│ All org members can view   │
└─────────────────────────────┘

OR

┌─────────────────────────────┐
│ Current: Public 🌐         │
│                            │
│ [Make Private]             │
│ Only you can access        │
└─────────────────────────────┘

Menu Dropdown:
┌─────────────────────────────────────┐
│ [📝 Edit Title]                     │
│ [📁 Move to...]                     │
│ [🔒 Make Private / 🌐 Make Public] │
│ ─────────────────────────────────── │
│ [🗑️ Delete]                         │
└─────────────────────────────────────┘
```

---

## Access Model Comparison

### Access Levels

| Level | Plane | Cascade |
|-------|-------|---------|
| **Public** | All project members | All organization members |
| **Private** | Owner only | Creator only |
| **Specific users** | EE feature | N/A |
| **Team-based** | EE feature | N/A |
| **External sharing** | EE feature | N/A |

### Scoping Model

| Scope | Plane | Cascade |
|-------|-------|---------|
| **Project-scoped** | Required | Optional |
| **Workspace-scoped** | N/A | Yes |
| **Organization-scoped** | N/A | Yes (default) |

---

## Permission Matrix

### Plane Permissions
```
Permission Flags (TBasePagePermissions):

| Permission                    | Owner | Project Editor | Project Viewer |
|-------------------------------|-------|----------------|----------------|
| canCurrentUserAccessPage      | ✅    | ✅ (if public) | ✅ (if public) |
| canCurrentUserEditPage        | ✅    | ✅ (if public) | ❌             |
| canCurrentUserDuplicatePage   | ✅    | ✅             | ❌             |
| canCurrentUserLockPage        | ✅    | ✅             | ❌             |
| canCurrentUserChangeAccess    | ✅    | ❌             | ❌             |
| canCurrentUserArchivePage     | ✅    | ❌             | ❌             |
| canCurrentUserDeletePage      | ✅    | ❌             | ❌             |
| canCurrentUserFavoritePage    | ✅    | ✅             | ✅             |
| canCurrentUserMovePage        | ✅    | ❌             | ❌             |
| isContentEditable             | ✅    | ✅ (if public) | ❌             |
```

### Cascade Permissions
```
Permission Rules (based on document visibility + project role):

| Scenario                      | Can View | Can Edit | Can Delete |
|-------------------------------|----------|----------|------------|
| Public doc, org member        | ✅       | ❌       | ❌         |
| Public doc, creator           | ✅       | ✅       | ✅         |
| Private doc, creator          | ✅       | ✅       | ✅         |
| Private doc, other user       | ❌       | ❌       | ❌         |
| Project doc, project viewer   | ✅       | ❌       | ❌         |
| Project doc, project editor   | ✅       | ✅       | ❌         |
| Project doc, project admin    | ✅       | ✅       | ✅         |
```

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Make public** | 2 clicks (Share → Public) | 2 clicks (icon → confirm) | Tie |
| **Make private** | 2 clicks (Share → Private) | 2 clicks (icon → confirm) | Tie |
| **Lock document** | 2 clicks (Lock → confirm) | N/A | Plane only |
| **Unlock document** | 1 click (Unlock button) | N/A | Plane only |
| **Copy link** | 2 clicks (Share → Copy) | N/A | Plane only |
| **Add to favorites** | 1 click (⭐) | N/A | Plane only |
| **Move document** | 3 clicks (Move → select → confirm) | 3 clicks (menu → select → confirm) | Tie |
| **Archive document** | 2 clicks (menu → archive) | N/A | Plane only |
| **Delete document** | 2 clicks (menu → delete) | 2 clicks (menu → delete) | Tie |
| **View collaborators** | Hover avatar pile | Hover presence | Tie |

---

## Sharing Features Comparison

### Sharing Controls

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Public/Private toggle** | Yes | Yes |
| **Copy shareable link** | Yes | No |
| **Link expiration** | No | N/A |
| **Password protection** | No | N/A |
| **Granular permissions** | EE | No |
| **Share with specific users** | EE | No |
| **Share with teams** | EE | No |
| **External sharing** | EE | No |

### Document Locking

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Lock page** | Yes | No |
| **Lock children** | Yes (recursive) | N/A |
| **Lock indicator** | Banner + icon | N/A |
| **Lock owner info** | Yes (name, date) | N/A |
| **Force unlock (admin)** | Unknown | N/A |

### Organization

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Favorites** | Yes (star) | No |
| **Archive/Restore** | Yes | Soft delete only |
| **Move between projects** | Yes | Yes |
| **Document hierarchy** | No | Yes |
| **Breadcrumbs** | No | Yes |

---

## Collaboration Display

### Plane Collaborators
```
Header Area:
┌─────────────────────────────────────────────────────────────────┐
│                    👤👤👤 +2                                    │
│                     ↑ Avatar pile shows active editors          │
│                     └─ Click to see full list                   │
└─────────────────────────────────────────────────────────────────┘

Expanded View:
┌─────────────────────────────────────┐
│ Currently Editing:                  │
│ 🟢 Alice (active)                   │
│ 🟢 Bob (active)                     │
│ 🟡 Carol (idle)                     │
│ ─────────────────────────────────── │
│ Recent Editors:                     │
│ Dave - 2 hours ago                  │
│ Eve - Yesterday                     │
└─────────────────────────────────────┘
```

### Cascade Collaborators
```
Header Area:
┌─────────────────────────────────────────────────────────────────┐
│                    👥 3 online                                  │
│                     ↑ Count badge                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Hover Tooltip:
┌─────────────────────────────────────┐
│ 🔴 Alice                            │
│ 🟢 Bob                              │
│ 🔵 Carol                            │
│ ↑ Colors match cursors in editor    │
└─────────────────────────────────────┘

Presence Indicator Component:
┌─────────────────────────────────────┐
│ 👤 👤 👤                             │
│ ↑ Avatar pile with online dots      │
└─────────────────────────────────────┘
```

---

## Document Hierarchy (Cascade Only)

### Tree Structure
```
Documents
├─ 📄 Product Roadmap
│   ├─ 📄 Q1 Goals
│   ├─ 📄 Q2 Goals
│   └─ 📄 Technical Spec
│       ├─ 📄 API Design
│       └─ 📄 Database Schema
├─ 📄 Meeting Notes
│   ├─ 📄 Standup Jan 15
│   └─ 📄 Sprint Review
└─ 📄 Engineering Wiki
```

### Breadcrumbs Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│ Documents › Product Roadmap › Technical Spec › API Design      │
│     ↑             ↑                ↑              ↑             │
│   Root       Parent 1          Parent 2       Current           │
│ (clickable)  (clickable)      (clickable)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comments System (Cascade Only)

### Comment Thread
```
┌─────────────────────────────────────────────────────────────────┐
│ Comments (3)                                               [+]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Alice • 2 hours ago                                      │ │
│ │ Great progress on this document! @Bob can you review?       │ │
│ │                                        [👍 2] [💬 Reply] [⋯]│ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │   👤 Bob • 1 hour ago                                       │ │
│ │   Sure, I'll take a look this afternoon.                    │ │
│ │                                            [👍 1] [💬] [⋯] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Carol • 30 minutes ago                                   │ │
│ │ Should we add a section about deployment?                   │ │
│ │                                              [👍] [💬] [⋯] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Add a comment...                                       [📤] │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Comment Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Add comments** | No | Yes |
| **Threaded replies** | N/A | Yes |
| **@mentions in comments** | N/A | Yes |
| **Emoji reactions** | N/A | Yes |
| **Edit own comments** | N/A | Yes |
| **Delete own comments** | N/A | Yes |
| **Rate limiting** | N/A | 60/min |

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Toggle visibility** | N/A | N/A |
| **Lock document** | N/A | N/A |
| **Copy link** | N/A | N/A |
| **Add to favorites** | F (global?) | N/A |
| **Archive** | N/A | N/A |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Access levels | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both have public/private |
| Page locking | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Favorites | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Copy link | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Archive/restore | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane full archive |
| Move documents | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both supported |
| Document hierarchy | ⭐ | ⭐⭐⭐⭐⭐ | Cascade parent/child |
| Breadcrumbs | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Comments | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Emoji reactions | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Collaborator display | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane richer |
| Granular permissions | ⭐⭐⭐⭐⭐ (EE) | ⭐⭐ | Plane EE feature |
| Security isolation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both multi-tenant |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add page lock/unlock** - Prevent concurrent editing conflicts
   ```tsx
   // Schema addition
   documents: defineTable({
     // ... existing
     isLocked: v.optional(v.boolean()),
     lockedBy: v.optional(v.id("users")),
     lockedAt: v.optional(v.number()),
   })
   ```

### P1 - High
2. **Add favorites system** - Star documents for quick access
   ```tsx
   // New table
   documentFavorites: defineTable({
     documentId: v.id("documents"),
     userId: v.id("users"),
   }).index("by_user", ["userId"])
   ```

3. **Add copy shareable link** - One-click copy URL with access check
4. **Add archive/restore** - Soft archive instead of hard delete

### P2 - Medium
5. **Add collaborator list view** - Expand to see all active editors
6. **Add lock recursive option** - Lock all child documents
7. **Add share with specific users** - Share with select org members

### P3 - Nice to Have
8. **Add link expiration** - Time-limited share links
9. **Add password protection** - Password-protected public links
10. **Add share analytics** - Track who viewed shared documents
11. **Add external sharing** - Share with users outside organization

---

## Code References

### Plane
- Access control: `apps/web/core/store/pages/base-page.ts` (permissions)
- Header actions: `apps/web/core/components/pages/header/actions.tsx`
- Lock control: `apps/web/core/components/pages/header/lock-control.tsx`
- Share control: `apps/web/core/components/pages/header/share-control.tsx`
- Favorites: `apps/web/core/components/pages/header/favorites-control.tsx`
- Service: `apps/web/core/services/page/project-page.service.ts`
- Page store: `apps/web/core/store/pages/project-page.store.ts`

### Cascade
- Backend: `convex/documents.ts` (togglePublic, permissions)
- Security tests: `convex/documentsPermissionSecurity.test.ts`
- Document header: `src/components/DocumentHeader.tsx`
- Move dialog: `src/components/MoveDocumentDialog.tsx`
- Presence indicator: `src/components/PresenceIndicator.tsx`
- Collaborators: `src/components/Plate/Collaborators.tsx`
- Comments: `src/components/DocumentComments.tsx`

### Cascade Data Structures
```typescript
// Document with hierarchy
interface Document {
  _id: Id<"documents">;
  title: string;
  isPublic: boolean;
  createdBy: Id<"users">;
  organizationId: Id<"organizations">;
  projectId?: Id<"projects">;
  workspaceId?: Id<"workspaces">;
  parentDocumentId?: Id<"documents">; // Hierarchy
  order: number; // Sibling order
}

// Comment with threading
interface DocumentComment {
  _id: Id<"documentComments">;
  documentId: Id<"documents">;
  userId: Id<"users">;
  content: string;
  parentCommentId?: Id<"documentComments">; // Threading
  reactions: { emoji: string; userId: Id<"users"> }[];
}
```
