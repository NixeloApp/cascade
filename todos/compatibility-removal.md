# Compatibility Removal

> **Priority:** P0
> **Last Updated:** 2026-03-26

## Remaining

- [ ] Delete leftover backwards-compatibility comments and aliases only when the underlying fallback behavior is actually gone.

## Done Criteria

- [ ] The repo no longer silently tolerates known old-row shapes for outreach mailbox tokens or mailbox rate counters.
- [ ] Issue descriptions are normalized to Plate JSON on write instead of being healed from plain text in the editor.
- [ ] Schema and validators enforce the replacement invariants instead of relying on runtime self-heal code.
- [ ] Remaining compatibility comments correspond to a real, intentional behavior that still exists.
