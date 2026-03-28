# Outcome-Driven Validation Overhaul

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-28

## Why This Exists

The repo is currently too good at making local checks pass without proving that product quality improved.

Recent cleanup work repeatedly reduced validator baselines by moving styling or ownership details into helper files, while known noisy tests, audit-only visual gaps, and stale todo state remained. That is the wrong incentive loop. If the system rewards churn over outcomes, people will keep feeding the system churn.

The target state is not “smaller baselines.” The target state is `baseline = 0`, with every remaining exception either fixed, deleted, or promoted into a real first-class API.

## Current State

- The custom validation stack has 61 checks, and some of them still reward code laundering or baseline management instead of forcing the underlying problem to be fixed or removed.
- `pnpm run test:all` still ends green while printing recurring stderr and warning noise from unrelated suites, which makes real failures easier to miss.
- Screenshot coverage and visual review still leave important routes uncovered or audit-only, so “green” does not mean “reviewed”.
- Active todo files were retaining shipped history and completed checklist items, which made the live backlog harder to see and easier to pad with low-value work.
- Baseline files still normalize exceptions that should be burned down to zero on an explicit plan instead of living forever.

## Workstreams

### 1. Deep Repo-State Audit

- [ ] Classify the last 50 commits into: product value, reliability/security, simplification with real code deletion, or validator-only churn.
- [ ] Produce a validator matrix covering every custom check: what it blocks, what user/reliability risk it maps to, common false positives, common false negatives, and the exact path to make its current baseline hit zero.
- [ ] Inventory every recurring warning/error line in `pnpm run test:all` and decide one disposition for each: fix it, assert it explicitly in the test, or baseline it with an owner and expiry condition.
- [ ] Inventory every audit-only check and decide whether it should become blocking, stay audit-only, or be deleted.
- [ ] Inventory every baseline file and every baselined item count, grouped by validator, ownerless debt, and real fix difficulty.

### 2. Rebalance the Validator Suite

- [ ] Keep all surviving validators blocking; do not preserve a second-class “optional consistency” lane for known bad states.
- [ ] Narrow or rewrite validators that mostly reward code movement instead of simplification, deletion, or bug fixes.
- [ ] Rename and reshape validators where needed so the name matches the real contract, for example “classname ownership” rather than “raw styling”.
- [ ] Forbid permanent baselines: every baseline must have an owner, a reason, an ordered removal plan, and a target date or target sequence for reaching zero.
- [ ] Delete validators that do not correspond to a coherent product, reliability, security, or maintainability risk.
- [ ] Add a validator that keeps active todo files and the todo index free of completed entries.

### 3. Strengthen Missing Signals

- [ ] Fail CI on unexpected `console.error`, `console.warn`, and stderr output in tests, with an explicit allowlist only for truly intentional cases.
- [ ] Fail CI on React `act(...)` warnings.
- [ ] Define the minimum screenshot-state contract for important routes, then fail CI when required states are missing.
- [ ] Add regression checks for user-visible broken states instead of leaning so heavily on ownership/style shape drift.
- [ ] Add review pressure for large helper-extraction diffs that do not also delete meaningful duplication, simplify APIs, or fix visible issues.
- [ ] Add validator coverage for fake abstraction patterns like single-consumer classname-laundering helpers, baseline churn with no deletion, and helper extraction that leaves the same number of raw class stacks in place.

### 4. Fix the Known Green-But-Noisy Failures

- [ ] Remove IndexedDB/offline noise from component tests or explicitly stub/assert those paths.
- [ ] Remove recurring React `act(...)` warnings from header, issue-detail, and offline-hook tests.
- [ ] Remove expected env-error noise from tests by asserting those branches directly instead of printing stack traces during green runs.
- [ ] Turn screenshot-review findings into tracked todos instead of relying on “someone looked at it” as process memory.

### 5. Change How Cleanup Work Lands

- [ ] Freeze validator-only helper-extraction passes unless they also delete duplication across multiple call sites, simplify a public API, or fix a visible bug.
- [ ] Require every cleanup todo slice to name the actual problem, the code being deleted, and the expected user-facing or maintenance outcome.
- [ ] Prefer broader simplification or bug-fix slices over one-file ownership churn.
- [ ] Re-audit the remaining design-system/raw-styling backlog after the validator rebalance and delete any slice that is not worth doing.
- [ ] Convert every surviving baseline into either:
- [ ] a real shared API with multiple callers,
- [ ] a local inline implementation because it is not shared enough to abstract,
- [ ] or a concrete bug/UX fix that removes the need for the exception entirely.

## Exit Criteria

- [ ] `pnpm run static` and `pnpm run test:all` are green and quiet enough that any new warning stands out immediately.
- [ ] Every blocking validator has a clear product, reliability, security, or maintainability rationale.
- [ ] Active todo files contain only unresolved work.
- [ ] All validator baselines that exist today have an explicit burn-down sequence and are trending to zero without helper-laundering detours.
- [ ] Raw styling / classname ownership baselines reach `0`, or the validator is rewritten so the old baseline category no longer exists.
- [ ] The next 10 cleanup commits each deliver visible product value, real simplification, or meaningful code deletion.
- [ ] The design-system/raw-styling backlog has been re-triaged against actual value instead of validator scorekeeping.
