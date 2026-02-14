# Backlog Page - Implementation

> **Priority**: MEDIUM (Phase 2 - Core Features)
> **Scope**: Sprint cards, drag-and-drop, progress tracking
> **Estimated Complexity**: Medium

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/backlog/BacklogView.tsx` | POLISH | Layout, drop zones |
| `src/components/backlog/SprintCard.tsx` | ENHANCE | Progress, stats, header |
| `src/components/backlog/SprintHeader.tsx` | POLISH | Collapse, formatting |
| `src/components/backlog/BacklogIssueRow.tsx` | ENHANCE | Hover, quick actions |
| `src/components/backlog/BacklogSection.tsx` | POLISH | Animation, empty state |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/backlog/SprintProgress.tsx` | Progress bar |
| `src/components/backlog/SprintStats.tsx` | Stats display |
| `src/components/backlog/RowQuickActions.tsx` | Hover actions |
| `src/components/backlog/BulkActionsBar.tsx` | Selection actions |

---

## Functionality Breakdown

### Sprint Management
- [x] Create sprint
- [x] Start sprint
- [x] Complete sprint
- [x] Edit sprint details
- [ ] **Polish**: Progress tracking
- [ ] **Enhancement**: Sprint velocity chart

### Issue Organization
- [x] Add issue to sprint
- [x] Remove from sprint
- [x] Reorder within sprint
- [x] Move between sprints
- [ ] **Polish**: Drag visual feedback
- [ ] **Enhancement**: Bulk operations

### Filtering & Views
- [x] Filter by assignee
- [x] Filter by priority
- [x] Search issues
- [ ] **Enhancement**: Saved filters
- [ ] **Enhancement**: Group by epic

---

## Verification Checklist

### Phase 1: Sprint Card Enhancement

- [ ] Add progress bar to sprint header
- [ ] Show issue count and story points
- [ ] Improve date range formatting
- [ ] Add collapse/expand animation
- [ ] Style "Start Sprint" button

### Phase 2: Issue Row Enhancement

- [ ] Add hover background highlight
- [ ] Implement inline quick actions
- [ ] Improve checkbox styling
- [ ] Add drag handle affordance
- [ ] Priority badge color coding

### Phase 3: Drag & Drop

- [ ] Add drop zone visual feedback
- [ ] Show reorder preview line
- [ ] Animate row movement
- [ ] Support cross-sprint dragging
- [ ] Handle large list performance

### Phase 4: Bulk Selection

- [ ] Multi-select with Shift+Click
- [ ] Select all in section
- [ ] Bulk actions toolbar
- [ ] Clear selection button
- [ ] Keyboard support

### Phase 5: Empty States

- [ ] Empty sprint illustration
- [ ] Empty backlog guidance
- [ ] "Add issues" CTA
- [ ] Drag hint text

### Phase 6: Performance

- [ ] Virtualize long lists
- [ ] Lazy load issue details
- [ ] Debounce drag events
- [ ] Optimize re-renders

---

## Component Implementation

### SprintCard Enhanced

```tsx
export function SprintCard({ sprint, issues, onDrop }: SprintCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const completedCount = issues.filter(i => i.status === 'done').length;
  const progressPercent = issues.length > 0 ? (completedCount / issues.length) * 100 : 0;

  return (
    <Card
      className={cn(
        "sprint-card border border-ui-border",
        isDragOver && "border-brand border-dashed bg-brand-subtle"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { onDrop(e); setIsDragOver(false); }}
    >
      <SprintHeader
        sprint={sprint}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <>
          <Flex justify="between" align="center" className="px-4 py-2">
            <SprintStats
              issueCount={issues.length}
              completedCount={completedCount}
              storyPoints={sprint.storyPoints}
            />
            <SprintProgress percent={progressPercent} />
          </Flex>

          <div className="divide-y divide-ui-border-subtle">
            {issues.map((issue, index) => (
              <BacklogIssueRow
                key={issue._id}
                issue={issue}
                index={index}
              />
            ))}
          </div>

          {issues.length === 0 && (
            <EmptySprintState sprintId={sprint._id} />
          )}
        </>
      )}
    </Card>
  );
}
```

### SprintProgress

```tsx
export function SprintProgress({ percent }: { percent: number }) {
  return (
    <Flex gap="sm" align="center">
      <div className="w-32 h-2 bg-ui-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <Typography variant="caption" className="text-ui-text-secondary">
        {Math.round(percent)}%
      </Typography>
    </Flex>
  );
}
```

### BacklogIssueRow Enhanced

```tsx
export function BacklogIssueRow({ issue, index }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "backlog-row group flex items-center gap-3 px-4 py-2",
        "transition-colors duration-150",
        "hover:bg-ui-bg-secondary",
        isSelected && "bg-brand-subtle border-l-3 border-l-brand"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="shrink-0"
      />

      <IssueTypeIcon type={issue.type} size="sm" />

      <Typography variant="caption" className="text-ui-text-secondary shrink-0">
        {issue.key}
      </Typography>

      <Typography variant="small" className="flex-1 truncate">
        {issue.title}
      </Typography>

      <PriorityBadge priority={issue.priority} />

      <AssigneeDisplay assignee={issue.assignee} />

      <StatusBadge status={issue.status} />

      {/* Quick actions - hover reveal */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <RowQuickActions issue={issue} />
      </div>
    </div>
  );
}
```

---

## CSS Additions

```css
/* Row hover and selection */
.backlog-row {
  transition: background-color 0.15s ease;
}

.backlog-row:hover {
  background-color: var(--color-ui-bg-secondary);
}

.backlog-row[data-selected="true"] {
  background-color: var(--color-brand-subtle);
  border-left: 3px solid var(--color-brand);
}

/* Drag states */
.backlog-row[data-dragging="true"] {
  opacity: 0.5;
}

.backlog-row[data-drop-above="true"]::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-brand);
}

/* Sprint drop zone */
.sprint-card[data-drag-over="true"] {
  border-color: var(--color-brand);
  border-style: dashed;
  background-color: var(--color-brand-subtle);
}

/* Section collapse */
.sprint-content {
  overflow: hidden;
  transition: max-height 0.2s ease-out;
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test drag-and-drop between all sections
3. Test bulk selection and actions
4. Run `pnpm fixme` to verify no errors
5. Run `node scripts/validate.js` for design tokens
6. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark-filled.png` | Current filled state |
| `screenshots/desktop-dark-empty.png` | Current empty state |
| `screenshots/reference-jira-backlog.png` | Jira reference |
