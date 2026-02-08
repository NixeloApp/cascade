import type { FullConfig } from "@playwright/test";
import { testUserService } from "./utils/test-user-service";

/**
 * Global teardown - runs once after all tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log("\n🧹 Running global teardown...");

  // Clean up test data to prevent accumulation across runs
  try {
    const result = await testUserService.nukeTestUsers();
    if (result.success) {
      console.log(`✓ Cleaned up ${result.deleted} test users/workspaces`);
    } else {
      console.warn("⚠️ Cleanup returned unsuccessful");
    }
  } catch (error) {
    // Don't fail teardown on cleanup errors - just log them
    console.warn("⚠️ Cleanup error (non-fatal):", error);
  }

  console.log("✅ Global teardown complete\n");
}

export default globalTeardown;
