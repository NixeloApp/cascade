/**
 * Test User Service
 *
 * Encapsulates all E2E API calls for test user management.
 * Single source of truth for API interactions.
 */

import { E2E_ENDPOINTS, getE2EHeaders } from "../config";

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  existing?: boolean;
  error?: string;
}

export interface RbacProjectConfig {
  projectKey: string;
  projectName: string;
  adminEmail: string;
  editorEmail: string;
  viewerEmail: string;
}

export interface RbacProjectResult {
  success: boolean;
  projectKey?: string;
  projectId?: string;
  orgSlug?: string;
  organizationId?: string;
  error?: string;
}

export interface SeedScreenshotResult {
  success: boolean;
  orgSlug?: string;
  projectId?: string;
  projectKey?: string;
  issueKeys?: string[];
  documentIds?: {
    projectRequirements?: string;
    sprintRetrospectiveNotes?: string;
  };
  workspaceSlug?: string;
  teamSlug?: string;
  inviteToken?: string;
  portalToken?: string;
  portalProjectId?: string;
  unsubscribeTokens?: {
    desktopDark?: string;
    desktopLight?: string;
    tabletLight?: string;
    mobileLight?: string;
  };
  error?: string;
}

export interface UpdateProjectWorkflowStateResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export interface ResetMeetingsDataResult {
  success: boolean;
  deletedRecordings?: number;
  error?: string;
}

export interface CheckProjectIssueDuplicatesResult {
  success: boolean;
  matchCount?: number;
  issueKeys?: string[];
  error?: string;
}

export interface DeleteSeededProjectIssueResult {
  success: boolean;
  deleted?: number;
  error?: string;
}

export type ProjectInboxScreenshotState = "default" | "openEmpty" | "closedEmpty";
export type ProjectAnalyticsScreenshotState = "default" | "sparseData" | "noActivity";
export type OrgAnalyticsScreenshotState = "default" | "sparseData" | "noActivity";
export type NotificationsScreenshotState =
  | "default"
  | "inboxEmpty"
  | "archivedEmpty"
  | "unreadOverflow";

export interface ConfigureProjectInboxStateResult {
  success: boolean;
  closedCount?: number;
  openCount?: number;
  projectId?: string;
  error?: string;
}

export interface ConfigureNotificationsStateResult {
  success: boolean;
  archivedCount?: number;
  unreadCount?: number;
  visibleCount?: number;
  projectId?: string;
  error?: string;
}

export interface ConfigureProjectAnalyticsStateResult {
  success: boolean;
  activityCount?: number;
  issueCount?: number;
  projectId?: string;
  sprintCount?: number;
  error?: string;
}

export interface ConfigureOrgAnalyticsStateResult {
  success: boolean;
  activityCount?: number;
  issueCount?: number;
  projectId?: string;
  sprintCount?: number;
  error?: string;
}

export interface E2EWorkflowState {
  id: string;
  name: string;
  category: "todo" | "inprogress" | "done";
  order: number;
  wipLimit?: number;
}

export interface GoogleOAuthLoginResult {
  success: boolean;
  email?: string;
  userId?: string;
  token?: string;
  refreshToken?: string;
  redirectUrl?: string;
  error?: string;
}

export interface TestUserLoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
  status?: number;
  repairedAccount?: boolean;
  repairAttempted?: boolean;
}

/**
 * Service class for E2E test user API operations
 */
export class TestUserService {
  /**
   * Delete a test user via E2E API
   */
  async deleteTestUser(email: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.deleteTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to delete user ${email}:`, error);
      return false;
    }
  }

  /**
   * Create a test user via E2E API (with password hash - bypasses email verification)
   */
  async createTestUser(
    email: string,
    password: string,
    skipOnboarding = false,
  ): Promise<CreateUserResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.createTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, password, skipOnboarding }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`  ⚠️ Failed to create user ${email}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Login a test user via E2E API (bypassing UI)
   */
  async loginTestUser(email: string, password: string): Promise<TestUserLoginResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.loginTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.ok && result.token) {
        return {
          success: true,
          token: result.token,
          refreshToken: result.refreshToken,
          status: response.status,
        };
      }
      return {
        success: false,
        error: result.error || "Login failed",
        status: response.status,
      };
    } catch (error) {
      console.warn(`  ⚠️ Failed to login user ${email}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Login a test user via E2E API and repair stale seeded-account state when needed.
   * Owns the known `InvalidAccountId` recovery path so auth helpers can use one contract.
   */
  async loginTestUserWithRepair(
    email: string,
    password: string,
    skipOnboarding = false,
  ): Promise<TestUserLoginResult> {
    let loginResult = await this.loginTestUser(email, password);

    if (!loginResult.success && loginResult.error?.includes("InvalidAccountId")) {
      const repairResult = await this.createTestUser(email, password, skipOnboarding);
      if (repairResult.success || repairResult.existing) {
        loginResult = await this.loginTestUser(email, password);
        return {
          ...loginResult,
          repairedAccount: loginResult.success,
          repairAttempted: true,
        };
      }

      return {
        ...loginResult,
        error: repairResult.error || loginResult.error,
        repairedAccount: false,
        repairAttempted: true,
      };
    }

    return loginResult;
  }

  /**
   * Trigger password reset OTP dispatch for a test user
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.requestPasswordReset, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return response.ok && result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to request password reset for ${email}:`, error);
      return false;
    }
  }

  /**
   * Verify a test user's email via E2E API
   */
  async verifyTestUser(email: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.verifyTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return result.success === true && result.verified === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to verify user ${email}:`, error);
      return false;
    }
  }

  /**
   * Setup RBAC test project with users in different roles
   */
  async setupRbacProject(config: RbacProjectConfig): Promise<RbacProjectResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.setupRbacProject, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify(config),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`  ⚠️ Failed to setup RBAC project:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Cleanup RBAC test project
   */
  async cleanupRbacProject(projectKey: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.cleanupRbacProject, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ projectKey }),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to cleanup RBAC project:`, error);
      return false;
    }
  }

  async cleanupOldTestUsers(): Promise<{ deleted: number }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.cleanup, {
        method: "POST",
        headers: getE2EHeaders(),
      });
      const result = await response.json();
      return { deleted: result.deleted || 0 };
    } catch (error) {
      console.warn(`  ⚠️ Failed to cleanup old test users:`, error);
      return { deleted: 0 };
    }
  }

  /**
   * Force delete ALL test users and their associated data
   */
  async nukeTestUsers(): Promise<{ success: boolean; deleted: number }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.nukeTestUsers || `${E2E_ENDPOINTS.cleanup}-nuke`, {
        method: "POST",
        headers: getE2EHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to nuke test users:`, error);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * Debug: Verify password against stored hash (for debugging auth issues)
   */
  async debugVerifyPassword(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    accountFound: boolean;
    hasStoredHash: boolean;
    passwordMatches?: boolean;
    emailVerified?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.debugVerifyPassword, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to verify password for ${email}:`, error);
      return { success: false, accountFound: false, hasStoredHash: false, error: String(error) };
    }
  }

  /**
   * Update organization settings for testing different profiles
   * @param orgSlug - The organization slug to update
   * @param settings - Partial settings to update (only provided fields are changed)
   */
  async updateOrganizationSettings(
    orgSlug: string,
    settings: {
      defaultMaxHoursPerWeek?: number;
      defaultMaxHoursPerDay?: number;
      requiresTimeApproval?: boolean;
      billingEnabled?: boolean;
    },
  ): Promise<{
    success: boolean;
    organizationId?: string;
    updatedSettings?: {
      defaultMaxHoursPerWeek: number;
      defaultMaxHoursPerDay: number;
      requiresTimeApproval: boolean;
      billingEnabled: boolean;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.updateOrganizationSettings, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, settings }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to update organization settings for ${orgSlug}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Seed project templates
   */
  async seedTemplates(): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.seedTemplates, {
        method: "POST",
        headers: getE2EHeaders(),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to seed templates:`, error);
      return false;
    }
  }

  /**
   * Seed screenshot data (workspace, team, project, sprint, issues, documents)
   */
  async seedScreenshotData(
    email: string,
    options: { orgSlug?: string } = {},
  ): Promise<SeedScreenshotResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.seedScreenshotData, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, orgSlug: options.orgSlug }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to seed screenshot data:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a screenshot-created issue so later captures keep seeded counts stable.
   */
  async deleteSeededProjectIssue(
    orgSlug: string,
    projectKey: string,
    issueTitle: string,
  ): Promise<DeleteSeededProjectIssueResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.deleteSeededProjectIssue, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, issueTitle }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to delete seeded screenshot issue "${issueTitle}" for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reconfigure a seeded project inbox for screenshot capture.
   */
  async configureProjectInboxState(
    orgSlug: string,
    projectKey: string,
    mode: ProjectInboxScreenshotState,
  ): Promise<ConfigureProjectInboxStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.configureProjectInboxState, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, mode }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to configure project inbox state ${mode} for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reconfigure a seeded project's analytics data for screenshot capture.
   */
  async configureProjectAnalyticsState(
    orgSlug: string,
    projectKey: string,
    mode: ProjectAnalyticsScreenshotState,
  ): Promise<ConfigureProjectAnalyticsStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.configureProjectAnalyticsState, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, mode }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to configure analytics state ${mode} for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reconfigure seeded org analytics data for screenshot capture.
   */
  async configureOrgAnalyticsState(
    orgSlug: string,
    projectKey: string,
    mode: OrgAnalyticsScreenshotState,
  ): Promise<ConfigureOrgAnalyticsStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.configureOrgAnalyticsState, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, mode }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to configure org analytics state ${mode} for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reconfigure seeded notifications data for screenshot capture.
   */
  async configureNotificationsState(
    orgSlug: string,
    projectKey: string,
    mode: NotificationsScreenshotState,
  ): Promise<ConfigureNotificationsStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.configureNotificationsState, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, mode }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to configure notifications state ${mode} for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reset meetings data for a specific E2E user.
   */
  async resetMeetingsData(email: string): Promise<ResetMeetingsDataResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.resetMeetingsData, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to reset meetings data for ${email}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update a seeded project's workflow state for interactive screenshot capture.
   */
  async updateProjectWorkflowState(
    orgSlug: string,
    projectKey: string,
    stateId: string,
    wipLimit: number | null,
  ): Promise<UpdateProjectWorkflowStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.updateProjectWorkflowState, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, stateId, wipLimit }),
      });
      return await response.json();
    } catch (error) {
      console.warn(
        `  ⚠️ Failed to update workflow state ${stateId} for ${projectKey} in ${orgSlug}:`,
        error,
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Replace a seeded project's workflow states for interactive screenshot capture.
   */
  async replaceProjectWorkflowStates(
    orgSlug: string,
    projectKey: string,
    workflowStates: E2EWorkflowState[],
  ): Promise<UpdateProjectWorkflowStateResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.replaceProjectWorkflowStates, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, workflowStates }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to replace workflow states for ${projectKey} in ${orgSlug}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check whether duplicate-detection search is ready for a seeded project.
   */
  async checkProjectIssueDuplicates(
    orgSlug: string,
    projectKey: string,
    query: string,
  ): Promise<CheckProjectIssueDuplicatesResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.checkProjectIssueDuplicates, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ orgSlug, projectKey, query }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to check duplicate matches for ${projectKey} in ${orgSlug}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Login via Google OAuth using a refresh token (bypasses browser OAuth flow)
   *
   * Uses the OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN if no token is provided.
   * This creates/logs in the Google user and returns auth tokens.
   *
   * @param options.refreshToken - Google refresh token (optional, uses env var if not provided)
   * @param options.skipOnboarding - Skip onboarding for new users
   * @returns Auth tokens and user info
   */
  async googleOAuthLogin(
    options: { refreshToken?: string; skipOnboarding?: boolean } = {},
  ): Promise<GoogleOAuthLoginResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.googleOAuthLogin, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({
          refreshToken: options.refreshToken,
          skipOnboarding: options.skipOnboarding ?? false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Request failed with status ${response.status}`,
        };
      }

      return result;
    } catch (error) {
      console.warn(`  ⚠️ Failed to login via Google OAuth:`, error);
      return { success: false, error: String(error) };
    }
  }
}

// Singleton instance for convenience
export const testUserService = new TestUserService();
