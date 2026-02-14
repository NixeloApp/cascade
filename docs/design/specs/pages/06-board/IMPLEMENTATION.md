# Board Page - Implementation

> **Priority**: HIGH (Phase 2 - Core Features)
> **Scope**: Card polish, drag-and-drop, keyboard navigation
> **Estimated Complexity**: High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/KanbanBoard.tsx` | POLISH | Drop zone, animations |
| `src/components/Kanban/KanbanColumn.tsx` | POLISH | Header, empty state |
| `src/components/IssueCard.tsx` | ENHANCE | Hover, drag states |
| `src/components/FilterBar.tsx` | POLISH | Sticky, quick filters |
| `src/components/Kanban/BoardToolbar.tsx` | POLISH | Integration |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/board/EmptyColumnState.tsx` | Empty column with CTA |
| `src/components/board/DragGhostCard.tsx` | Drag preview |
| `src/components/board/CardQuickActions.tsx` | Hover action buttons |

---

## Functionality Breakdown

### Drag and Drop
- [x] Drag issue to different column (change status)
- [x] Reorder within same column
- [x] Visual feedback during drag
- [ ] **Polish**: Ghost card preview
- [ ] **Polish**: Smooth settle animation
- [ ] **Polish**: Haptic-style bounce on drop
- [ ] **Enhancement**: Multi-select drag

### Filtering
- [x] Filter by type, priority, assignee, labels
- [x] Clear all filters
- [x] Save filter configuration
- [ ] **Enhancement**: Quick filters (My Issues, Unassigned)
- [ ] **Enhancement**: Filter URL persistence

### Card Interactions
- [x] Click to open issue detail
- [x] Drag to reorder/move
- [x] Selection mode with checkboxes
- [x] Keyboard navigation
- [ ] **Enhancement**: Right-click context menu
- [ ] **Enhancement**: Hover quick actions
- [ ] **Enhancement**: Inline quick edit

### Keyboard Shortcuts
- [x] Arrow keys: Navigate between cards
- [x] Enter: Open selected card
- [ ] `C`: Create new issue
- [ ] `E`: Edit focused card
- [ ] `A`: Assign to me
- [ ] `L`: Add label
- [ ] `P`: Change priority
- [ ] `M`: Move to column

---

## Verification Checklist

### Phase 1: Visual Polish

- [ ] Reduce column background opacity
- [ ] Add top border color for status (3px)
- [ ] Enhance card hover state (lift + shadow)
- [ ] Add subtle card border on hover
- [ ] Improve type icon visual (colored pill)
- [ ] Add priority color indicator
- [ ] Refine column header spacing
- [ ] Add column count as pill badge

### Phase 2: Empty States

- [ ] Create EmptyColumnState component
- [ ] Add illustration or icon
- [ ] Add "Create issue" CTA button
- [ ] Add "or drag here" helper text

### Phase 3: Drag & Drop Enhancement

- [ ] Add drag cursor on draggable cards
- [ ] Create ghost card preview
- [ ] Enhance column highlight on drag-over
- [ ] Add settle animation after drop
- [ ] Support multi-select drag

### Phase 4: Filter Bar Enhancement

- [ ] Make filter bar sticky on scroll
- [ ] Add quick filter presets
- [ ] Improve active filter visual state
- [ ] Add filter count badge
- [ ] Persist filters in URL

### Phase 5: Card Interactions

- [ ] Add hover quick actions overlay
- [ ] Implement right-click context menu
- [ ] Enhance selection mode checkboxes
- [ ] Improve keyboard focus navigation

### Phase 6: Keyboard Shortcuts

- [ ] Implement `C` for create issue
- [ ] Implement `E` for edit focused issue
- [ ] Implement `A` for assign to me
- [ ] Implement `L` for add label
- [ ] Implement `P` for priority picker
- [ ] Implement `M` for move to column
- [ ] Add keyboard shortcut hints

### Phase 7: Performance

- [ ] Virtualize long columns (100+ cards)
- [ ] Optimize drag-drop re-renders
- [ ] Lazy load card details on hover
- [ ] Debounce filter changes

---

## Component Implementation

### IssueCard Enhanced

```tsx
export function IssueCard({ issue, isDragging, isSelected }: IssueCardProps) {
  return (
    <div
      className={cn(
        "issue-card group relative",
        "bg-ui-bg-elevated rounded-lg p-3",
        "border border-ui-border",
        "transition-all duration-200",
        isDragging && "dragging rotate-[-2deg] scale-105 shadow-lg opacity-90",
        isSelected && "border-brand bg-brand-subtle",
        !isDragging && "hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      {/* Status top border */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-0.5 rounded-t-lg",
        issue.status === "todo" && "bg-status-neutral",
        issue.status === "in_progress" && "bg-status-info",
        issue.status === "in_review" && "bg-status-warning",
        issue.status === "done" && "bg-status-success"
      )} />

      {/* Card content */}
      <Flex justify="between" align="start">
        <Flex gap="sm" align="center">
          <IssueTypeIcon type={issue.type} />
          <Typography variant="caption" className="text-ui-text-secondary">
            {issue.key}
          </Typography>
        </Flex>
        <PriorityIcon priority={issue.priority} />
      </Flex>

      <Typography variant="small" className="mt-2 line-clamp-2">
        {issue.title}
      </Typography>

      <Flex justify="between" align="center" className="mt-3">
        <Flex gap="xs">
          {issue.labels?.slice(0, 2).map(label => (
            <Badge key={label} variant="outline" size="xs">{label}</Badge>
          ))}
        </Flex>
        {issue.assignee && <Avatar src={issue.assignee.avatar} size="xs" />}
      </Flex>

      {/* Quick actions - hover reveal */}
      <div className="card-quick-actions absolute top-2 right-2 opacity-0 group-hover:opacity-100">
        <CardQuickActions issue={issue} />
      </div>
    </div>
  );
}
```

### EmptyColumnState

```tsx
export function EmptyColumnState({ onCreateIssue }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-ui-bg-secondary flex items-center justify-center mb-3">
        <Icon icon={InboxIcon} size="md" className="text-ui-text-tertiary" />
      </div>
      <Typography variant="small" className="text-ui-text-secondary">
        No issues here yet
      </Typography>
      <Button variant="ghost" size="sm" onClick={onCreateIssue} className="mt-2">
        <Icon icon={PlusIcon} size="sm" />
        Create issue
      </Button>
      <Typography variant="caption" className="text-ui-text-tertiary mt-1">
        or drag one here
      </Typography>
    </div>
  );
}
```

---

## CSS Additions

```css
/* Issue card drag states */
.issue-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.issue-card.dragging {
  transform: rotate(-2deg) scale(1.05);
  box-shadow: var(--shadow-lg);
  opacity: 0.9;
  z-index: 100;
}

/* Drop target column */
.kanban-column[data-drag-over="true"] {
  background-color: var(--color-brand-subtle);
}

.kanban-column[data-drag-over="true"]::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 2px dashed var(--color-brand);
  border-radius: 8px;
  pointer-events: none;
}

/* Card settle animation */
@keyframes card-settle {
  0% { transform: translateY(-10px) scale(1.02); opacity: 0.8; }
  50% { transform: translateY(2px) scale(0.99); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.issue-card[data-just-dropped] {
  animation: card-settle 0.3s ease-out;
}

/* Quick actions reveal */
.card-quick-actions {
  transition: opacity 0.15s ease;
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test drag-and-drop across all browsers
3. Test keyboard navigation thoroughly
4. Run `pnpm fixme` to verify no errors
5. Run `node scripts/validate.js` for design tokens
6. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark-filled.png` | Current filled state |
| `screenshots/reference-linear-board.png` | Linear reference |
