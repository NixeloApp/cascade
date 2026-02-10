## 2026-02-10 - Public Mutations by Default
**Vulnerability:** Critical administrative functions (data purge, service config) were exposed as public `mutation`s.
**Learning:** Convex `mutation` wrapper creates a public endpoint by default. Developers must explicitly use `internalMutation` or `authenticatedMutation` (custom wrapper) to restrict access.
**Prevention:** Default to `internalMutation` for all new mutations unless explicitly intended for public client access. Use strict code review to catch `mutation` usage.

## 2026-02-10 - CI Environment Reliability
**Vulnerability:** E2E tests failed because backend logic relied on `process.env.CI` or `NODE_ENV` to detect test environment, which may be unreliable in some deployment contexts (e.g. cloud previews).
**Learning:** Do not rely on environment variables to detect test requests if possible. Use data properties (like email domain `@inbox.mailtrap.io`) which are immutable and propagated reliably.
**Prevention:** Use explicit data signals (test domains, headers) rather than environment variables for test-specific logic.
