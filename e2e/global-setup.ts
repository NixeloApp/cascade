/**
 * Global Setup - Runs once before all tests
 *
 * Creates auth state for fixed test users:
 * - teamLead: Team lead (admin in RBAC) - default user for most tests
 * - teamMember: Team member (editor in RBAC)
 * - viewer: Read-only user (viewer in RBAC)
 *
 * Uses API-first approach:
 * 1. Delete existing user via API
 * 2. Create user via API (with password hash)
 * 3. Browser sign-in to get auth tokens
 * 4. Save auth state to .auth/*.json
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, chromium, type FullConfig, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS, type TestUser } from "./config";
import { testUserService, trySignInUser } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, ".auth");

/**
 * Result from setting up a test user
 */
interface SetupResult {
  success: boolean;
  orgSlug?: string;
}

/**
 * Extract organization slug from URL (e.g., /e2e-dashboard-xxxxx/dashboard -> e2e-dashboard-xxxxx)
 */
function extractOrganizationSlug(url: string): string | undefined {
  const match = url.match(/\/([^/]+)\/(dashboard|settings|projects|documents|issues)/);
  return match?.[1];
}

/**
 * Set up auth state for a specific test user
 */
async function setupTestUser(
  context: BrowserContext,
  page: Page,
  baseURL: string,
  userKey: string,
  user: TestUser,
  authPath: string,
  completeOnboarding = true,
): Promise<SetupResult> {
  const authStatePath = path.join(AUTH_DIR, path.basename(authPath));

  // IMPORTANT: Always create fresh auth state because Convex uses refresh token rotation.
  // Once a refresh token is used, it becomes invalid. Reusing old auth state files
  // will fail because the tokens have been rotated by previous test runs.
  // Delete any existing auth file to force fresh sign-in.
  if (fs.existsSync(authStatePath)) {
    fs.unlinkSync(authStatePath);
    console.log(`  🗑️ ${userKey}: Deleted stale auth state`);
  }

  console.log(`  🔧 ${userKey}: Setting up auth for ${user.email}...`);

  // Clear context storage
  await context.clearCookies();

  // Always delete and recreate user to ensure deterministic organization slug
  // This ensures the slug is derived from email prefix without random suffix
  console.log(`  🗑️ ${userKey}: Deleting existing user to ensure fresh state...`);
  await testUserService.deleteTestUser(user.email);

  const createResult = await testUserService.createTestUser(
    user.email,
    user.password,
    completeOnboarding,
  );
  let success = false;

  if (createResult.success) {
    console.log(`  ✓ ${userKey}: User created via API (${createResult.userId})`);

    // Debug: Verify password is correctly stored
    const debugResult = await testUserService.debugVerifyPassword(user.email, user.password);
    if (!debugResult.passwordMatches) {
      console.warn(`  ⚠️ ${userKey}: Password verification failed:`, JSON.stringify(debugResult));
    } else {
      console.log(`  ✓ ${userKey}: Password verified successfully`);
    }

    success = await trySignInUser(page, baseURL, user, completeOnboarding);
    if (!success) {
      console.warn(`  ⚠️ ${userKey}: Sign-in failed after API user creation`);
    }
  } else {
    console.warn(`  ⚠️ ${userKey}: API user creation failed: ${createResult.error}`);
  }

  if (success) {
    await context.storageState({ path: authStatePath });
    const orgSlug = extractOrganizationSlug(page.url());
    console.log(`  ✓ ${userKey}: Auth state saved`);
    return { success: true, orgSlug };
  } else {
    console.warn(`  ⚠️ ${userKey}: Failed to create auth state`);
    await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${userKey}.png`) });
    return { success: false };
  }
}

/**
 * Wait for the React app to be fully loaded
 */
async function waitForAppReady(page: Page, baseURL: string): Promise<boolean> {
  try {
    console.log("⏳ Waiting for React app to be ready...");

    // Navigate with generous timeout
    await page.goto(baseURL, { waitUntil: "load", timeout: 120000 });

    // Wait for EITHER sign-in page OR dashboard (whichever loads first)
    // This is more reliable than checking for empty root
    await page.waitForSelector('h1, h2, [role="heading"], button[type="submit"]', {
      state: "visible",
      timeout: 60000,
    });

    console.log("✓ React app is ready");
    return true;
  } catch (error) {
    console.error("❌ React app failed to load:", error);
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: path.join(AUTH_DIR, "app-load-failed.png"), fullPage: true });
      const html = await page.content();
      fs.writeFileSync(path.join(AUTH_DIR, "app-load-failed.html"), html);
      console.log("  📸 Debug files saved to .auth/");
    } catch {}
    return false;
  }
}

/**
 * Global setup entry point
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5555";

  // Determine number of workers to setup for
  // Default to 4 if not specified (matching common CI configs)
  const workerCount = config.workers || 4;
  console.log(`\n🏗️  Setting up isolated environments for ${workerCount} workers...\n`);

  // Ensure .auth directory exists and is clean
  if (fs.existsSync(AUTH_DIR)) {
    console.log("🧹 Cleaning stale .auth directory...");
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();

  // Wait for React app to be ready before starting user setup
  const testPage = await browser.newPage();
  const appReady = await waitForAppReady(testPage, baseURL);
  await testPage.close();

  if (!appReady) {
    await browser.close();
    throw new Error("React app failed to load. Cannot proceed with global setup.");
  }

  // Iterate for each worker
  for (let i = 0; i < workerCount; i++) {
    console.log(`\n--- 👷 Worker ${i} Setup ---`);

    // 1. Generate unique emails for this worker using shard-isolated base
    const workerSuffix = `w${i}`;

    // Note: TEST_USERS already includes -s${SHARD} in the base email from config.ts
    // We just need to inject the worker suffix before the @ domain
    const users = {
      teamLead: {
        ...TEST_USERS.teamLead,
        email: TEST_USERS.teamLead.email.replace("@", `-${workerSuffix}@`),
      },
      teamMember: {
        ...TEST_USERS.teamMember,
        email: TEST_USERS.teamMember.email.replace("@", `-${workerSuffix}@`),
      },
      viewer: {
        ...TEST_USERS.viewer,
        email: TEST_USERS.viewer.email.replace("@", `-${workerSuffix}@`),
      },
      onboarding: {
        ...TEST_USERS.onboarding,
        email: TEST_USERS.onboarding.email.replace("@", `-${workerSuffix}@`),
      },
    };

    // 2. Setup Auth for each user
    const usersToSetup = [
      { key: "teamLead", user: users.teamLead, authPath: AUTH_PATHS.teamLead(i) },
      { key: "teamMember", user: users.teamMember, authPath: AUTH_PATHS.teamMember(i) },
      { key: "viewer", user: users.viewer, authPath: AUTH_PATHS.viewer(i) },
      { key: "onboarding", user: users.onboarding, authPath: AUTH_PATHS.onboarding(i) },
    ];

    const userConfigs: Record<string, { orgSlug?: string }> = {};

    for (const { key, user, authPath } of usersToSetup) {
      const context = await browser.newContext();
      await context.addInitScript(() => {
        try {
          Object.defineProperty(navigator, "onLine", { get: () => true });
        } catch {}
      });
      const page = await context.newPage();

      try {
        // onboarding user should NOT have onboarding completed automatically
        const completeOnboarding = key !== "onboarding";
        const result = await setupTestUser(
          context,
          page,
          baseURL,
          `${key}-${i}`,
          user,
          authPath,
          completeOnboarding,
        );
        if (result.success) {
          userConfigs[key] = { orgSlug: result.orgSlug };
        }
      } catch (error) {
        console.error(`  ❌ Worker ${i} ${key}: Setup error:`, error);
      } finally {
        await context.close();
      }
    }

    // 3. Setup Isolated RBAC Project
    console.log(`  🔐 Worker ${i}: Setting up RBAC project...`);
    const rbacResult = await testUserService.setupRbacProject({
      projectKey: `${RBAC_TEST_CONFIG.projectKey}-W${i}`,
      projectName: `${RBAC_TEST_CONFIG.projectName} (Worker ${i})`,
      adminEmail: users.teamLead.email,
      editorEmail: users.teamMember.email,
      viewerEmail: users.viewer.email,
    });

    if (rbacResult.success) {
      console.log(`  ✓ Worker ${i}: RBAC project created: ${rbacResult.projectKey}`);
      // Save worker-specific config
      const rbacConfig = {
        projectKey: rbacResult.projectKey,
        orgSlug: rbacResult.orgSlug,
        projectId: rbacResult.projectId,
        organizationId: rbacResult.organizationId,
      };
      fs.writeFileSync(
        path.join(AUTH_DIR, `rbac-config-${i}.json`),
        JSON.stringify(rbacConfig, null, 2),
      );
    } else {
      console.warn(`  ⚠️ Worker ${i}: RBAC setup failed: ${rbacResult.error}`);
    }

    // 4. Save Dashboard Config for this worker
    if (userConfigs.teamLead?.orgSlug) {
      const dashboardConfig = {
        orgSlug: userConfigs.teamLead.orgSlug,
        email: users.teamLead.email,
      };
      fs.writeFileSync(
        path.join(AUTH_DIR, `dashboard-config-${i}.json`),
        JSON.stringify(dashboardConfig, null, 2),
      );
    }
  }

  await browser.close();
  console.log("\n✅ Global setup complete\n");
}

export default globalSetup;
