## 2026-02-10 - Public Mutations by Default
**Vulnerability:** Critical administrative functions (data purge, service config) were exposed as public `mutation`s.
**Learning:** Convex `mutation` wrapper creates a public endpoint by default. Developers must explicitly use `internalMutation` or `authenticatedMutation` (custom wrapper) to restrict access.
**Prevention:** Default to `internalMutation` for all new mutations unless explicitly intended for public client access. Use strict code review to catch `mutation` usage.
