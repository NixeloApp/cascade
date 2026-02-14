# Documents Page - Implementation

> **Priority**: MEDIUM (Phase 2 - Content Features)
> **Scope**: Tree polish, hover actions, drag-drop
> **Estimated Complexity**: Medium-High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/_auth/_app/$orgSlug/documents/index.tsx` | POLISH | Search, layout |
| `src/components/documents/DocumentTree.tsx` | ENHANCE | Drag-drop, keyboard |
| `src/components/documents/FolderRow.tsx` | ENHANCE | Expand animation, actions |
| `src/components/documents/DocumentRow.tsx` | ENHANCE | Hover actions, icons |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/documents/TreeSearch.tsx` | Search/filter input |
| `src/components/documents/RowActions.tsx` | Quick action buttons |
| `src/components/documents/DropIndicator.tsx` | Drop target visual |

---

## Functionality Breakdown

### Core Actions
- [x] View document tree
- [x] Expand/collapse folders
- [x] Create document
- [x] Create folder
- [x] Navigate to document
- [ ] **Polish**: Smooth expand animation
- [ ] **Enhancement**: Drag-drop reordering
- [ ] **Enhancement**: Quick search

### Document Actions
- [x] Delete document
- [x] Edit document (navigate to editor)
- [ ] **Enhancement**: Rename inline
- [ ] **Enhancement**: Duplicate
- [ ] **Enhancement**: Move to folder

### Folder Actions
- [x] Delete folder
- [x] Create nested document
- [ ] **Enhancement**: Rename inline
- [ ] **Enhancement**: Move folder

---

## Verification Checklist

### Phase 1: Tree Polish

- [ ] Consistent 16px indentation per level
- [ ] Smooth expand/collapse animation
- [ ] Chevron rotation animation
- [ ] Row hover background

### Phase 2: Row Actions

- [ ] Create RowActions component
- [ ] Show on hover (opacity transition)
- [ ] Add child document button
- [ ] More actions dropdown (rename, move, delete)

### Phase 3: Document Icons

- [ ] Add document type detection
- [ ] Different icons for doc types
- [ ] Folder icon with chevron
- [ ] Empty folder indicator

### Phase 4: Search/Filter

- [ ] Add search input to header
- [ ] Filter tree by search query
- [ ] Highlight matching text
- [ ] Clear search button

### Phase 5: Drag and Drop

- [ ] Implement drag start/end handlers
- [ ] Create drop indicator component
- [ ] Handle folder drop targets
- [ ] Handle reordering
- [ ] Update backend on drop

### Phase 6: Keyboard Navigation

- [ ] Arrow up/down navigation
- [ ] Arrow right to expand
- [ ] Arrow left to collapse
- [ ] Enter to open
- [ ] Delete key handler
- [ ] `N` for new document

---

## Component Implementation

### FolderRow Enhanced

```tsx
export function FolderRow({ folder, level, isExpanded, onToggle, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded]); // Removed children from dependency array, use expanded state or ResizeObserver if content changes dynamically

  return (
    <div>
      <div
        className={cn(
          "tree-row flex items-center h-8 px-2 rounded-md cursor-pointer",
          "transition-colors duration-150",
          "hover:bg-ui-bg-secondary group"
        )}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={onToggle}
      >
        <ChevronIcon
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <FolderIcon className="w-4 h-4 ml-1 text-ui-text-secondary" />
        <Typography variant="small" className="ml-2 flex-1 truncate">
          {folder.name}
        </Typography>
        <div className="row-actions opacity-0 group-hover:opacity-100 transition-opacity">
          <RowActions item={folder} />
        </div>
      </div>

      {/* Animated content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200"
        style={{ height: isExpanded ? contentHeight : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
```

### DocumentRow Enhanced

```tsx
export function DocumentRow({ document, level }: Props) {
  return (
    <Link
      to={ROUTES.documents.detail(slug, document._id)}
      className={cn(
        "tree-row flex items-center h-8 px-2 rounded-md",
        "transition-colors duration-150",
        "hover:bg-ui-bg-secondary group"
      )}
      style={{ paddingLeft: `${level * 16 + 20}px` }}
    >
      <DocumentIcon className="w-4 h-4 text-ui-text-tertiary" />
      <Typography variant="small" className="ml-2 flex-1 truncate">
        {document.title}
      </Typography>
      <Typography variant="caption" className="text-ui-text-tertiary mr-2">
        {formatRelativeTime(document.updatedAt)}
      </Typography>
      <div className="row-actions opacity-0 group-hover:opacity-100 transition-opacity">
        <RowActions item={document} />
      </div>
    </Link>
  );
}
```

### TreeSearch

```tsx
export function TreeSearch({ value, onChange }: Props) {
  return (
    <div className="relative mb-4">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-text-tertiary" />
      <Input
        type="text"
        placeholder="Search documents..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <XIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
```

---

## CSS Additions

```css
/* Tree row styles */
.tree-row {
  transition: background-color 0.15s ease;
}

.tree-row:hover {
  background-color: var(--color-ui-bg-secondary);
}

/* Expand animation */
.folder-content {
  overflow: hidden;
  transition: height 0.2s ease-out;
}

/* Chevron rotation */
.chevron-icon {
  transition: transform 0.2s ease;
}

.chevron-icon[data-expanded="true"] {
  transform: rotate(90deg);
}

/* Row actions reveal */
.row-actions {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tree-row:hover .row-actions {
  opacity: 1;
}

/* Drop indicator */
.drop-indicator {
  height: 2px;
  background-color: var(--color-brand);
  margin: 0 8px;
}

/* Dragging state */
.tree-row[data-dragging="true"] {
  opacity: 0.5;
  background-color: var(--color-brand-subtle);
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test keyboard navigation
3. Test drag-and-drop with nested items
4. Run `pnpm fixme` to verify no errors
5. Run `node scripts/validate.js` for design tokens
6. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark-filled.png` | Current filled state |
| `screenshots/desktop-dark-empty.png` | Current empty state |
| `screenshots/reference-notion-sidebar.png` | Notion reference |
