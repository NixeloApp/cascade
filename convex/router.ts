/**
 * HTTP Router
 *
 * Main Convex HTTP router for REST API and webhooks.
 * Routes external requests to appropriate handlers.
 * Includes E2E test endpoints and OAuth callbacks.
 */

import { httpRouter } from "convex/server";
import { handler as issuesHandler } from "./api/issues";
import { securePasswordReset, securePasswordResetPreflight } from "./authWrapper";
import {
  batchCleanupEndpoint,
  checkProjectIssueDuplicatesEndpoint,
  cleanupE2EWorkspacesEndpoint,
  cleanupRbacProjectEndpoint,
  cleanupTestUsersEndpoint,
  configureAssistantStateEndpoint,
  configureNotificationsStateEndpoint,
  configureOrgAnalyticsStateEndpoint,
  configureProjectAnalyticsStateEndpoint,
  configureProjectInboxStateEndpoint,
  configureProjectsStateEndpoint,
  configureRoadmapStateEndpoint,
  configureTimeTrackingStateEndpoint,
  createTestUserEndpoint,
  debugVerifyPasswordEndpoint,
  deleteSeededProjectIssueEndpoint,
  deleteTestUserEndpoint,
  getLatestOTPEndpoint,
  googleOAuthLoginEndpoint,
  loginTestUserEndpoint,
  nukeAllE2EWorkspacesEndpoint,
  nukeAllTestUsersEndpoint,
  nukeTimersEndpoint,
  replaceProjectWorkflowStatesEndpoint,
  requestPasswordResetEndpoint,
  resetMeetingsDataEndpoint,
  resetOnboardingEndpoint,
  resetTestWorkspaceEndpoint,
  seedScreenshotDataEndpoint,
  seedTemplatesEndpoint,
  setupRbacProjectEndpoint,
  updateOrganizationSettingsEndpoint,
  updateProjectWorkflowStateEndpoint,
  verifyTestUserEndpoint,
} from "./e2e";
import {
  handleCallback as handleGitHubCallback,
  initiateAuth as initiateGitHubAuth,
  listRepos as listGitHubRepos,
} from "./http/githubOAuth";
import { handleCallback, initiateAuth, triggerSync } from "./http/googleOAuth";
import { handleIntakePreflight, handleIntakeSubmission } from "./http/intake";
import { handleGmailCallback, initiateGmailAuth } from "./http/outreachOAuth";
import { handleSlashCommand } from "./http/slackCommands";
import {
  handleCallback as handleSlackCallback,
  initiateAuth as initiateSlackAuth,
} from "./http/slackOAuth";
import { handleUnfurl } from "./http/slackUnfurl";
import {
  handleClickRedirect,
  handleOpenPixel,
  handleUnsubscribeGet,
  handleUnsubscribePost,
} from "./outreach/tracking";

const http = httpRouter();

// REST API routes
http.route({
  path: "/api/issues",
  method: "GET",
  handler: issuesHandler,
});

// Public intake endpoint for external issue submissions
http.route({
  path: "/api/intake",
  method: "POST",
  handler: handleIntakeSubmission,
});
http.route({
  path: "/api/intake",
  method: "OPTIONS",
  handler: handleIntakePreflight,
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

// Slack OAuth routes (for workspace notifications integration)
http.route({
  path: "/slack/auth",
  method: "GET",
  handler: initiateSlackAuth,
});

http.route({
  path: "/slack/callback",
  method: "GET",
  handler: handleSlackCallback,
});

http.route({
  path: "/slack/commands",
  method: "POST",
  handler: handleSlashCommand,
});

http.route({
  path: "/slack/unfurl",
  method: "POST",
  handler: handleUnfurl,
});

// Auth wrapper routes (security)
http.route({
  path: "/auth/request-reset",
  method: "POST",
  handler: securePasswordReset,
});

http.route({
  path: "/auth/request-reset",
  method: "OPTIONS",
  handler: securePasswordResetPreflight,
});

// Outreach OAuth routes (Gmail mailbox connection)
http.route({
  path: "/outreach/google/auth",
  method: "GET",
  handler: initiateGmailAuth,
});

http.route({
  path: "/outreach/google/callback",
  method: "GET",
  handler: handleGmailCallback,
});

// Outreach tracking routes (open pixel, click redirect, unsubscribe)
// Use pathPrefix for dynamic segments: /t/o/{enrollmentId}, /t/c/{linkId}, /t/u/{enrollmentId}
http.route({
  pathPrefix: "/t/o/",
  method: "GET",
  handler: handleOpenPixel,
});

http.route({
  pathPrefix: "/t/c/",
  method: "GET",
  handler: handleClickRedirect,
});

http.route({
  pathPrefix: "/t/u/",
  method: "GET",
  handler: handleUnsubscribeGet,
});

http.route({
  pathPrefix: "/t/u/",
  method: "POST",
  handler: handleUnsubscribePost,
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

// Trigger password reset dispatch for a test user
http.route({
  path: "/e2e/request-password-reset",
  method: "POST",
  handler: requestPasswordResetEndpoint,
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

// Update a seeded project's workflow state for interactive screenshot capture
http.route({
  path: "/e2e/update-project-workflow-state",
  method: "POST",
  handler: updateProjectWorkflowStateEndpoint,
});

// Replace a seeded project's workflow states for interactive screenshot capture
http.route({
  path: "/e2e/replace-project-workflow-states",
  method: "POST",
  handler: replaceProjectWorkflowStatesEndpoint,
});

// Check duplicate-detection search readiness for seeded screenshot projects
http.route({
  path: "/e2e/check-project-issue-duplicates",
  method: "POST",
  handler: checkProjectIssueDuplicatesEndpoint,
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

// Reset meetings data for a specific E2E user
http.route({
  path: "/e2e/reset-meetings-data",
  method: "POST",
  handler: resetMeetingsDataEndpoint,
});

// Seed screenshot data (workspace, team, project, issues, documents)
http.route({
  path: "/e2e/seed-screenshot-data",
  method: "POST",
  handler: seedScreenshotDataEndpoint,
});

// Delete screenshot-created issues so later captures stay deterministic
http.route({
  path: "/e2e/delete-seeded-project-issue",
  method: "POST",
  handler: deleteSeededProjectIssueEndpoint,
});

// Reconfigure seeded projects list data for screenshot captures
http.route({
  path: "/e2e/configure-projects-state",
  method: "POST",
  handler: configureProjectsStateEndpoint,
});

// Reconfigure seeded project inbox data for screenshot captures
http.route({
  path: "/e2e/configure-project-inbox-state",
  method: "POST",
  handler: configureProjectInboxStateEndpoint,
});

http.route({
  path: "/e2e/configure-roadmap-state",
  method: "POST",
  handler: configureRoadmapStateEndpoint,
});

http.route({
  path: "/e2e/configure-time-tracking-state",
  method: "POST",
  handler: configureTimeTrackingStateEndpoint,
});

http.route({
  path: "/e2e/configure-project-analytics-state",
  method: "POST",
  handler: configureProjectAnalyticsStateEndpoint,
});

http.route({
  path: "/e2e/configure-org-analytics-state",
  method: "POST",
  handler: configureOrgAnalyticsStateEndpoint,
});

http.route({
  path: "/e2e/configure-notifications-state",
  method: "POST",
  handler: configureNotificationsStateEndpoint,
});

http.route({
  path: "/e2e/configure-assistant-state",
  method: "POST",
  handler: configureAssistantStateEndpoint,
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
