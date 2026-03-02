## Summary

- 

## Validation

- [ ] `pnpm run typecheck`
- [ ] `pnpm run biome:check`
- [ ] Relevant tests were run and results are included
- [ ] New/updated non-trivial files (>50 lines) include a top-of-file documentation header (`/** ... */`)

## E2E Reliability Checklist

Complete this section whenever E2E tests or E2E support code is changed.

- [ ] No `waitForTimeout` introduced in `e2e/` test/spec flows
- [ ] New waits are state-based (`toBeVisible`, `toHaveURL`, `toHaveCount`, `expect.poll`, helper contracts)
- [ ] Existing helper contracts were reused where applicable (`waitForDashboardReady`, `waitForBoardLoaded`, `waitForIssueCreateSuccess`, `waitForOAuthRedirectComplete`)
- [ ] Selectors prefer semantic roles/test ids over brittle text/CSS selectors
- [ ] Exact command + result for touched E2E slice is included in PR description
