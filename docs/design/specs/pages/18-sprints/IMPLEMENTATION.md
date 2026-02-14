# Sprints Page - Implementation

> **Priority**: P2 - Enhancement
> **Scope**: Progress bar fix, layout improvements

---

## Implementation Phases

### Phase 1: Progress Bar Fix (P1)
Change from time-based to issue-based progress.

### Phase 2: Layout Improvements (P2)
- Active sprint expanded
- Future sprints compact
- Completed sprints section

### Phase 3: Features (P3)
- Edit sprint
- Duration selection
- Sprint summary on complete

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `src/components/SprintManager.tsx` | 1,2 | Progress logic, layout |
| `convex/sprints.ts` | 1 | Add completed issue count to query |

---

## Phase 1: Progress Bar Fix

### Current (Time-based)
```tsx
const getProgressPercentage = () => {
  if (!sprint.startDate || !sprint.endDate) return 0;
  const now = Date.now();
  const total = sprint.endDate - sprint.startDate;
  const elapsed = now - sprint.startDate;
  return Math.min(Math.max((elapsed / total) * 100, 0), 100);
};
```

### Target (Issue-based)
```tsx
// In Convex query, add to sprint data:
interface SprintWithProgress extends Doc<"sprints"> {
  issueCount: number;
  completedCount: number;
}

// In component:
const getProgressPercentage = () => {
  if (sprint.issueCount === 0) return 0;
  return (sprint.completedCount / sprint.issueCount) * 100;
};
```

### Convex Query Update

```typescript
// convex/sprints.ts
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return Promise.all(
      sprints.map(async (sprint) => {
        const issues = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();

        const completedCount = issues.filter((i) => i.status === "done").length;

        return {
          ...sprint,
          issueCount: issues.length,
          completedCount,
        };
      })
    );
  },
});
```

---

## Phase 2: Layout Improvements

### Sprint Card Component Refactor

```tsx
interface SprintCardProps {
  sprint: SprintWithProgress;
  variant: "active" | "future" | "completed";
  canEdit: boolean;
  onStart: () => void;
  onComplete: () => void;
}

function SprintCard({ sprint, variant, canEdit, onStart, onComplete }: SprintCardProps) {
  if (variant === "active") {
    return <ActiveSprintCard sprint={sprint} canEdit={canEdit} onComplete={onComplete} />;
  }
  if (variant === "future") {
    return <FutureSprintCard sprint={sprint} canEdit={canEdit} onStart={onStart} />;
  }
  return <CompletedSprintCard sprint={sprint} />;
}
```

### Active Sprint Card

```tsx
function ActiveSprintCard({ sprint, canEdit, onComplete }: Props) {
  const progress = sprint.issueCount > 0
    ? (sprint.completedCount / sprint.issueCount) * 100
    : 0;

  return (
    <div className="p-6 bg-ui-bg-secondary rounded-xl">
      <Flex justify="between" align="start" className="mb-4">
        <div>
          <Typography variant="h4">{sprint.name}</Typography>
          {sprint.goal && (
            <Typography variant="muted" className="mt-1">{sprint.goal}</Typography>
          )}
        </div>
        <Badge variant="brand">Active</Badge>
      </Flex>

      {/* Progress */}
      <div className="mb-4">
        <Flex justify="between" align="center" className="mb-2">
          <Typography variant="small">Progress</Typography>
          <Typography variant="small" className="text-brand">
            {Math.round(progress)}%
          </Typography>
        </Flex>
        <div className="h-2 bg-ui-bg-tertiary rounded-pill overflow-hidden">
          <div
            className={cn(
              "h-full rounded-pill transition-all",
              progress >= 100 ? "bg-status-success" : "bg-brand"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <Typography variant="muted" className="mt-1">
          {sprint.completedCount} of {sprint.issueCount} issues completed
        </Typography>
      </div>

      {/* Dates */}
      {sprint.startDate && sprint.endDate && (
        <Typography variant="caption" className="mb-4 block">
          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          {getDaysRemaining(sprint.endDate)}
        </Typography>
      )}

      {/* Actions */}
      {canEdit && (
        <Flex justify="end">
          <Button variant="secondary" onClick={onComplete}>
            Complete Sprint
          </Button>
        </Flex>
      )}
    </div>
  );
}
```

### Future Sprint Card

```tsx
function FutureSprintCard({ sprint, canEdit, onStart }: Props) {
  return (
    <Flex
      justify="between"
      align="center"
      className="p-4 bg-ui-bg-tertiary rounded-lg"
    >
      <div>
        <Flex gap="sm" align="center">
          <Typography variant="small" className="font-medium">
            {sprint.name}
          </Typography>
          <Badge variant="neutral" size="sm">
            {sprint.issueCount} issues
          </Badge>
        </Flex>
        {sprint.goal && (
          <Typography variant="muted">{sprint.goal}</Typography>
        )}
      </div>
      {canEdit && (
        <Button variant="primary" size="sm" onClick={onStart}>
          Start →
        </Button>
      )}
    </Flex>
  );
}
```

---

## Verification Checklist

### Phase 1: Progress Bar
- [ ] Progress shows issues completed / total
- [ ] 0 issues = 0% (not divide by zero)
- [ ] 100% shows green bar
- [ ] Text shows "X of Y issues completed"

### Phase 2: Layout
- [ ] Active sprint uses expanded card
- [ ] Future sprints use compact card
- [ ] Completed sprints show in collapsed section
- [ ] Only one sprint active at a time enforced

### Phase 3: Features (Future)
- [ ] Edit sprint modal works
- [ ] Duration selection on create
- [ ] Sprint summary on complete

---

## After Implementation

1. Test sprint lifecycle (create → start → complete)
2. Verify progress calculation with various issue counts
3. Run `pnpm screenshots` for new captures
4. Update DIRECTOR.md status
