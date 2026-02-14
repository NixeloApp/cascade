# Members Management - Implementation

> **Priority**: P3 - Polish
> **Scope**: Minor cleanup, keep current structure

---

## Decision

The current embedded implementation in Project Settings is **appropriate**. Members are project-scoped, so embedding in project settings makes sense.

Organization-level team management (if needed) would be a separate feature/page.

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/ProjectSettings/MemberManagement.tsx` | MINOR | Remove card wrapper, clean up Typography |

---

## Changes

### 1. Remove Card Wrapper

Current:
```tsx
<Card variant="soft">
  <div className="p-6">
    ...
  </div>
</Card>
```

Target:
```tsx
<div className="space-y-6">
  ...
</div>
```

The parent ProjectSettings component should handle card wrapping if needed.

### 2. Clean Up Add Form Background

Current:
```tsx
<div className="mb-6 p-5 bg-ui-bg-tertiary rounded-lg border border-ui-border">
```

Target:
```tsx
<div className="mb-6 p-4 bg-ui-bg-secondary rounded-lg">
```

Simpler, no border.

### 3. Simplify Typography

Current:
```tsx
<Typography variant="large" className="font-semibold tracking-tight">
  Members
</Typography>
```

Target:
```tsx
<Typography variant="h4">
  Members
</Typography>
```

Use variant instead of overriding.

---

## MemberManagement.tsx - Key Sections

### Header
```tsx
<Flex justify="between" align="center" className="mb-6">
  <div>
    <Typography variant="h4">Members</Typography>
    <Typography variant="muted" className="mt-0.5">
      {members.length} member{members.length !== 1 ? "s" : ""} with access
    </Typography>
  </div>
  {!showAddForm && (
    <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
      Add Member
    </Button>
  )}
</Flex>
```

### Member Row
```tsx
<Flex
  align="center"
  justify="between"
  className="p-3 bg-ui-bg-tertiary rounded-lg"
  key={member._id}
>
  <Flex gap="md" align="center">
    <Avatar src={member.image} name={member.name} email={member.email} size="sm" />
    <div>
      <Flex gap="sm" align="center">
        <Typography variant="small" className="font-medium">
          {member.name}
        </Typography>
        {isOwner(member._id) && (
          <Badge variant="primary" size="sm">Owner</Badge>
        )}
      </Flex>
      <Typography variant="muted">{member.email || "No email"}</Typography>
    </div>
  </Flex>

  <Flex gap="sm" align="center">
    {isOwner(member._id) ? (
      <Badge variant={ROLE_BADGE_VARIANTS[member.role]} size="sm">
        {member.role}
      </Badge>
    ) : (
      <>
        <Select
          value={member.role}
          onChange={(e) => handleRoleChange(member._id, e.target.value)}
          options={ROLE_OPTIONS}
          disabled={changingRoleFor === member._id}
          className="w-28"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMemberToRemove(member)}
          className="text-status-error hover:bg-status-error/10"
        >
          Remove
        </Button>
      </>
    )}
  </Flex>
</Flex>
```

---

## Verification Checklist

### Structure
- [ ] No Card wrapper (just div)
- [ ] Add form uses `bg-ui-bg-secondary` (no border)
- [ ] Member rows use `bg-ui-bg-tertiary`
- [ ] No hover effects on rows (remove if present)

### Typography
- [ ] Header uses `variant="h4"`
- [ ] Member count uses `variant="muted"`
- [ ] Member name uses `variant="small"` + `font-medium`
- [ ] No Typography className overrides for size/weight

### Functionality
- [ ] Add member works (existing + invite)
- [ ] Role change works (optimistic)
- [ ] Remove works (confirm dialog)
- [ ] Owner protection works

### States
- [ ] Loading (role change): dropdown disabled
- [ ] Adding: button loading
- [ ] Error: toast notification

---

## Future Considerations

### Org-Level Members Page

If needed later, create:
- Route: `/:slug/members`
- Component: `TeamMembers.tsx`
- Features: Search, table view, bulk invite

This would be a separate spec.

---

## After Implementation

1. Test all CRUD operations
2. Verify owner protection
3. Run `pnpm screenshots` for new captures
4. Update DIRECTOR.md status
