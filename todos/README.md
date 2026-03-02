# Nixelo Todos

Central index for active roadmap and issue todos.

> **Last Audited:** 2026-03-02
> **Structure:** Active todos in `todos/` + open Jules issues in `todos/jules/open/`

---

## Current Focus

| File | Status | Notes |
|------|--------|-------|
| [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Active | P0 in progress: CI now merges shard blob reports and computes history-derived clean-run checkpoint (with local fallback) in summary output; latest full-suite baseline remains clean (`151/0/4`) |
| [consistency-tracking.md](./consistency-tracking.md) | Active | Ongoing consistency enforcement + validator tracking |
| [feature-gaps.md](./feature-gaps.md) | Active | Core gaps with partial completion |
| [bandwidth_optimization.md](./bandwidth_optimization.md) | Active | High-impact backend efficiency work |
| [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Active | Monitoring mostly shipped; admin dashboard + feature flag pending |
| [multi-level-views.md](./multi-level-views.md) | Active | Partial route foundation, major features pending |

---

## Priority Lanes

- `Now (P0/P1 security + core):` `e2e-reliability-overhaul`, Jules open issues, `multi-level-views`, `bandwidth_optimization`, `oauth-monitoring-finalization`, `feature-gaps`, `consistency-tracking`
- `Next (P2):` `agency-mvp`, `rich-text-description-followup`, `sidebar-display-limits`, `emoji-overhaul`, `memoization-cleanup`
- `Later (P3/P4):` `public-launch`, `growth-features`, `enterprise`, `uptime-monitoring`

---

## Priority Order

| # | File | Priority Band | Focus |
|---|------|---------------|-------|
| 01 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | P0 | Deterministic, robust E2E quality overhaul |
| 02 | [jules/open/jules-sentinel-2026-02-26-issue-search-security.md](./jules/open/jules-sentinel-2026-02-26-issue-search-security.md) | P1 | Search authorization/IDOR hardening |
| 03 | [jules/open/jules-scribe-2024-05-22-fix-cascade-delete-limit.md](./jules/open/jules-scribe-2024-05-22-fix-cascade-delete-limit.md) | P1 | Cascade delete/restore overflow safety |
| 04 | [jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | P1 | Transitive lodash vulnerability removal |
| 05 | [jules/open/jules-spectra-2025-02-24-deduplicate-hashapikey.md](./jules/open/jules-spectra-2025-02-24-deduplicate-hashapikey.md) | P1 | API key hash test parity cleanup |
| 06 | [multi-level-views.md](./multi-level-views.md) | P1 | Non-project scope views (org/workspace/team) |
| 07 | [bandwidth_optimization.md](./bandwidth_optimization.md) | P1 | Query payload and bandwidth reductions |
| 08 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | P1 | OAuth ops dashboard + fail-safe controls |
| 09 | [feature-gaps.md](./feature-gaps.md) | P1 | Core product gaps and Slack integration |
| 10 | [consistency-tracking.md](./consistency-tracking.md) | P1 | Consistency governance closure |
| 11 | [agency-mvp.md](./agency-mvp.md) | P2 | Agency workflow MVP |
| 12 | [rich-text-description-followup.md](./rich-text-description-followup.md) | P2 | Plain-text extraction for integrations |
| 13 | [sidebar-display-limits.md](./sidebar-display-limits.md) | P2 | Sidebar UX follow-ups |
| 14 | [emoji-overhaul.md](./emoji-overhaul.md) | P2 | Icon picker and accessibility |
| 15 | [memoization-cleanup.md](./memoization-cleanup.md) | P2 | React compiler memoization cleanup |
| 16 | [public-launch.md](./public-launch.md) | P3 | Public launch execution |
| 17 | [growth-features.md](./growth-features.md) | P4 | Post-launch growth features |
| 18 | [enterprise.md](./enterprise.md) | P4 | Enterprise roadmap |
| 19 | [uptime-monitoring.md](./uptime-monitoring.md) | P4 | Future uptime/status product track |

---

## Active Todos

| File | Status | Focus |
|------|--------|-------|
| [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Active | E2E flake elimination and deterministic test architecture |
| [agency-mvp.md](./agency-mvp.md) | Active | Agency workflows (invoicing, client portal) |
| [emoji-overhaul.md](./emoji-overhaul.md) | Active | Icon picker + accessibility pass |
| [sidebar-display-limits.md](./sidebar-display-limits.md) | Active | Core limit work done; UX follow-ups open |
| [rich-text-description-followup.md](./rich-text-description-followup.md) | Active | Plain-text extraction for integrations |
| [memoization-cleanup.md](./memoization-cleanup.md) | Active | React Compiler-driven cleanup |
| [enterprise.md](./enterprise.md) | Active | Enterprise/SSO/infra roadmap |
| [growth-features.md](./growth-features.md) | Active | Growth roadmap with partial shipped items |
| [public-launch.md](./public-launch.md) | Active | Distribution and community launch checklist |
| [uptime-monitoring.md](./uptime-monitoring.md) | Active | Monitor + incident/status-page product area |

---

## Jules Issues (Open)

| File | Priority | Status |
|------|----------|--------|
| [jules/open/jules-sentinel-2026-02-26-issue-search-security.md](./jules/open/jules-sentinel-2026-02-26-issue-search-security.md) | High | Open (partially mitigated, still needs access-scoped search guarantees) |
| [jules/open/jules-scribe-2024-05-22-fix-cascade-delete-limit.md](./jules/open/jules-scribe-2024-05-22-fix-cascade-delete-limit.md) | Medium | Open |
| [jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | Medium | Open |
| [jules/open/jules-spectra-2025-02-24-deduplicate-hashapikey.md](./jules/open/jules-spectra-2025-02-24-deduplicate-hashapikey.md) | Low | Open |

---

## Notes

- `todos/TODO.md` is the lightweight entry file for this index.
- Completed/archive todos were removed per current workflow.
- Use this index as the source of truth for planning and status tracking.
- Priority `01` update (2026-03-02): CI workflow now includes an `e2e-summary` job that merges shard blob reports into `e2e-merged.json`, publishes per-spec heatmap metrics to GitHub step summary, and computes clean-run streak from recent `ci.yml` run history via Actions API (`history-derived`, with `fallback-local` mode when API is unavailable). Latest baseline remains `151 passed`, `0 failed`, `4 skipped` (`155 total`). Next is live PR validation of summary/merge behavior.
