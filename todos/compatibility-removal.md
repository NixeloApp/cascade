# Compatibility Removal

> **Priority:** P0
> **Last Updated:** 2026-03-26

## Remaining

- [ ] Run the explicit repair passes for project issue counters and mailbox token encryption against real data, then remove the last schema-level tolerance for missing values.
- [ ] Make `projects.nextIssueNumber` structurally required once the repair pass has been run, so missing counters become impossible instead of merely rejected at runtime.
- [ ] Review tolerance for missing mailbox minute-counter fields in [mailboxRateLimits.ts](/home/mikhail/Desktop/cascade/convex/outreach/mailboxRateLimits.ts) and decide whether to hard-require them now that repair paths exist.
- [ ] Review the plain-text compatibility path in [IssueDescriptionEditor.tsx](/home/mikhail/Desktop/cascade/src/components/IssueDescriptionEditor.tsx) and remove it if no persisted rows still depend on it.
- [ ] Delete leftover backwards-compatibility comments and aliases only when the underlying fallback behavior is actually gone.

## Done Criteria

- [ ] The repo no longer silently tolerates known old-row shapes for project issue counters or outreach mailbox tokens.
- [ ] Schema and validators enforce the replacement invariants instead of relying on runtime self-heal code.
- [ ] Remaining compatibility comments correspond to a real, intentional behavior that still exists.
