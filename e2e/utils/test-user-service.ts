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
}

// Singleton instance for convenience
export const testUserService = new TestUserService();
