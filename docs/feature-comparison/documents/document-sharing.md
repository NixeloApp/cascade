# Document Sharing

## Overview

Document sharing controls who can view and edit documents. This includes access levels, permission management, collaboration features, and public link sharing.

---

## plane

### Access Model

**Access Levels** (`EPageAccess` enum):
- `PUBLIC` — Visible to all project members
- `PRIVATE` — Restricted to owner only

### Permissions System

**Permission Matrix** (`TBasePagePermissions`):

| Permission | Description |
|------------|-------------|
| `canCurrentUserAccessPage` | View access |
| `canCurrentUserEditPage` | Edit access |
| `canCurrentUserDuplicatePage` | Copy page |
| `canCurrentUserLockPage` | Lock/unlock |
| `canCurrentUserChangeAccess` | Toggle public/private |
| `canCurrentUserArchivePage` | Archive page |
| `canCurrentUserDeletePage` | Delete page |
| `canCurrentUserFavoritePage` | Add to favorites |
| `canCurrentUserMovePage` | Move between projects |
| `isContentEditable` | Overall edit flag |

### Page Actions

**Sharing Controls** (Header actions):
- Make Public / Make Private toggle
- Copy link button
- Lock/Unlock page
- Move to different project

**Lock Feature**:
- Prevents concurrent editing
- Shows lock icon when active
- Recursive lock option (lock children)
- Only lock owner can unlock

### Collaborative Features

**Active Collaborators**:
- Avatar list in header
- Shows who's currently viewing/editing
- Color-coded cursors in editor
- Real-time presence via HocuspocusDocs

**Enterprise Features** (EE):
- Granular permission controls
- Team-based access
- Share with external users

### Service Methods

```typescript
// Access control
updateAccess(workspaceSlug, projectId, pageId, { access })
  → POST /api/.../pages/{pageId}/access/

// Locking
lock() → POST /api/.../pages/{pageId}/lock/
unlock() → DELETE /api/.../pages/{pageId}/lock/

// Archiving
archive() → POST /api/.../pages/{pageId}/archive/
restore() → DELETE /api/.../pages/{pageId}/archive/

// Favorites
addToFavorites() → POST /api/.../favorite-pages/{pageId}/
removeFromFavorites() → DELETE /api/.../favorite-pages/{pageId}/
```

### Page Organization

**Favorites**: Star pages for quick access
**Archive**: Soft-delete with restore option
**Move**: Transfer pages between projects

---

## Cascade

### Access Model

**Visibility Levels**:
- `isPublic: true` — Visible to all organization members
- `isPublic: false` — Creator-only access (with exceptions)

**Scoping**:
- Organization-scoped (default)
- Workspace-scoped (editors + admins)
- Project-scoped (project members)

### Permissions System

**Access Rules**:

| Scenario | Can View | Can Edit |
|----------|----------|----------|
| Public document, org member | Yes | Creator only |
| Private document, creator | Yes | Yes |
| Private document, other user | No | No |
| Project document, project member | Yes | Editor role |
| Workspace document, workspace editor | Yes | Yes |

### Sharing Controls

**Toggle Visibility** (`togglePublic` mutation):
- Button in DocumentHeader
- Requires EDITOR permission on linked project
- Only document creator can toggle
- Validation prevents viewers from making public

**UI**:
- Lock icon for private documents
- Globe icon for public documents
- Click to toggle (if permitted)

### Security Enforcement

**Multi-tenant Isolation**:
- Organization membership checked
- Cross-org access blocked
- Tests in `documentsPermissionSecurity.test.ts`

**RBAC Integration**:
- Uses project role (EDITOR, VIEWER)
- Workspace role inheritance
- Admin override capabilities

### Collaborative Features

**Presence Indicators**:
- Component: `PresenceIndicator.tsx`
- Shows active editors count
- Avatar pile of collaborators
- Uses Convex presence API

**Collaborators Display**:
- Component: `Collaborators.tsx`
- Cursor colors per user
- Online indicator dots
- Names on hover

### Document Hierarchy

**Parent-Child Relationships**:
- Documents can have parent documents
- Nested organization structure
- Order field for siblings
- Breadcrumbs navigation

**Operations**:
- `moveDocument`: Change parent
- `reorderDocuments`: Reorder siblings
- `getTree`: Build full hierarchy
- `getBreadcrumbs`: Path to root

### Comments System

**Features**:
- Add comments to documents
- Threading (reply to comments)
- Emoji reactions
- Mentions in comments
- Soft delete (author only)

**Rate Limiting**: 60 comments per minute

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Access levels | Public/Private | Public/Private | tie |
| Project scoping | Always required | Optional | Cascade |
| Lock/unlock | Yes | No | plane |
| Move between projects | Yes | No | plane |
| Favorites | Yes | No | plane |
| Archive/restore | Yes | Soft delete | plane |
| Collaborator display | Yes (avatars) | Yes (avatars) | tie |
| Document hierarchy | No | Yes (parent/child) | Cascade |
| Comments | No | Yes | Cascade |
| Emoji reactions | No | Yes (on comments) | Cascade |
| Granular permissions | EE only | Project-based | Cascade |
| Multi-tenant isolation | Yes | Yes | tie |
| Rate limiting | Unknown | Yes | Cascade |
| Breadcrumbs | No | Yes | Cascade |

---

## Recommendations

1. **Priority 1**: Add page lock/unlock feature
   - Prevent concurrent edits
   - Lock icon in header
   - Only lock owner can unlock

2. **Priority 2**: Add favorites system
   - Star documents
   - Quick access list
   - Sidebar favorites section

3. **Priority 3**: Add archive/restore
   - Soft archive (not delete)
   - Archived documents tab
   - Restore with one click

4. **Priority 4**: Add move between projects
   - Move document to different project
   - Update permissions accordingly
   - Maintain hierarchy

5. **Priority 5**: Add share link generation
   - Copy shareable link
   - Optional expiration
   - Password protection (optional)

---

## Implementation: Page Lock

```typescript
// Schema addition
documents: defineTable({
  // ... existing fields
  isLocked: v.optional(v.boolean()),
  lockedBy: v.optional(v.id("users")),
  lockedAt: v.optional(v.number()),
})

// Lock mutation
export const lockDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    // Check if already locked by someone else
    if (doc.isLocked && doc.lockedBy !== userId) {
      const locker = await ctx.db.get(doc.lockedBy!);
      throw new Error(`Document locked by ${locker?.name}`);
    }

    await ctx.db.patch(args.documentId, {
      isLocked: true,
      lockedBy: userId,
      lockedAt: Date.now(),
    });

    return { success: true };
  },
});

// Unlock mutation
export const unlockDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    // Only lock owner can unlock
    if (doc.lockedBy !== userId) {
      throw new Error("Only the lock owner can unlock");
    }

    await ctx.db.patch(args.documentId, {
      isLocked: false,
      lockedBy: undefined,
      lockedAt: undefined,
    });

    return { success: true };
  },
});
```

---

## Implementation: Favorites

```typescript
// Schema addition (separate table)
documentFavorites: defineTable({
  documentId: v.id("documents"),
  userId: v.id("users"),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_document", ["documentId"])
  .index("by_user_document", ["userId", "documentId"]),

// Add to favorites
export const addToFavorites = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already favorited
    const existing = await ctx.db
      .query("documentFavorites")
      .withIndex("by_user_document", q =>
        q.eq("userId", userId).eq("documentId", args.documentId)
      )
      .first();

    if (existing) return { success: true };

    await ctx.db.insert("documentFavorites", {
      documentId: args.documentId,
      userId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// List favorites
export const listFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("documentFavorites")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const documents = await Promise.all(
      favorites.map(f => ctx.db.get(f.documentId))
    );

    return documents.filter(Boolean);
  },
});
```

---

## Screenshots/References

### plane
- Access control: `~/Desktop/plane/apps/web/core/store/pages/base-page.ts`
- Header actions: `~/Desktop/plane/apps/web/core/components/pages/header/actions.tsx`
- Lock control: `~/Desktop/plane/apps/web/core/components/pages/header/lock-control.tsx`
- Share control: `~/Desktop/plane/apps/web/core/components/pages/header/share-control.tsx`
- Service: `~/Desktop/plane/apps/web/core/services/page/project-page.service.ts`

### Cascade
- Backend: `~/Desktop/cascade/convex/documents.ts` (togglePublic, permissions)
- Security tests: `~/Desktop/cascade/convex/documentsPermissionSecurity.test.ts`
- Header: `~/Desktop/cascade/src/components/DocumentHeader.tsx`
- Presence: `~/Desktop/cascade/src/components/PresenceIndicator.tsx`
- Comments: `~/Desktop/cascade/src/components/DocumentComments.tsx`
