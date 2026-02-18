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
