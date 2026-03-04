# Librarian Journal

Add entries only for critical dependency/security learnings that are too important to lose.

## 2026-03-04 - Upstream-locked SAML/Jackson vulnerability cluster

- `pnpm audit --audit-level=moderate` reports 17 vulnerabilities, with a large cluster under `@boxyhq/saml-jackson@1.52.2` (`lodash`, `node-forge`, `typeorm`, `axios`, `fast-xml-parser`, and `tar` via transitive deps).
- `pnpm view @boxyhq/saml-jackson version` still returns `1.52.2` (no newer published version to upgrade to).
- Critical constraint: project policy forbids `pnpm.overrides` workaround, so this path is blocked on upstream package release or dependency replacement.
- Recheck confirms other vulnerable roots are also already latest (`vinxi@0.5.11`, `vite-plugin-pwa@1.2.0`), so the remaining advisories are currently upstream-blocked rather than upgradeable in-repo.
