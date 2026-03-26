# Validator Authoring

`scripts/validate.js` runs each validator in an isolated Node process. Keep new
checks small, deterministic, and explicit about whether they are enforced or
just audits.

## Result Contract

- Use `createValidatorResult()` from [result-utils.js](/home/mikhail/Desktop/cascade/scripts/validate/result-utils.js) for normal checks.
- Use `createCountRatchetResult()` for baseline-backed count ratchets.
- Enforced checks use the default `blocking: true` behavior and fail CI when `errors > 0`.
- Audit checks must set `blocking: false`; they never fail CI and print as `PASS [audit]` in the runner.
- If a passing audit check should still print context, leave `showMessagesOnPass` unset or set it explicitly.

## When To Use A Ratchet

- Use a ratchet when existing debt is real and immediate cleanup would be too disruptive.
- Store baselines in `scripts/ci/` with a name that matches the validator concern.
- Choose the ratchet unit deliberately:
  - `countBy: "entries"` when one file/module over baseline should count as one failure
  - default item counting when each overage instance should count separately

## Scope Rules

- Prefer scanning only the directories that actually own the problem.
- Skip tests, stories, generated code, and owned primitive internals unless the rule is specifically about them.
- Keep allowlists local and documented with the reason they exist.

## Output Rules

- `detail` should summarize the result in one line.
- `messages` should be actionable and file/line-specific where possible.
- Do not print directly from validators; return structured results and let the runner format them.

## Adding A New Validator

1. Create `scripts/validate/check-*.js`.
2. Return a structured result through `result-utils.js`.
3. Register it in [validate.js](/home/mikhail/Desktop/cascade/scripts/validate.js).
4. Add or update any baseline file in `scripts/ci/` if the rule is ratcheted.
5. Add targeted tests if the rule has non-trivial parsing or result logic.
