# Dashboard Page - Implementation

> **Priority**: MEDIUM (Phase 2 - App Polish)
> **Scope**: Visual polish, micro-interactions
> **Estimated Complexity**: High (multiple components, design token updates)

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/index.css` | UPDATE | Add/verify subtle border tokens, near-black bg |
| `src/routes/$slug/dashboard.tsx` | POLISH | Background, spacing, page-level styles |
| `src/components/dashboard/DashboardGreeting.tsx` | POLISH | Typography hierarchy, spacing |
| `src/components/dashboard/FocusItem.tsx` | POLISH | Border, shadow, hover lift |
| `src/components/dashboard/OverviewStats.tsx` | POLISH | Card styling, loading states, equal heights |
| `src/components/dashboard/DashboardFeed.tsx` | POLISH | Tab styling, hover states, staggered entry |
| `src/components/layout/AppLayout.tsx` | POLISH | Three-column layout refinements |
| `src/components/layout/Sidebar.tsx` | POLISH | Collapse animation, section styling |

---

## Functionality Breakdown

### Header Bar
- [ ] **Logo/Brand**: Click navigates to dashboard
- [ ] **Sidebar Toggle**: Collapse/expand left sidebar (200px → 64px)
- [ ] **Commands**: Opens command palette (Cmd+K)
- [ ] **Start Timer**: Quick time tracking start
- [ ] **Search**: Global search (Cmd+K)
- [ ] **Notifications**: Bell icon with unread count badge
- [ ] **User Avatar**: Dropdown with profile, settings, logout

### Left Sidebar Navigation
- [ ] **Dashboard**: Home view (active state with indigo bg)
- [ ] **Issues**: All issues across projects
- [ ] **Calendar**: Calendar view with events
- [ ] **Documents**: Expandable section with chevron
  - [ ] Templates: Document templates
- [ ] **Workspaces**: Expandable section
  - [ ] Individual workspace items
- [ ] **Time Tracking**: Time entries and reports
- [ ] **Settings**: App settings (footer position)

### Main Content - Greeting
- [ ] **Time-aware greeting**: Good morning/afternoon/evening
- [ ] **User name display**: Personalized with first name (bold, branded)
- [ ] **Weekly summary**: Tasks completed count
- [ ] **Customize button**: Opens dashboard customization

### Main Content - Focus Item
- [ ] **Priority display**: Color-coded badge (HIGHEST=orange, HIGH=amber)
- [ ] **Issue key**: Clickable link to issue (e.g., DEMO-2)
- [ ] **Issue title**: Main heading
- [ ] **Project reference**: Link to project
- [ ] **View Task action**: Navigate to issue detail with arrow

### Main Content - Overview Stats
- [ ] **Active Load**: Count of assigned incomplete tasks
- [ ] **Velocity**: Tasks completed this week with progress bar
- [ ] **Attention Needed**: High priority items count (orange text)
- [ ] **Contribution**: Total issues reported

### Main Content - Feed
- [ ] **Tab switching**: Assigned vs Created with count badges
- [ ] **Issue list**: Scrollable list of issues
- [ ] **Issue cards**: Clickable to navigate
- [ ] **Priority badges**: Visual priority indicator
- [ ] **Status display**: Current workflow state
- [ ] **Infinite scroll**: Load more on scroll (if applicable)

### Right Sidebar - Workspaces
- [ ] **Workspace count**: Active projects summary
- [ ] **Workspace cards**: Clickable project links
- [ ] **Role badge**: Admin/Editor/Viewer (uppercase, muted)
- [ ] **Issue count**: Assigned issues per workspace

### Right Sidebar - Activity Feed
- [ ] **Activity stream**: Latest actions across projects
- [ ] **Empty state**: Chart icon + "No activity" message

---

## Design Token Updates

### Required Token Changes in `src/index.css`

```css
/* Verify/add these tokens in @theme block */

/* Near-black background for dark mode */
--color-ui-bg: light-dark(var(--p-white), #08090a);

/* Subtle border (5-7% opacity) */
--color-ui-border-subtle: light-dark(
  rgba(0, 0, 0, 0.05),
  rgba(255, 255, 255, 0.05)
);

/* Card shadow tokens */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
```

---

## CSS Animation Implementations

### Card Hover Lift

```css
/* Add to global styles or component */
.card-hover-lift {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.card-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### Tab Indicator Transition

```css
.tab-indicator {
  transition: transform 0.2s ease-out, width 0.2s ease-out;
}
```

### Stat Value Fade-in

```css
@keyframes stat-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.stat-value {
  animation: stat-fade-in 0.3s ease-out;
}
```

### Staggered Entry for Feed Items

```css
.stagger-entry > *:nth-child(1) { animation-delay: 0ms; }
.stagger-entry > *:nth-child(2) { animation-delay: 50ms; }
.stagger-entry > *:nth-child(3) { animation-delay: 100ms; }
.stagger-entry > *:nth-child(4) { animation-delay: 150ms; }
.stagger-entry > *:nth-child(5) { animation-delay: 200ms; }
```

### Sidebar Collapse/Expand

```css
.sidebar {
  transition: width 0.2s ease-out;
}
.sidebar-collapsed {
  width: 64px;
}
```

---

## Verification Checklist

### Phase 1: Foundation (Design Tokens)

- [ ] Verify dark mode background is near-black (`#08090a`)
- [ ] Add `border-ui-border-subtle` token (5-7% opacity)
- [ ] Add `shadow-card` and `shadow-card-hover` tokens
- [ ] Apply subtler borders to all cards
- [ ] Update card backgrounds for dark mode transparency

### Phase 2: Cards & Panels

- [ ] **Focus Item Card**:
  - [ ] Reduce border opacity
  - [ ] Add subtle shadow
  - [ ] Add hover lift effect (translateY -2px)
  - [ ] Priority badge color-coded
- [ ] **Overview Stats Cards**:
  - [ ] Consistent heights across all 4 cards
  - [ ] Softer background
  - [ ] Smaller border
  - [ ] Large numbers with stat-fade-in animation
- [ ] **Workspace Cards**:
  - [ ] Role badge styling (uppercase, muted)
  - [ ] Assigned count display

### Phase 3: Feed Section

- [ ] **Tab Styling**:
  - [ ] Add count badges in parentheses: "ASSIGNED (4)"
  - [ ] Smooth indicator transition between tabs
  - [ ] Active tab underline with brand color
- [ ] **Issue List Items**:
  - [ ] Add hover states (subtle background change)
  - [ ] Add dividers between items
  - [ ] Priority badge alignment
  - [ ] Project name + status on same line
- [ ] **Staggered Entry**:
  - [ ] Add animation delays to feed items on load

### Phase 4: Empty States

- [ ] Update empty state illustrations (or use custom SVG)
- [ ] Use softer text colors (`text-ui-text-tertiary`)
- [ ] Add entrance animation (fade-in)
- [ ] CTA button styling

### Phase 5: Right Sidebar

- [ ] Better panel separation (subtle divider or spacing)
- [ ] Improve activity feed layout
- [ ] Empty state for activity feed

### Phase 6: Micro-interactions

- [ ] Card hover lift effects on all clickable cards
- [ ] Tab indicator smooth transition
- [ ] Focus states for keyboard navigation (outline)
- [ ] Button hover states

### Phase 7: Loading States

- [ ] Skeleton loading for greeting section
- [ ] Skeleton loading for focus item card
- [ ] Skeleton loading for stats grid
- [ ] Skeleton loading for feed list
- [ ] Smooth skeleton-to-content transition

### Phase 8: Responsive

- [ ] **Mobile (<768px)**:
  - [ ] Stack right sidebar below main content
  - [ ] 2x2 grid for stats (2 columns instead of 4)
  - [ ] Full-width cards
- [ ] **Tablet (768-1024px)**:
  - [ ] Narrow right sidebar
- [ ] **Desktop (>1024px)**:
  - [ ] Full three-column layout
- [ ] **Wide (>1440px)**:
  - [ ] Max content width constraint

---

## Component-Specific Changes

### DashboardGreeting.tsx

```tsx
// Target structure:
<Flex direction="column" gap="sm">
  <Typography variant="h1" className="text-4xl italic">
    Good evening, <span className="text-brand font-bold">{firstName}</span>.
  </Typography>
  <Typography variant="muted" className="text-ui-text-secondary">
    {tasksCompleted} task{tasksCompleted !== 1 ? 's' : ''} completed this week.
  </Typography>
</Flex>
```

### FocusItem.tsx

```tsx
// Add hover lift class
<Card className="card-hover-lift border-ui-border-subtle shadow-card">
  {/* content */}
</Card>
```

### OverviewStats.tsx

```tsx
// Ensure consistent card heights with grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard label="ACTIVE LOAD" value={assigned} sublabel="Assigned tasks" />
  <StatCard label="VELOCITY" value={done} sublabel="Done this week" progress={progressPercent} />
  <StatCard label="ATTENTION NEEDED" value={highPriority} sublabel="High Priority" variant="warning" />
  <StatCard label="CONTRIBUTION" value={reported} sublabel="Reported issues" />
</div>
```

### DashboardFeed.tsx

```tsx
// Tab with count badges
<Tabs>
  <TabsTrigger value="assigned">ASSIGNED ({assignedCount})</TabsTrigger>
  <TabsTrigger value="created">CREATED ({createdCount})</TabsTrigger>
</Tabs>

// Staggered entry for list
<div className="stagger-entry">
  {issues.map((issue, index) => (
    <IssueCard key={issue._id} issue={issue} style={{ animationDelay: `${index * 50}ms` }} />
  ))}
</div>
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate screenshots
2. Compare side-by-side with Mintlify reference (`screenshots/reference-mintlify-dashboard.png`)
3. Run `pnpm fixme` to verify no lint/type errors
4. Run `node scripts/validate.js` to check design tokens
5. Update status in `DIRECTOR.md` from 🟡 to 🟢
6. Update `CURRENT.md` screenshots and remove fixed problems

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark-filled.png` | Current filled state |
| `screenshots/desktop-dark-empty.png` | Current empty state |
| `screenshots/reference-mintlify-dashboard.png` | Mintlify target reference |
