# Projects List Page - Implementation

> **Priority**: MEDIUM (Phase 2 - App Polish)
> **Scope**: Card enhancement, animations, quick actions
> **Estimated Complexity**: Medium

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/_auth/_app/$orgSlug/projects/index.tsx` | POLISH | Page-level styles |
| `src/components/ProjectsList.tsx` | POLISH | Grid layout, staggered entry |
| `src/components/ui/Card.tsx` | POLISH | Add hover lift variant |
| `src/components/ui/EmptyState.tsx` | POLISH | Custom illustration |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/projects/ProjectCard.tsx` | Enhanced project card |
| `src/components/projects/ProjectAvatar.tsx` | Generated avatar |
| `src/components/projects/MemberStack.tsx` | Avatar stack |
| `src/components/projects/ProjectCardSkeleton.tsx` | Loading state |

---

## Functionality Breakdown

### Core Actions
- [ ] **View projects list** - Paginated grid of project cards
- [ ] **Create project** - Opens `CreateProjectFromTemplate` modal
- [ ] **Navigate to project** - Click card to go to project board
- [ ] **Load more** - Pagination via "Load More" button

### Card Interactions
- [ ] **Hover state** - Card lifts with enhanced shadow
- [ ] **Quick actions menu** - Three-dot menu on hover
- [ ] **Click navigation** - Full card is clickable
- [ ] **Keyboard navigation** - Tab between cards, Enter to select

### Quick Actions Menu
- [ ] Open Board
- [ ] Project Settings
- [ ] Archive Project

---

## Verification Checklist

### Phase 1: Card Component

- [ ] Create `ProjectCard` component
  - [ ] Project avatar with generated color
  - [ ] Title + key badge layout
  - [ ] Description with line-clamp-2
  - [ ] Metadata row (issues, board type)
  - [ ] Member avatar stack
- [ ] Implement hover lift effect
  - [ ] `translateY(-2px)` on hover
  - [ ] Shadow transition
  - [ ] Border glow (dark mode)
- [ ] Add keyboard focus ring

### Phase 2: Project Avatar

- [ ] Create `ProjectAvatar` component
  - [ ] Generate initials from name
  - [ ] Generate consistent color from name hash
  - [ ] Support custom icon override
  - [ ] Multiple sizes (sm, md, lg)

### Phase 3: Member Stack

- [ ] Create `MemberStack` component
  - [ ] Overlapping avatar display
  - [ ] +N overflow indicator
  - [ ] Tooltip with full member list
  - [ ] Props: members[], maxVisible, size

### Phase 4: Grid & Layout

- [ ] Update grid gap and card sizing
- [ ] Ensure consistent card heights
- [ ] Responsive breakpoints (1, 2, 3 columns)
- [ ] Max-width constraint for wide screens

### Phase 5: Empty State

- [ ] Design custom illustration (folder + sparkles)
- [ ] Update typography hierarchy
- [ ] Add floating animation to icon
- [ ] Responsive centering

### Phase 6: Animations

- [ ] Staggered card entry (50ms delay per card)
- [ ] Card hover transitions (0.2s ease-out)
- [ ] Loading skeleton with shimmer
- [ ] Quick actions fade-in on hover

### Phase 7: Quick Actions

- [ ] Three-dot menu trigger (hover reveal)
- [ ] Dropdown with actions
- [ ] Keyboard accessible
- [ ] Confirmation for archive action

### Phase 8: Loading & Error States

- [ ] Skeleton grid for loading
- [ ] Error boundary with retry
- [ ] Empty state when no projects

---

## Component Implementation

### ProjectCard

```tsx
interface ProjectCardProps {
  project: Doc<"projects">;
  members?: Doc<"users">[];
  onNavigate: () => void;
}

export function ProjectCard({ project, members, onNavigate }: ProjectCardProps) {
  return (
    <Card
      className="card-hover-lift cursor-pointer group"
      onClick={onNavigate}
    >
      <Flex gap="md" align="start">
        <ProjectAvatar name={project.name} size="md" />
        <div className="flex-1 min-w-0">
          <Flex justify="between" align="center">
            <Typography variant="h4" className="truncate">
              {project.name}
            </Typography>
            <Badge variant="secondary" size="sm">
              {project.key}
            </Badge>
          </Flex>
          <Typography variant="muted" className="line-clamp-2 mt-1">
            {project.description || "No description"}
          </Typography>
        </div>
      </Flex>

      <Flex justify="between" align="center" className="mt-4">
        <Flex gap="sm" align="center">
          {members && <MemberStack members={members} maxVisible={3} />}
          <Typography variant="caption">
            {project.issueCount} issues
          </Typography>
        </Flex>
        <Badge variant="outline" size="sm">
          {project.boardType}
        </Badge>
      </Flex>

      {/* Quick actions - revealed on hover */}
      <div className="card-actions absolute top-2 right-2 opacity-0 group-hover:opacity-100">
        <DropdownMenu>
          {/* ... actions */}
        </DropdownMenu>
      </div>
    </Card>
  );
}
```

### ProjectAvatar

```tsx
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

interface ProjectAvatarProps {
  name: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function ProjectAvatar({ name, icon, size = "md" }: ProjectAvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const bgColor = hashStringToColor(name);

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center text-white font-medium",
        size === "sm" && "w-8 h-8 text-xs",
        size === "md" && "w-10 h-10 text-sm",
        size === "lg" && "w-12 h-12 text-base"
      )}
      style={{ backgroundColor: bgColor }}
    >
      {icon || initials}
    </div>
  );
}
```

---

## CSS Additions

Add to `src/index.css` or component styles:

```css
/* Card hover lift */
.card-hover-lift {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.card-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

/* Dark mode glow */
.dark .card-hover-lift:hover {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.15);
}

/* Quick actions reveal */
.card-actions {
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateY(4px);
}

.group:hover .card-actions {
  transform: translateY(0);
}

/* Staggered entry */
.project-grid > *:nth-child(1) { animation-delay: 0ms; }
.project-grid > *:nth-child(2) { animation-delay: 50ms; }
.project-grid > *:nth-child(3) { animation-delay: 100ms; }
.project-grid > *:nth-child(4) { animation-delay: 150ms; }
.project-grid > *:nth-child(5) { animation-delay: 200ms; }
.project-grid > *:nth-child(6) { animation-delay: 250ms; }
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Compare with design reference
3. Run `pnpm fixme` to verify no errors
4. Run `node scripts/validate.js` for design tokens
5. Update status in `DIRECTOR.md`
6. Update `CURRENT.md` with new screenshots

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark-filled.png` | Current filled state |
| `screenshots/desktop-dark-empty.png` | Current empty state |
| `screenshots/reference-mintlify-dashboard.png` | Design reference |
