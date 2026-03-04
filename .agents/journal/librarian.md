# Librarian's Journal

## Rules

**NEVER use `pnpm.overrides`** — Do not add or modify package overrides. If a security vulnerability requires an override, skip the update and log it here instead. Let humans decide on overrides.

## Critical Learnings
- `@boxyhq/saml-jackson` pins its dependencies, requiring `pnpm.overrides` for security updates.
