# Sentinel's Journal

## 2024-05-23 - CSRF Bypass via x-api-key Header
**Vulnerability:** The CSRF middleware allowed bypassing CSRF validation if the `x-api-key` header was present, regardless of whether the request also contained session cookies.
**Learning:** Middleware logic that skips checks based on headers must verify that the skipped check's protection isn't needed. In this case, `x-api-key` implies "API client", but browsers can also send this header (if CORS allows or via XSS), while still sending cookies. This allowed attackers to use cookie-based authentication while bypassing CSRF by injecting a fake header.
**Prevention:** Logic was added to ensure that the `x-api-key` bypass ONLY applies if no authentication cookies (`access_token`, `session_id`) are present. If cookies are present, CSRF is enforced regardless of headers.

## 2024-05-24 - Timing Attack via Authentication Flow
**Vulnerability:** The login flow returned significantly faster for non-existent users compared to existing users with incorrect passwords (due to skipping the expensive bcrypt comparison).
**Learning:** Early returns in authentication logic, especially before expensive operations like hashing, leak state information. Attackers can use this time difference to enumerate valid email addresses.
**Prevention:** Implemented a constant-time comparison strategy using a dummy bcrypt hash. The authentication service now performs a hash comparison in all failure paths, ensuring response times are indistinguishable regardless of user existence.

## 2024-05-25 - Denial of Service via Memory Buffering in S3 Uploads
**Vulnerability:** The `S3StorageAdapter` was buffering entire file streams into memory (`chunks.push(chunk)`) before uploading to S3. This allowed an attacker to trigger an Out-Of-Memory (OOM) crash by uploading a large file (e.g., 5GB video), causing a Denial of Service.
**Learning:** Using `Buffer.concat` on streams without size limits is dangerous. Node.js processes have limited memory (default ~2GB). Always assume streams can exceed available memory.
**Prevention:** Refactored the upload logic to use `@aws-sdk/lib-storage`'s `Upload` class, which streams data directly to S3 using multipart uploads. Added a `PassThrough` stream to track file size without buffering.

## 2024-05-26 - Email Verification Persistence on Change
**Vulnerability:** Users could change their email address in `updateProfile` without losing their `emailVerificationTime` status. This allowed a verified user to claim any email address (including unowned ones) while appearing "verified" to the system.
**Learning:** When allowing updates to sensitive identity fields (email, phone), simply validating the format or uniqueness is insufficient. You must also reset any associated trust markers (verification timestamps).
**Prevention:** Always couple identity updates with a reset of verification state. Added logic to explicitly set `emailVerificationTime` to `undefined` when the email field changes.

## 2024-05-27 - Project Creation IDOR via Missing Hierarchy Checks
**Vulnerability:** The `createProject` mutation accepted `organizationId` and `workspaceId` arguments without verifying the caller's membership in those resources. This allowed any authenticated user to create projects in any organization or workspace by guessing their IDs.
**Learning:** Relying on `authenticatedMutation` is insufficient for resource creation. You must explicitly verify that the user has write/admin permissions on the *parent* container (Organization/Workspace) where the new resource is being created.
**Prevention:** Added explicit `getOrganizationRole` and `getWorkspaceRole` checks in the mutation handler to ensure the caller is an organization admin or workspace member.

## 2024-05-28 - Secure E2E Testing Pattern
**Vulnerability:** Concern about `testOtpCodes` storing plaintext OTPs.
**Learning:** The project uses a dedicated table `testOtpCodes` for E2E tests, separate from `authVerificationCodes` (hashed). Writes are strictly limited to `@inbox.mailtrap.io` emails via `isTestEmail` check in `OTPVerification.ts`. Read access via `/e2e/get-latest-otp` is protected by `validateE2EApiKey` which enforces an API key or Development environment.
**Prevention:** Maintain this strict separation. Ensure `validateE2EApiKey` continues to fail secure if no API key is configured in non-dev environments.

## 2026-02-10 - Public Mutations by Default
**Vulnerability:** Critical administrative functions (data purge, service config) were exposed as public `mutation`s.
**Learning:** Convex `mutation` wrapper creates a public endpoint by default. Developers must explicitly use `internalMutation` or `authenticatedMutation` (custom wrapper) to restrict access.
**Prevention:** Default to `internalMutation` for all new mutations unless explicitly intended for public client access. Use strict code review to catch `mutation` usage.

## 2026-02-10 - CI Environment Reliability
**Vulnerability:** E2E tests failed because backend logic relied on `process.env.CI` or `NODE_ENV` to detect test environment, which may be unreliable in some deployment contexts (e.g. cloud previews).
**Learning:** Do not rely on environment variables to detect test requests if possible. Use data properties (like email domain `@inbox.mailtrap.io`) which are immutable and propagated reliably.
**Prevention:** Use explicit data signals (test domains, headers) rather than environment variables for test-specific logic.

## 2025-05-21 - Secure Storage of Test Secrets in Production
**Vulnerability:** The system stored plaintext OTPs for any email ending in `@inbox.mailtrap.io`, even in production environments. While intended for E2E testing, this exposed a risk if real users (or attackers) registered with that domain, populating the database with plaintext secrets.
**Learning:** Relying solely on data properties (like email domain) for security decisions is insufficient when it triggers sensitive behaviors (like storing secrets). Environment configuration must also act as a gatekeeper.
**Prevention:** Modified `OTPVerification` and `OTPPasswordReset` to require BOTH the test email domain AND a safe environment signal (`NODE_ENV=test/dev`, `CI=true`, or `E2E_API_KEY` present). This ensures test secrets are only stored when the environment is explicitly configured for testing.

## 2025-05-22 - User Enumeration via OTP Suppression
**Vulnerability:** The OTP verification provider suppressed emails for already-verified users to avoid spamming/confusing them. This created a timing side-channel (fast DB check vs slow email send) allowing user enumeration, and also prevented verified users from logging in via OTP (Denial of Service).
**Learning:** Suppressing side-effects (like email sending) based on user state in unauthenticated or semi-authenticated flows leaks information. It also often breaks legitimate use cases (retry/login).
**Prevention:** Removed the conditional logic. The system now attempts to send the OTP regardless of the user's verification status, ensuring consistent timing and restoring functionality.

## 2026-02-14 - Project Viewer Authorization Bypass in Documents
**Vulnerability:** Project Viewers could create public documents linked to the project, effectively bypassing the read-only restriction of the "Viewer" role. They could also toggle private documents to public.
**Learning:** `assertCanAccessProject` validates read access (Viewer+), but `create` and `update` mutations must use `assertCanEditProject` (Editor+) when modifying project-linked resources, especially public ones. The distinction between "access" and "edit" must be explicitly enforced for each mutation.
**Prevention:** Audited `documents.ts` to ensure `assertCanEditProject` is used for `create` (when public) and `togglePublic`.

## 2025-02-18 - Encrypted E2E Test Secrets
**Vulnerability:** The system stored plaintext OTPs for test emails (@inbox.mailtrap.io) in the `testOtpCodes` table whenever `E2E_API_KEY` was present in the environment (e.g. production). If the database was compromised, these OTPs were readable.
**Learning:** Even conditional storage for testing purposes should be encrypted at rest if the environment contains the necessary keys. Relying on "it's just for testing" often leaks into production configurations where testing tools are enabled.
**Prevention:** Implemented AES-GCM encryption for stored test OTPs using the `E2E_API_KEY` as the encryption key. OTPs are only decryptable when the key is present and verified.

## 2026-02-15 - SSRF via DNS Rebinding in Webhooks
**Vulnerability:** The webhook delivery logic checked the destination IP against private ranges (SSRF protection) via DNS resolution, but then performed a second DNS resolution during the actual HTTP request. This Time-of-Check to Time-of-Use (TOCTOU) race condition allowed attackers to return a public IP during the check and a private IP during the request (DNS Rebinding), bypassing SSRF protection.
**Learning:** Validating a hostname's IP is insufficient if the subsequent request re-resolves the hostname. The resolved IP must be "pinned" and used for the connection.
**Prevention:** Modified `deliverWebhook` to resolve the IP address first, validate it, and then rewrite the HTTP URL to use the resolved IP (while setting the `Host` header to the original hostname). This ensures the checked IP is the same one used for the connection.

## 2025-05-23 - Rate Limit Bypass via IP Spoofing
**Vulnerability:** The password reset rate limiter relied on `x-forwarded-for` header's first value without validation. This allowed attackers to bypass rate limits by spoofing the header (e.g., `X-Forwarded-For: <fake-ip>`), as many load balancers append the real IP rather than replacing the header.
**Learning:** Naively trusting `X-Forwarded-For` is dangerous in cloud environments where the trust chain is unknown or variable. The first IP in the list is only trustworthy if the edge platform guarantees stripping of incoming headers.
**Prevention:** Implemented `getClientIp` helper that prioritizes immutable headers like `CF-Connecting-IP` (Cloudflare) and `True-Client-IP`, and falls back to `X-Forwarded-For` only when necessary. This significantly raises the bar for spoofing.

## 2025-05-24 - User Email Exposure via IDOR
**Vulnerability:** The `api.users.get` query allowed any authenticated user to fetch the email address of any other user by knowing their user ID. This is an IDOR (Insecure Direct Object Reference) vulnerability leading to PII exposure.
**Learning:** Default object access patterns (like fetching a user by ID) often return the full object representation. When dealing with sensitive fields like email, context-aware serialization is crucial. You must verify the relationship between the requester and the target resource before returning sensitive data.
**Prevention:** Implemented a check in `api.users.get` to verify if the requester shares an organization with the target user. If not, the email field is stripped from the response using `sanitizeUserForPublic`.

## 2025-02-23 - SSRF Bypass via IPv4-Mapped IPv6 Hex Notation
**Learning:** Validation logic for "private IP" must account for all valid representations of an IP address. The standard regex for IPv4-mapped IPv6 (`::ffff:1.2.3.4`) missed the alternative hex notation (`::ffff:7f00:1`), allowing attackers to bypass SSRF protection by encoding private IPs (like 127.0.0.1) in an unexpected format.
**Action:** When implementing IP allow/block lists, normalize IP addresses to a canonical format (bytes or standard string) before checking, or ensure regex patterns cover all RFC-compliant variations including compressed, expanded, and mapped forms.

## 2026-02-24 - Workspace Authorization Gap in Document Creation
**Vulnerability:** Document creation allowed any organization member to create documents in any workspace within that organization, bypassing workspace membership checks. This occurred because `validateWorkspaceIntegrity` only verified that the workspace belonged to the organization, not that the user belonged to the workspace.
**Learning:** When resources (like Documents) can be parented by multiple container types (Project OR Workspace), you must explicitly validate membership for the specific container being used. Implicit organization-level checks are insufficient for workspace-scoped resources.
**Action:** Enforce strict membership checks (e.g., `isWorkspaceEditor`) whenever a resource is linked to a specific container ID, even if a higher-level container (Organization) check has passed.

## 2025-02-23 - SSRF Bypass via IPv6 Normalization
**Vulnerability:** The `isPrivateIPv6` check relied on simple string matching (e.g. `ip === "::1"`) which failed to catch alternative representations like expanded loopback `0:0:0:0:0:0:0:1` or `::0001`.
**Learning:** Security checks on IPv6 addresses must operate on a canonical/normalized form because there are too many valid string representations for the same address. Relying on regex or string equality on raw input is prone to bypasses.
**Action:** Implemented `expandIPv6` to normalize all IPv6 addresses to a 32-digit hex string before validation. Future IP checks should always normalize first.

## 2026-02-25 - Authentication Bypass via Request URL Spoofing
**Vulnerability:** The E2E endpoint authentication relied on `request.url` to detect if the request was coming from `localhost` to allow bypassing the API key check. This could be exploited by spoofing the Host header or URL construction in certain environments, tricking the backend into believing it was running locally.
**Learning:** `request.url` in serverless/cloud functions is often constructed from headers that can be manipulated by the client (Host header injection). It should not be used as a trusted source for determining the deployment environment.
**Prevention:** Modified `validateE2EApiKey` to check `process.env.CONVEX_SITE_URL` (via `getConvexSiteUrl()`) instead of `request.url`. This relies on the immutable server configuration to determine if the environment is local or production.

## 2025-05-25 - SSO Domain Hijacking via Bounded Query Limitation
**Vulnerability:** The SSO domain verification logic relied on `ctx.db.query("ssoConnections").take(BOUNDED_LIST_LIMIT)` (100 items) to check for duplicate domains. If more than 100 SSO connections existed, a new connection could claim a domain already owned by an existing connection (if it was outside the returned page), allowing authentication hijacking.
**Learning:** Security checks (uniqueness, permissions) must never rely on bounded queries or pagination limits unless the dataset is guaranteed to be small. Relying on "most deployments have <100 items" is a security flaw in multi-tenant systems.
**Prevention:** Implemented a dedicated `ssoDomains` table with a unique index on `domain`. This allows O(1) uniqueness checks and lookups regardless of the number of connections, ensuring scalability and security.

## 2026-03-01 - SSRF Prevention via Reusable Safe Fetch
**Vulnerability:** The Pumble integration used a custom `fetch` implementation with weak validation (`.includes("pumble.com")`) that could be bypassed for SSRF. It also did not prevent DNS rebinding or private IP access, unlike the main webhook delivery system.
**Learning:** Ad-hoc implementation of security-critical logic (like safe HTTP fetching) often leads to vulnerabilities. Security features like SSRF protection should be encapsulated in reusable helpers and used consistently across the codebase.
**Prevention:** Extracted the robust SSRF protection logic from `webhookHelpers.ts` into a reusable `safeFetch` helper and applied it to the Pumble integration, ensuring consistent protection against SSRF, DNS rebinding, and private IP access.

## 2025-02-18 - IP Spoofing via Header Priority
**Learning:** Generic `getClientIp` helpers often prioritize vendor-specific headers (like `X-Client-IP` or `X-Real-IP`) over standard `X-Forwarded-For`. This is dangerous because many standard load balancers (e.g., AWS ALB) do not strip or overwrite these headers, allowing attackers to spoof their IP by simply sending the header.
**Action:** Always prioritize the last IP in `X-Forwarded-For` (which is appended by the trusted proxy) over single-value headers unless the specific environment guarantees those headers are secure.

## 2026-03-02 - Rate Limit Bypass in Auth via Library Routes
**Vulnerability:** The `api.auth.signIn` endpoint (handled by `convex-auth` library) lacked IP-based rate limiting, allowing distributed email spam attacks (credential stuffing or verification spam) that bypassed per-email rate limits.
**Learning:** External libraries that automatically register HTTP routes often bypass application-level middleware or security wrappers. You must inspect how libraries add routes and intercept them if they lack critical security controls like rate limiting.
**Action:** Monkey-patched `http.route` in `convex/http.ts` to intercept `/api/auth/signin` requests and enforce a strict IP-based rate limit (`authAttempt`) before delegating to the library handler.

## 2026-02-17 - Cross-Organization Authorization Bypass via Unvalidated ID Relations
**Vulnerability:** The `sendInvite` mutation allowed attackers to create invites scoped to an arbitrary Organization by linking them to a Project they controlled in a *different* Organization. The authorization check passed because the user was a Project Admin (valid for the project) but the mutation failed to verify that the project actually belonged to the target Organization.
**Learning:** When a mutation accepts multiple resource IDs (e.g. `organizationId` and `projectId`), validating the user's permission on each ID independently is insufficient. You MUST also validate the relationship between the resources themselves (e.g. `project.organizationId === args.organizationId`) to prevent "confused deputy" attacks where a valid permission on Resource A is used to authorize an action on unrelated Resource B.
**Prevention:** Added a strict validation check in `sendInvite` to ensure the provided `projectId` belongs to the specified `organizationId`. Always enforce hierarchy checks when crossing resource boundaries.
