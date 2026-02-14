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
