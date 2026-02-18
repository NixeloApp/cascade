/**
 * E2E Test Configuration
 *
 * Centralized configuration for E2E tests including test user credentials,
 * API endpoints, and test settings.
 */

/**
 * Get a required environment variable. Throws if not defined.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Convex site URL for E2E API endpoints
// Derived from VITE_CONVEX_URL (same pattern as frontend)
// For local backend: HTTP actions are served on port 3211 (site), while client is 3210
function getConvexSiteUrl(): string {
  // Use the explicit site URL if available (e.g. from .env.local created by convex dev)
  if (process.env.VITE_CONVEX_SITE_URL) {
    return process.env.VITE_CONVEX_SITE_URL;
  }

  const convexUrl = requireEnv("VITE_CONVEX_URL");
  // Local backend uses port 3211 for HTTP actions (site URL)
  if (convexUrl.includes("127.0.0.1:3210") || convexUrl.includes("localhost:3210")) {
    return convexUrl.replace(":3210", ":3211");
  }

  // Cloud deployment: .convex.cloud -> .convex.site
  return convexUrl.replace(".convex.cloud", ".convex.site");
}

export const CONVEX_SITE_URL = getConvexSiteUrl();

// E2E API Key for authenticated endpoints (optional in dev)
export const E2E_API_KEY = process.env.E2E_API_KEY || "";

/**
 * Get headers for E2E API requests
 */
export function getE2EHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (E2E_API_KEY) {
    headers["x-e2e-api-key"] = E2E_API_KEY;
  }
  return headers;
}

/**
 * User Roles
 */
export type PlatformRole = "user" | "superAdmin";
export type ProjectRole = "viewer" | "editor" | "admin";
export type OnboardingPersona = "team_lead" | "team_member";

/**
 * Test User Configuration
 */
export interface TestUser {
  email: string;
  password: string;
  platformRole: PlatformRole;
  onboardingPersona?: OnboardingPersona;
  description: string;
}

/**
 * Get the current shard index (for CI isolation)
 * Defaults to "0" for local development
 */
function getShardIndex(): string {
  return process.env.SHARD_INDEX || "0";
}

const SHARD = getShardIndex();

/**
 * Test Users Configuration
 *
 * All test users use @inbox.mailtrap.io domain for email verification.
 * Users are created on first run and reused across test runs.
 *
 * EMAIL FORMAT: e2e-[role]-s[shard]-[worker?]@inbox.mailtrap.io
 * - shard: From CI SHARD_INDEX (0 for local)
 * - worker: Added dynamically in global-setup/fixtures (w0, w1...)
 *
 * Platform Roles:
 * - admin: Full platform access, can manage users and invites
 * - user: Standard user access
 *
 * Onboarding Personas:
 * - team_lead: Creates projects, manages team
 * - team_member: Joins existing projects
 */
export const TEST_USERS = {
  // Platform admin user - full admin access
  admin: {
    email: `e2e-admin-s${SHARD}@inbox.mailtrap.io`,
    password: "E2ETestPassword123!",
    platformRole: "superAdmin" as PlatformRole,
    onboardingPersona: "team_lead" as OnboardingPersona,
    description: "Platform admin with full access",
  },

  // Team lead user - creates and manages projects
  teamLead: {
    email: `e2e-teamlead-s${SHARD}@inbox.mailtrap.io`,
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_lead" as OnboardingPersona,
    description: "Team lead who creates and manages projects",
  },

  // Team member user - joins projects, standard access
  teamMember: {
    email: `e2e-member-s${SHARD}@inbox.mailtrap.io`,
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_member" as OnboardingPersona,
    description: "Team member with standard access",
  },

  // Viewer user - read-only project access
  viewer: {
    email: `e2e-viewer-s${SHARD}@inbox.mailtrap.io`,
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_member" as OnboardingPersona,
    description: "Viewer with read-only project access",
  },

  // Onboarding user - specifically for testing onboarding flow
  onboarding: {
    email: `e2e-onboarding-s${SHARD}@inbox.mailtrap.io`,
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_lead" as OnboardingPersona,
    description: "Dedicated user for onboarding tests",
  },
} as const;

// Default user for most tests - use teamLead
export const DEFAULT_TEST_USER = TEST_USERS.teamLead;

/**
 * Test organization configuration
 * All test users (teamLead, teamMember, viewer) share this single organization.
 */
export const TEST_ORG_NAME = "Nixelo E2E";
export const TEST_ORG_SLUG = "nixelo-e2e";

/**
 * Organization Settings Type
 * Matches the schema in convex/schema.ts
 */
export interface OrganizationSettings {
  defaultMaxHoursPerWeek: number;
  defaultMaxHoursPerDay: number;
  requiresTimeApproval: boolean;
  billingEnabled: boolean;
}

/**
 * Settings Profiles for E2E Testing
 *
 * Use these profiles to test different settings configurations.
 * Most tests should use 'default'. Only use specific profiles
 * when testing features affected by that setting.
 */
export const SETTINGS_PROFILES: Record<string, OrganizationSettings> = {
  // Default profile - used by most tests
  default: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: false,
    billingEnabled: true,
  },

  // Billing disabled - for testing billing feature gates
  billingDisabled: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: false,
    billingEnabled: false,
  },

  // Time approval required - for testing approval workflows
  timeApprovalRequired: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: true,
    billingEnabled: true,
  },

  // Strict time limits - for testing hour limit enforcement
  strictTimeLimits: {
    defaultMaxHoursPerWeek: 20,
    defaultMaxHoursPerDay: 4,
    requiresTimeApproval: true,
    billingEnabled: true,
  },
};

/**
 * Prefixes for dynamically created test users
 */
export const TEST_USER_PREFIXES = {
  auth: "e2e-auth",
  onboarding: "e2e-onboarding",
  temp: "e2e-temp",
};

/**
 * E2E API Endpoints
 */
export const E2E_ENDPOINTS = {
  // Get OTP for test email (GET ?email=...)
  getOTP: `${CONVEX_SITE_URL}/e2e/otp`,
  // Login test user via API (POST)
  loginTestUser: `${CONVEX_SITE_URL}/e2e/login-test-user`,
  // Get latest OTP for test email (GET ?email=...)
  getLatestOTP: `${CONVEX_SITE_URL}/e2e/get-latest-otp`,
  // Reset onboarding state (POST)
  resetOnboarding: `${CONVEX_SITE_URL}/e2e/reset-onboarding`,
  // Create test user via API (POST) - bypasses email verification
  createTestUser: `${CONVEX_SITE_URL}/e2e/create-test-user`,
  // Delete test user (POST)
  deleteTestUser: `${CONVEX_SITE_URL}/e2e/delete-test-user`,
  // Verify test user's email (POST) - bypasses email verification
  verifyTestUser: `${CONVEX_SITE_URL}/e2e/verify-test-user`,
  // Clean up old test users (POST)
  cleanup: `${CONVEX_SITE_URL}/e2e/cleanup`,
  // Set up RBAC test project with users in different roles (POST)
  setupRbacProject: `${CONVEX_SITE_URL}/e2e/setup-rbac-project`,
  // Clean up RBAC test project (POST)
  cleanupRbacProject: `${CONVEX_SITE_URL}/e2e/cleanup-rbac-project`,
  // Debug: Verify password against stored hash (POST)
  debugVerifyPassword: `${CONVEX_SITE_URL}/e2e/debug-verify-password`,
  // Update organization settings (POST) - for testing different settings profiles
  updateOrganizationSettings: `${CONVEX_SITE_URL}/e2e/update-organization-settings`,
  // Seed project templates (POST)
  seedTemplates: `${CONVEX_SITE_URL}/e2e/seed-templates`,
  // Force delete ALL test users (POST)
  nukeTestUsers: `${CONVEX_SITE_URL}/e2e/nuke-test-users`,
  // Seed screenshot data (workspace, team, project, issues, documents)
  seedScreenshotData: `${CONVEX_SITE_URL}/e2e/seed-screenshot-data`,
  // Google OAuth login via refresh token (bypasses browser OAuth flow)
  googleOAuthLogin: `${CONVEX_SITE_URL}/e2e/google-oauth-login`,
};

/**
 * RBAC Test Configuration
 */
export const RBAC_TEST_CONFIG = {
  projectKey: "RBAC",
  projectName: "RBAC Test Project",
  /**
   * Organization slug for URL paths.
   * The RBAC setup will use the existing organization created during login.
   */
  orgSlug: TEST_ORG_SLUG,
};

/**
 * Test Timeouts
 */
export const TIMEOUTS = {
  // How long to wait for OTP email to arrive (increased to reduce flakiness in CI)
  otpWait: 60000,
  // Poll interval for checking OTP
  otpPollInterval: 2000,
  // Page load timeout
  pageLoad: 30000,
  // Element visibility timeout
  elementVisible: 10000,
};

/**
 * Auth state file paths for each test user
 */
export const AUTH_PATHS = {
  admin: (workerIndex = 0) => `.auth/user-admin-${workerIndex}.json`,
  teamLead: (workerIndex = 0) => `.auth/user-teamlead-${workerIndex}.json`,
  teamMember: (workerIndex = 0) => `.auth/user-member-${workerIndex}.json`,
  viewer: (workerIndex = 0) => `.auth/user-viewer-${workerIndex}.json`,
  onboarding: (workerIndex = 0) => `.auth/user-onboarding-${workerIndex}.json`,
};

/**
 * Generate a unique test email address
 */
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@inbox.mailtrap.io`;
}

/**
 * Check if an email is a test email (for cleanup purposes)
 */
export function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}
