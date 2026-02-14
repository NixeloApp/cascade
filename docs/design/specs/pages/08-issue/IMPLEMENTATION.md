# Issue Detail Page - Implementation

> **Priority**: MEDIUM (Phase 2 - Core Features)
> **Scope**: Sidebar polish, activity timeline, keyboard shortcuts
> **Estimated Complexity**: Medium

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/_auth/_app/$orgSlug/issues/$key.tsx` | POLISH | Layout, keyboard handlers |
| `src/components/issues/IssueDetail.tsx` | POLISH | Main layout structure |
| `src/components/issues/IssueSidebar.tsx` | ENHANCE | Field styling, hover states |
| `src/components/issues/ActivityFeed.tsx` | ENHANCE | Timeline visual |
| `src/components/issues/CommentSection.tsx` | POLISH | Input styling |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/issues/SidebarField.tsx` | Generic field wrapper |
| `src/components/issues/ActivityTimeline.tsx` | Visual timeline |
| `src/components/issues/InlineEdit.tsx` | Inline editing wrapper |

---

## Functionality Breakdown

### Core Actions
- [x] View issue details
- [x] Edit title and description
- [x] Change status, priority, assignee
- [x] Add/remove labels
- [x] Add comments
- [x] View activity history
- [ ] **Polish**: Inline field editing
- [ ] **Enhancement**: Keyboard shortcuts

### Comments
- [x] Add comment
- [x] View comment thread
- [ ] **Enhancement**: Edit/delete comments
- [ ] **Enhancement**: Reactions
- [ ] **Enhancement**: @mentions

### Activity
- [x] Show status changes
- [x] Show assignments
- [x] Show field updates
- [ ] **Polish**: Visual timeline
- [ ] **Enhancement**: Filter activity

---

## Verification Checklist

### Phase 1: Sidebar Field Enhancement

- [ ] Create SidebarField wrapper component
- [ ] Add hover background on all fields
- [ ] Consistent label styling (xs, uppercase, muted)
- [ ] Value with appropriate icon/avatar
- [ ] Dropdown trigger styling

### Phase 2: Activity Timeline

- [ ] Add timeline dots (8px circles)
- [ ] Add connecting lines between entries
- [ ] Style activity text and timestamps
- [ ] Add entry animation
- [ ] Group activities by date

### Phase 3: Inline Editing

- [ ] Title inline edit on click
- [ ] Description auto-save on blur
- [ ] Field edit on click (not just dropdown)
- [ ] Visual feedback during save

### Phase 4: Comment Enhancement

- [ ] Improve input styling
- [ ] Add avatar to input
- [ ] Submit with Cmd+Enter
- [ ] Loading state on submit

### Phase 5: Keyboard Shortcuts

- [ ] Implement `E` for edit description
- [ ] Implement `A` for assign to me
- [ ] Implement `S` for change status
- [ ] Implement `P` for change priority
- [ ] Implement `L` for add label
- [ ] Implement `M` for add comment
- [ ] Add shortcut hints UI

### Phase 6: Responsive

- [ ] Mobile: Sidebar below content
- [ ] Mobile: Collapsible sidebar
- [ ] Tablet: Narrow sidebar
- [ ] Desktop: Full two-column

---

## Component Implementation

### SidebarField

```tsx
interface SidebarFieldProps {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}

export function SidebarField({ label, value, onClick, icon }: SidebarFieldProps) {
  return (
    <div
      className={cn(
        "sidebar-field p-2 rounded-md",
        "transition-colors duration-150",
        onClick && "cursor-pointer hover:bg-ui-bg-tertiary"
      )}
      onClick={onClick}
    >
      <Typography variant="caption" className="text-ui-text-tertiary uppercase mb-1">
        {label}
      </Typography>
      <Flex align="center" gap="sm">
        {icon}
        <Typography variant="small">{value}</Typography>
      </Flex>
    </div>
  );
}
```

### ActivityTimeline

```tsx
export function ActivityTimeline({ activities }: Props) {
  return (
    <div className="relative">
      {activities.map((activity, index) => (
        <div
          key={activity._id}
          className="activity-item flex gap-3 pb-4 relative"
        >
          {/* Timeline dot */}
          <div className="relative flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-ui-text-tertiary" />
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-ui-border-subtle absolute top-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <Typography variant="small">
              <span className="font-medium">{activity.user.name}</span>
              {' '}{activity.description}
            </Typography>
            <Typography variant="caption" className="text-ui-text-tertiary">
              {formatRelativeTime(activity.createdAt)}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### InlineEdit

```tsx
interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  renderDisplay: (value: string, onEdit: () => void) => ReactNode;
  renderInput: (value: string, onChange: (v: string) => void, onBlur: () => void) => ReactNode;
}

export function InlineEdit({ value, onSave, renderDisplay, renderInput }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return renderInput(localValue, setLocalValue, handleSave);
  }

  return renderDisplay(value, () => setIsEditing(true));
}
```

---

## CSS Additions

```css
/* Sidebar field hover */
.sidebar-field {
  transition: background-color 0.15s ease;
}

.sidebar-field:hover {
  background-color: var(--color-ui-bg-tertiary);
}

/* Inline edit focus */
.inline-edit-field:focus-within {
  background-color: var(--color-ui-bg-tertiary);
  outline: 2px solid var(--color-brand);
  outline-offset: -2px;
}

/* Activity timeline */
.activity-item {
  animation: activity-enter 0.2s ease-out;
}

@keyframes activity-enter {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Comment submit animation */
.comment-form[data-submitting="true"] {
  animation: comment-submit 0.3s ease;
}

@keyframes comment-submit {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Test all keyboard shortcuts
3. Test inline editing save/cancel
4. Run `pnpm fixme` to verify no errors
5. Run `node scripts/validate.js` for design tokens
6. Update status in `DIRECTOR.md`

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/reference-linear-issue.png` | Linear reference |
