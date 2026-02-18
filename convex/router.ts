import { httpRouter } from "convex/server";
import { handler as issuesHandler } from "./api/issues";
import { securePasswordReset } from "./authWrapper";
import {
  batchCleanupEndpoint,
  cleanupE2EWorkspacesEndpoint,
  cleanupRbacProjectEndpoint,
  cleanupTestUsersEndpoint,
  createTestUserEndpoint,
  debugVerifyPasswordEndpoint,
  deleteTestUserEndpoint,
  getLatestOTPEndpoint,
  googleOAuthLoginEndpoint,
  loginTestUserEndpoint,
  nukeAllE2EWorkspacesEndpoint,
  nukeAllTestUsersEndpoint,
  nukeTimersEndpoint,
  resetOnboardingEndpoint,
  resetTestWorkspaceEndpoint,
  seedScreenshotDataEndpoint,
  seedTemplatesEndpoint,
  setupRbacProjectEndpoint,
  updateOrganizationSettingsEndpoint,
  verifyTestUserEndpoint,
} from "./e2e";
import {
  handleCallback as handleGitHubCallback,
  initiateAuth as initiateGitHubAuth,
  listRepos as listGitHubRepos,
} from "./http/githubOAuth";
import { handleCallback, initiateAuth, triggerSync } from "./http/googleOAuth";

const http = httpRouter();

// REST API routes
http.route({
  path: "/api/issues",
  method: "GET",
  handler: issuesHandler,
});

// Google Calendar OAuth routes
http.route({
  path: "/google/auth",
  method: "GET",
  handler: initiateAuth,
});

http.route({
  path: "/google/callback",
  method: "GET",
  handler: handleCallback,
});

http.route({
  path: "/google/sync",
  method: "POST",
  handler: triggerSync,
});

// GitHub OAuth routes (for repository linking)
http.route({
  path: "/github/auth",
  method: "GET",
  handler: initiateGitHubAuth,
});

http.route({
  path: "/github/callback",
  method: "GET",
  handler: handleGitHubCallback,
});

http.route({
  path: "/github/repos",
  method: "GET",
  handler: listGitHubRepos,
});

// Auth wrapper routes (security)
http.route({
  path: "/auth/request-reset",
  method: "POST",
  handler: securePasswordReset,
});

// E2E testing routes
// Create a test user (bypassing email verification)
http.route({
  path: "/e2e/create-test-user",
  method: "POST",
  handler: createTestUserEndpoint,
});

// Delete a test user
http.route({
  path: "/e2e/delete-test-user",
  method: "POST",
  handler: deleteTestUserEndpoint,
});

// Login test user via API
http.route({
  path: "/e2e/login-test-user",
  method: "POST",
  handler: loginTestUserEndpoint,
});

// Get latest OTP for a test user
http.route({
  path: "/e2e/get-latest-otp",
  method: "POST",
  handler: getLatestOTPEndpoint,
});

// Reset onboarding state for test user(s)
http.route({
  path: "/e2e/reset-onboarding",
  method: "POST",
  handler: resetOnboardingEndpoint,
});

// Garbage collection - cleanup old test users
http.route({
  path: "/e2e/cleanup",
  method: "POST",
  handler: cleanupTestUsersEndpoint,
});

// Force delete ALL test users and their associated data
http.route({
  path: "/e2e/nuke-test-users",
  method: "POST",
  handler: nukeAllTestUsersEndpoint,
});

// Set up RBAC test project with users in different roles
http.route({
  path: "/e2e/setup-rbac-project",
  method: "POST",
  handler: setupRbacProjectEndpoint,
});

// Clean up RBAC test project
http.route({
  path: "/e2e/cleanup-rbac-project",
  method: "POST",
  handler: cleanupRbacProjectEndpoint,
});

// Verify a test user's email (bypass verification flow)
http.route({
  path: "/e2e/verify-test-user",
  method: "POST",
  handler: verifyTestUserEndpoint,
});

// Debug: Verify a password against stored hash
http.route({
  path: "/e2e/debug-verify-password",
  method: "POST",
  handler: debugVerifyPasswordEndpoint,
});

// Update organization settings for testing different profiles
http.route({
  path: "/e2e/update-organization-settings",
  method: "POST",
  handler: updateOrganizationSettingsEndpoint,
});

// Seed built-in project templates
http.route({
  path: "/e2e/seed-templates",
  method: "POST",
  handler: seedTemplatesEndpoint,
});

// Cleanup ALL E2E workspaces
http.route({
  path: "/e2e/cleanup-workspaces",
  method: "POST",
  handler: cleanupE2EWorkspacesEndpoint,
});

// Nuke ALL E2E workspaces
http.route({
  path: "/e2e/nuke-workspaces",
  method: "POST",
  handler: nukeAllE2EWorkspacesEndpoint,
});

// Nuke timers
http.route({
  path: "/e2e/nuke-timers",
  method: "POST",
  handler: nukeTimersEndpoint,
});

// Reset specific test workspace
http.route({
  path: "/e2e/reset-workspace",
  method: "POST",
  handler: resetTestWorkspaceEndpoint,
});

// Seed screenshot data (workspace, team, project, issues, documents)
http.route({
  path: "/e2e/seed-screenshot-data",
  method: "POST",
  handler: seedScreenshotDataEndpoint,
});

// Batch cleanup - call repeatedly until done=true (avoids 32k read limit)
http.route({
  path: "/e2e/batch-cleanup",
  method: "POST",
  handler: batchCleanupEndpoint,
});

// Google OAuth login via refresh token (bypasses browser OAuth flow)
http.route({
  path: "/e2e/google-oauth-login",
  method: "POST",
  handler: googleOAuthLoginEndpoint,
});

export default http;
