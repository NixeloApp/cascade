# Outcome-Driven Validation Overhaul

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-28

## Why This Exists

The repo is currently too good at making local checks pass without proving that product quality improved.

Recent cleanup work repeatedly reduced validator baselines by moving styling or ownership details into helper files, while known noisy tests, audit-only visual gaps, and stale todo state remained. That is the wrong incentive loop. If the system rewards churn over outcomes, people will keep feeding the system churn.

## Current State

- The custom validation stack has 61 checks, but too many of them block ownership/style drift rather than regressions, reliability, or user-facing breakage.
- `pnpm run test:all` still ends green while printing recurring stderr and warning noise from unrelated suites, which makes real failures easier to miss.
- `pnpm run biome` still emits a standing complexity warning in `src/components/TimeTracking/TimeEntryModal.tsx`.
- Screenshot coverage and visual review still leave important routes uncovered or audit-only, so “green” does not mean “reviewed”.
- Active todo files were retaining shipped history and completed checklist items, which made the live backlog harder to see and easier to pad with low-value work.
- The remaining raw-styling/design-system backlog can still invite more helper-extraction churn unless we explicitly change the rules.

## Workstreams

### 1. Deep Repo-State Audit

- [ ] Classify the last 50 commits into: product value, reliability/security, simplification with real code deletion, or validator-only churn.
- [ ] Produce a validator matrix covering every custom check: what it blocks, what user/reliability risk it maps to, common false positives, common false negatives, and whether it should remain blocking.
- [ ] Inventory every recurring warning/error line in `pnpm run test:all` and decide one disposition for each: fix it, assert it explicitly in the test, or baseline it with an owner and expiry condition.
- [ ] Inventory every audit-only check and decide whether it should become blocking, stay audit-only, or be deleted.

### 2. Rebalance the Validator Suite

- [ ] Split validators into three buckets: `product-safety`, `repo-safety`, and `style-consistency`.
- [ ] Keep only `product-safety` and `repo-safety` blocking by default.
- [ ] Demote or remove ratchets that mostly reward code movement instead of simplification, deletion, or bug fixes.
- [ ] Require every baseline file to carry an owner, a reason, and an exit trigger.
- [ ] Add a validator that keeps active todo files and the todo index free of completed entries.

### 3. Strengthen Missing Signals

- [ ] Fail CI on unexpected `console.error`, `console.warn`, and stderr output in tests, with an explicit allowlist only for truly intentional cases.
- [ ] Fail CI on React `act(...)` warnings.
- [ ] Define the minimum screenshot-state contract for important routes, then fail CI when required states are missing.
- [ ] Add regression checks for user-visible broken states instead of leaning so heavily on ownership/style shape drift.
- [ ] Add review pressure for large helper-extraction diffs that do not also delete meaningful duplication, simplify APIs, or fix visible issues.

### 4. Fix the Known Green-But-Noisy Failures

- [ ] Eliminate the standing Biome complexity warning in `src/components/TimeTracking/TimeEntryModal.tsx`.
- [ ] Remove IndexedDB/offline noise from component tests or explicitly stub/assert those paths.
- [ ] Remove recurring React `act(...)` warnings from header, issue-detail, and offline-hook tests.
- [ ] Remove expected env-error noise from tests by asserting those branches directly instead of printing stack traces during green runs.
- [ ] Turn screenshot-review findings into tracked todos instead of relying on “someone looked at it” as process memory.

### 5. Change How Cleanup Work Lands

- [ ] Freeze validator-only helper-extraction passes unless they also delete duplication across multiple call sites, simplify a public API, or fix a visible bug.
- [ ] Require every cleanup todo slice to name the actual problem, the code being deleted, and the expected user-facing or maintenance outcome.
- [ ] Prefer broader simplification or bug-fix slices over one-file ownership churn.
- [ ] Re-audit the remaining design-system/raw-styling backlog after the validator rebalance and delete any slice that is not worth doing.

## Exit Criteria

- [ ] `pnpm run static` and `pnpm run test:all` are green and quiet enough that any new warning stands out immediately.
- [ ] Every blocking validator has a clear product, reliability, or security rationale.
- [ ] Active todo files contain only unresolved work.
- [ ] The next 10 cleanup commits each deliver visible product value, real simplification, or meaningful code deletion.
- [ ] The design-system/raw-styling backlog has been re-triaged against actual value instead of validator scorekeeping.
