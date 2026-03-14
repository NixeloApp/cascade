# Tech Debt: Project Creation UI

> **Priority:** P3
> **Status:** Backlog
> **File:** `src/components/App/AppSidebar.tsx:422`

## Description

Add project creation UI to the sidebar. Currently commented out.

```typescript
// const { mutate: createProject } = useAuthenticatedMutation(api.projects.createProject); // TODO: Add project creation UI
```

## Acceptance Criteria

- [ ] Add "Create Project" button to sidebar
- [ ] Implement project creation modal/form
- [ ] Wire up to `api.projects.createProject` mutation
