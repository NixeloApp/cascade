# Document Editor Page - Implementation

> **Priority**: HIGH (Phase 4 - Core App Features)
> **Scope**: Document sidebar, simplified header, new blocks
> **Estimated Complexity**: High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/_auth/_app/$orgSlug/documents/$id.tsx` | REWRITE | Two-column layout |
| `src/components/editor/DocumentEditor.tsx` | ENHANCE | Sidebar integration |
| `src/components/editor/DocumentHeader.tsx` | SIMPLIFY | Branch + publish only |
| `src/components/editor/BlockNoteEditor.tsx` | ENHANCE | New block types |
| `src/components/editor/SlashMenu.tsx` | ENHANCE | Callout/card options |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/editor/DocumentSidebar.tsx` | Navigation tree |
| `src/components/editor/SidebarSection.tsx` | Collapsible group |
| `src/components/editor/SidebarItem.tsx` | Document link |
| `src/components/editor/BranchSelector.tsx` | Branch dropdown |
| `src/components/editor/PublishButton.tsx` | Green CTA |
| `src/components/editor/CalloutBlock.tsx` | Rich callout |
| `src/components/editor/CardGridBlock.tsx` | Two-column cards |
| `src/components/editor/SyncIndicator.tsx` | Save status |

---

## Functionality Breakdown

### Document Navigation
- [ ] **Sidebar**: Hierarchical document tree
- [ ] **Sections**: Collapsible navigation groups
- [ ] **Selected state**: Highlight current document
- [ ] **External links**: Arrow icon indicator
- [ ] **Add new**: Create document in section

### Rich Text Editing
- [x] Basic formatting (bold, italic, etc.)
- [x] Headings, lists, quotes
- [x] Code blocks
- [x] Tables, images
- [ ] **Enhancement**: Callout blocks
- [ ] **Enhancement**: Card grid blocks
- [ ] **Enhancement**: Embeds

### Collaboration
- [x] Presence avatars
- [x] Y.js sync
- [ ] **Enhancement**: Colored cursors
- [ ] **Enhancement**: Selection highlighting
- [ ] **Polish**: Save indicator

### Publishing
- [ ] Branch selector dropdown
- [ ] Publish button (green CTA)
- [ ] Preview mode
- [ ] Compare changes

---

## Verification Checklist

### Phase 1: Sidebar Implementation

- [ ] Create DocumentSidebar component
- [ ] Implement SidebarSection (collapsible)
- [ ] Implement SidebarItem with hover states
- [ ] Add "Add new" button
- [ ] Style active/selected state
- [ ] Handle external link indicators

### Phase 2: Header Simplification

- [ ] Remove cluttered action buttons
- [ ] Add BranchSelector dropdown
- [ ] Add PublishButton (green)
- [ ] Add preview toggle
- [ ] Move history/import/export to menu

### Phase 3: New Block Types

- [ ] Create CalloutBlock component
  - [ ] Icon picker
  - [ ] Title + description fields
  - [ ] Variant colors (info, tip, warning, error)
- [ ] Create CardGridBlock component
  - [ ] Two-column layout
  - [ ] Card with icon, title, description
- [ ] Register blocks in BlockNote
- [ ] Add to slash menu

### Phase 4: Editor Polish

- [ ] Improve prose typography
- [ ] Increase content max-width to 768px
- [ ] Add proper section spacing
- [ ] Style placeholder text
- [ ] Polish floating toolbar

### Phase 5: Collaboration Enhancement

- [ ] Add colored cursor indicators
- [ ] Show selection highlights
- [ ] Implement SyncIndicator
- [ ] Add "Saving..." / "Saved" status

### Phase 6: Responsive

- [ ] Mobile: Hide sidebar, add hamburger
- [ ] Tablet: Narrow sidebar
- [ ] Desktop: Full layout
- [ ] Touch-friendly toolbar

---

## Component Implementation

### DocumentSidebar

```tsx
export function DocumentSidebar({ documents, currentId }: Props) {
  return (
    <aside className="w-60 border-r border-ui-border bg-ui-bg-secondary h-full overflow-y-auto">
      <div className="p-4 border-b border-ui-border">
        <Flex align="center" justify="between">
          <Typography variant="small" className="font-medium">
            Navigation
          </Typography>
          <Flex gap="xs">
            <Button variant="ghost" size="icon-sm">
              <PlusIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <SearchIcon className="w-4 h-4" />
            </Button>
          </Flex>
        </Flex>
      </div>

      <nav className="p-2">
        {documents.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            currentId={currentId}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-ui-border mt-auto">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add new
        </Button>
      </div>
    </aside>
  );
}
```

### CalloutBlock

```tsx
interface CalloutBlockProps {
  icon: string;
  title: string;
  children: ReactNode;
  variant?: 'info' | 'tip' | 'warning' | 'error';
}

export function CalloutBlock({ icon, title, children, variant = 'info' }: CalloutBlockProps) {
  const variantStyles = {
    info: 'border-status-info bg-status-info-bg',
    tip: 'border-status-success bg-status-success-bg',
    warning: 'border-status-warning bg-status-warning-bg',
    error: 'border-status-error bg-status-error-bg',
  };

  return (
    <div className={cn(
      "rounded-lg border-l-4 p-4 my-4",
      variantStyles[variant]
    )}>
      <Flex gap="sm" align="start">
        <span className="text-xl">{icon}</span>
        <div>
          <Typography variant="label" className="mb-1">
            {title}
          </Typography>
          <Typography variant="small" className="text-ui-text-secondary">
            {children}
          </Typography>
        </div>
      </Flex>
    </div>
  );
}
```

### CardGridBlock

```tsx
interface CardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
}

export function CardGridBlock({ cards }: { cards: CardProps[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 my-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            "p-4 rounded-lg border border-ui-border bg-ui-bg-secondary",
            "transition-colors hover:border-ui-border-focus",
            card.href && "cursor-pointer"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
            {card.icon}
          </div>
          <Typography variant="label" className="mb-1">
            {card.title}
          </Typography>
          <Typography variant="small" className="text-ui-text-secondary">
            {card.description}
          </Typography>
        </div>
      ))}
    </div>
  );
}
```

### SyncIndicator

```tsx
export function SyncIndicator({ status }: { status: 'saved' | 'saving' | 'error' }) {
  return (
    <Flex align="center" gap="xs" className="text-ui-text-tertiary">
      {status === 'saving' && (
        <>
          <LoadingSpinner size="xs" />
          <Typography variant="caption">Saving...</Typography>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckIcon className="w-3 h-3 text-status-success" />
          <Typography variant="caption">Saved</Typography>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertIcon className="w-3 h-3 text-status-error" />
          <Typography variant="caption">Error saving</Typography>
        </>
      )}
    </Flex>
  );
}
```

---

## CSS Additions

```css
/* Sidebar item states */
.sidebar-item {
  transition: background-color 0.15s ease;
}

.sidebar-item:hover {
  background-color: var(--color-ui-bg-tertiary);
}

.sidebar-item[data-selected="true"] {
  background-color: var(--color-ui-bg-tertiary);
  color: var(--color-ui-text);
}

/* Save indicator animation */
@keyframes save-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.save-indicator[data-saving="true"] {
  animation: save-pulse 1s ease-in-out infinite;
}

/* Editor prose improvements */
.editor-prose h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1rem;
}

.editor-prose h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-top: 3rem;
  margin-bottom: 0.75rem;
}

.editor-prose p {
  margin-bottom: 1rem;
  line-height: 1.7;
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test all new block types
3. Test collaboration features
4. Run `pnpm fixme` to verify no errors
5. Run `node scripts/validate.js` for design tokens
6. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/reference-mintlify-editor.png` | Mintlify reference |
