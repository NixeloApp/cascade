import type { BrowserContext } from "@playwright/test";
import type { TestUser } from "../config";
import { testUserService } from "./test-user-service";

function logLoginRepair(
  email: string,
  repairAttempted?: boolean,
  repairedAccount?: boolean,
  contextLabel = "fixture bootstrap",
): void {
  if (!repairAttempted) {
    return;
  }

  console.log(
    repairedAccount
      ? `  ✓ ${email}: repaired stale seeded account state before ${contextLabel}`
      : `  ⚠️ ${email}: attempted seeded-account repair before ${contextLabel}, but login still failed`,
  );
}

export async function injectContextAuthTokens(
  context: BrowserContext,
  token: string,
  refreshToken?: string,
): Promise<void> {
  await context.addInitScript(
    ({ token: jwt, refreshToken: refresh, convexUrl }) => {
      // Helper to set or clear a token - always overwrite to avoid stale tokens
      const setToken = (key: string, value?: string) => {
        if (value) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      };

      setToken("convexAuthToken", jwt);
      setToken("convexAuthRefreshToken", refresh);

      if (convexUrl) {
        const namespace = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
        const jwtKey = `__convexAuthJWT_${namespace}`;
        const refreshKey = `__convexAuthRefreshToken_${namespace}`;
        setToken(jwtKey, jwt);
        setToken(refreshKey, refresh);
      }
    },
    {
      token,
      refreshToken,
      convexUrl: process.env.VITE_CONVEX_URL,
    },
  );
}

export async function loginFixtureUserWithRepair(
  context: BrowserContext,
  user: TestUser,
  contextLabel = "fixture bootstrap",
  /** Skip onboarding when repairing stale accounts (fixture users expect org membership) */
  skipOnboarding = true,
): Promise<void> {
  const loginResult = await testUserService.loginTestUserWithRepair(
    user.email,
    user.password,
    skipOnboarding,
  );
  logLoginRepair(
    user.email,
    loginResult.repairAttempted,
    loginResult.repairedAccount,
    contextLabel,
  );
  if (!(loginResult.success && loginResult.token)) {
    throw new Error(`Failed to authenticate as ${user.email}: ${loginResult.error}`);
  }

  await injectContextAuthTokens(context, loginResult.token, loginResult.refreshToken);
}
