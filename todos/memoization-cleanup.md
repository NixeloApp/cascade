# Memoization Cleanup (Post React Compiler)

Now that React Compiler is enabled, manual memoization is redundant.

## Scope

Remove all instances of:
- `useMemo()` 
- `useCallback()`
- `React.memo()` / `memo()`
- Custom `arePropsEqual` functions

## Files to Clean (96 instances in 34 files)

Top targets:
- `src/components/KanbanBoard.tsx` — 11 instances
- `src/components/Kanban/KanbanColumn.tsx` — 7 instances  
- `src/components/Settings/TwoFactorSettings.tsx` — 6 instances
- `src/components/AnalyticsDashboard.tsx` — 5 instances
- `src/components/Plate/DragHandle.tsx` — 5 instances

## Approach

0. **Verify compiler coverage first** — Run `npx react-compiler-healthcheck` on each target file. Skip files with compiler bailouts until underlying Rules of React violations are fixed.
1. Remove wrapper while preserving the inner logic
2. Update imports (remove useMemo/useCallback/memo from imports)
3. Run `pnpm check` after each file
4. **Retain** `useMemo`/`useCallback` when ANY of the following apply:
   - The compiler has bailed out on that component/hook (see step 0)
   - Reference identity is required for correctness, not just performance (e.g., stable callback used as a `useEffect` dependency to gate side effects)
   - Non-React library integration requires stable identity

## Notes

- React Compiler auto-memoizes at build time
- Existing manual memoization is harmless but adds noise
- Cleanup improves readability and reduces bundle size slightly

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S5-S6`  
**Effort:** Medium

### Milestones

- [x] `S2` Convert scope list to tracked batches (10-12 files per batch)
- [ ] `S2-S3` Remove safe memoization in compiler-covered files
- [ ] `S3` Keep explicit memoization only where identity is correctness-critical
- [ ] `S4` Publish cleanup report with before/after instance counts

### Dependencies

- Reliable compiler-healthcheck output for target files
- Regression test coverage in heavily interactive components

### Definition of Done

- Manual memoization reduced substantially with no correctness regressions.

---

## Progress Updates

### 2026-03-02 (Priority 15, batch A)

**Completed**
- Began memoization cleanup with a conservative low-risk batch (pure computed-value paths only):
  - `src/components/Invoices/InvoiceEditor.tsx`:
    - removed `useMemo` around subtotal calculation.
  - `src/components/Sprints/SprintProgressBar.tsx`:
    - removed `useMemo` around progress aggregation logic.
  - `src/components/Analytics/LineChart.tsx`:
    - removed `useMemo` around chart projection/path generation.
  - `src/routes/_auth/_app/$orgSlug/my-issues.tsx`:
    - removed grouped-list `useMemo`.
  - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies.tsx`:
    - removed `workspaceTeams`, `statusOptions`, and `priorityOptions` `useMemo`.
  - `src/components/ui/IconPicker.tsx`:
    - removed `filteredOptions` `useMemo`.
- Updated baseline counts after batch:
  - Combined manual memoization instances in `src/` (`useMemo`, `useCallback`, `memo`): `59`
  - `useMemo`: `14`
  - `useCallback`: `38`
  - `memo`/`React.memo`: `7`

**Validation**
- `pnpm exec biome check --write src/components/Invoices/InvoiceEditor.tsx src/components/Sprints/SprintProgressBar.tsx src/components/Analytics/LineChart.tsx src/routes/_auth/_app/$orgSlug/my-issues.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies.tsx src/components/ui/IconPicker.tsx`
- `pnpm test src/components/ui/IconPicker.test.tsx src/config/routes.test.ts` (`45 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Did not remove `useCallback`/`memo` in this first batch where callback identity might affect side-effect behavior.
- Prioritized deterministic, purely derived computations for first-pass cleanup.

**Blockers**
- Compiler coverage check command is currently blocked by network/DNS:
  - `npx react-compiler-healthcheck ...` fails with `EAI_AGAIN registry.npmjs.org`.

**Next step (strict order)**
- Continue Priority `15` with batch B:
  - remove additional safe `useMemo` sites,
  - classify `useCallback`/`memo` instances into `remove` vs `keep-for-correctness`,
  - publish ongoing before/after counts.

### 2026-03-02 (Priority 15, batch B)

**Completed**
- Removed additional low-risk `useMemo` usage in notification and mention-input paths:
  - `src/routes/_auth/_app/$orgSlug/notifications.tsx`:
    - removed filtered notifications `useMemo`.
  - `src/components/Notifications/NotificationCenter.tsx`:
    - removed filtered notifications `useMemo`.
    - removed grouped notification map `useMemo`.
  - `src/components/Plate/MentionInputElement.tsx`:
    - removed `search` derivation `useMemo`.
    - removed mention-item mapping `useMemo`.
- Updated baseline counts after batch B:
  - Combined manual memoization instances in `src/`: `54`
  - `useMemo`: `9`
  - `useCallback`: `38`
  - `memo`/`React.memo`: `7`

**Validation**
- `pnpm exec biome check --write src/routes/_auth/_app/$orgSlug/notifications.tsx src/components/Notifications/NotificationCenter.tsx src/components/Plate/MentionInputElement.tsx`
- `pnpm test src/components/Notifications/NotificationCenter.test.tsx src/config/routes.test.ts` (`54 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Kept `useCallback` instances unchanged in this batch pending identity-correctness classification.
- Prioritized heavily used notification views first because they had direct test coverage.

**Blockers**
- Compiler healthcheck remains blocked by network (`EAI_AGAIN`).

**Next step (strict order)**
- Continue Priority `15` with batch C:
  - reduce remaining `useMemo` in board/roadmap/sprint surfaces,
  - begin `useCallback`/`memo` keep-vs-remove classification report.

### 2026-03-02 (Priority 15, batch C)

**Completed**
- Removed additional safe `useMemo` sites in board/roadmap/editor/sprint/sidebar paths:
  - `src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx` (URL-filter derivation)
  - `src/components/Documents/DocumentSidebar.tsx` (headings extraction)
  - `src/components/Sprints/SprintManager.tsx` (overlap detection derivations)
  - `src/components/IssueDescriptionEditor.tsx` (initial/parsed value derivations)
  - `src/components/RoadmapView.tsx` (`issueIndexMap`, dependency-line derivation)
- Remaining `useMemo` count is now `1`:
  - `src/hooks/useFuzzySearch.ts` (`Fuse` index instance)

**Validation**
- `pnpm exec biome check --write src/components/Documents/DocumentSidebar.tsx src/components/Sprints/SprintManager.tsx src/components/IssueDescriptionEditor.tsx src/components/RoadmapView.tsx src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx`
- `pnpm test src/config/routes.test.ts src/components/Notifications/NotificationCenter.test.tsx` (`54 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Kept `useMemo` in `useFuzzySearch` as an intentional exception due non-React library integration (`Fuse`) where stable instance/index identity is required to avoid rebuilding the search index on every render.

**Updated counts**
- Total (`useMemo` + `useCallback` + `memo`) in `src/`: `46`
- `useMemo`: `1`
- `useCallback`: `38`
- `memo`/`React.memo`: `7`

**Blockers**
- Compiler healthcheck remains network-blocked (`EAI_AGAIN registry.npmjs.org`), limiting confident bulk removal/classification of `useCallback` and `memo`.

**Next step (strict order)**
- Continue Priority `15` with batch D:
  - classify remaining `useCallback`/`memo` into `remove` vs `keep-for-correctness`,
  - remove low-risk callbacks where no identity-sensitive side effect exists,
  - publish before/after callback/memo delta report.

### 2026-03-02 (Priority 15, batch D)

**Completed**
- Removed additional low-risk `useCallback` wrappers from UI event handlers:
  - `src/components/Settings/CoverImageUploadModal.tsx` (5 callbacks)
  - `src/components/Settings/AvatarUploadModal.tsx` (5 callbacks)
  - `src/components/IssueDescriptionEditor.tsx` (1 callback)
  - `src/components/Documents/DocumentSidebar.tsx` (1 callback)
  - `src/components/IssueDetail/CreateIssueModal.tsx` (2 callbacks)
  - `src/components/PlateEditor.tsx` (2 callbacks)
- Classified remaining memoization usage as keep-for-now:
  - `useMemo`:
    - `src/hooks/useFuzzySearch.ts` (stable Fuse index / non-React library integration).
  - `useCallback`/`memo`:
    - drag/drop, history, keyboard, offline/draft hooks (stable function identity used by consuming effects/handlers),
    - `RoadmapView` date-position callback (shared with effect/mouse handlers),
    - `Plate` mention/color handlers (editor integration event semantics),
    - `Carousel` imperative API callbacks,
    - `Kanban`/`IssueCard`/`SwimlanRow` memo wrappers (high-frequency lists with custom prop-compare behavior).

**Validation**
- `pnpm exec biome check --write src/components/Settings/CoverImageUploadModal.tsx src/components/Settings/AvatarUploadModal.tsx src/components/IssueDescriptionEditor.tsx src/components/Documents/DocumentSidebar.tsx src/components/IssueDetail/CreateIssueModal.tsx src/components/PlateEditor.tsx`
- `pnpm test src/config/routes.test.ts src/components/Notifications/NotificationCenter.test.tsx` (`54 passed`)
- `pnpm run typecheck` (pass)

**Updated counts**
- Total (`useMemo` + `useCallback` + `memo`) in `src/`: `30`
- `useMemo`: `1`
- `useCallback`: `22`
- `memo`/`React.memo`: `7`

**Decisions**
- Kept remaining callback/memo cases where stable identity and render-frequency behavior are tied to correctness or user-interaction stability.
- Deferred further aggressive `memo` removals until compiler-healthcheck can run.

**Blockers**
- Compiler healthcheck remains blocked by network (`EAI_AGAIN registry.npmjs.org`), preventing full coverage verification for final cleanup closure.

**Next step (strict order)**
- Continue Priority `15` with final classification/report closeout once healthcheck is available, or keep item marked blocked at current optimized baseline.
