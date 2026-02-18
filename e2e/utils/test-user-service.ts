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
  projectKey?: string;
  issueKeys?: string[];
  workspaceSlug?: string;
  teamSlug?: string;
  error?: string;
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
  async loginTestUser(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token?: string; refreshToken?: string; error?: string }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.loginTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.ok && result.token) {
        return { success: true, token: result.token, refreshToken: result.refreshToken };
      }
      return { success: false, error: result.error || "Login failed" };
    } catch (error) {
      console.warn(`  ⚠️ Failed to login user ${email}:`, error);
      return { success: false, error: String(error) };
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
  async seedScreenshotData(email: string): Promise<SeedScreenshotResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.seedScreenshotData, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.warn(`  ⚠️ Failed to seed screenshot data:`, error);
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
