/**
 * Public Pages & Empty States Screenshot Passes
 *
 * Captures screenshots of unauthenticated pages (landing, auth, invite, portal)
 * and empty states (dashboard, projects, etc. before seeding data).
 */

import type { Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import type { SeedScreenshotResult } from "../utils/test-user-service";
import { getCurrentConfigUnsubscribeToken, shouldCaptureAny, takeScreenshot } from "./capture";
import { SCREENSHOT_PAGE_IDS } from "./targets";

export type PublicScreenshotCaptureGroup = "all" | "seeded" | "seedless";

type PublicScreenshotSeed = Pick<
  SeedScreenshotResult,
  "inviteToken" | "portalProjectId" | "portalToken" | "unsubscribeTokens"
>;

const SEEDED_PUBLIC_CAPTURE_NAME_SET = new Set([
  "invite",
  "unsubscribe",
  "portal",
  "portal-project",
]);

export function getPublicCaptureNames(group: PublicScreenshotCaptureGroup = "all"): string[] {
  const publicNames = SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
    const [prefix, ...rest] = pageId.split("-");
    if (prefix !== "public" || rest.length === 0) {
      return [];
    }

    return [rest.join("-")];
  });

  switch (group) {
    case "seeded":
      return publicNames.filter((name) => SEEDED_PUBLIC_CAPTURE_NAME_SET.has(name));
    case "seedless":
      return publicNames.filter((name) => !SEEDED_PUBLIC_CAPTURE_NAME_SET.has(name));
    default:
      return publicNames;
  }
}

export async function screenshotPublicPages(
  page: Page,
  seed?: PublicScreenshotSeed,
  options: { group?: PublicScreenshotCaptureGroup } = {},
): Promise<void> {
  const group = options.group ?? "all";
  const publicNames = getPublicCaptureNames(group);
  if (!shouldCaptureAny("public", publicNames)) {
    return;
  }

  console.log("    --- Public pages ---");
  if (group !== "seeded") {
    await takeScreenshot(page, "public", "landing", ROUTES.home.build());
    await takeScreenshot(page, "public", "signin", ROUTES.signin.build());
    await takeScreenshot(page, "public", "signup", ROUTES.signup.build());
    await takeScreenshot(
      page,
      "public",
      "signup-verify",
      `${ROUTES.signup.build()}?step=verify&email=screenshots%40inbox.mailtrap.io`,
    );
    await takeScreenshot(page, "public", "forgot-password", ROUTES.forgotPassword.build());
    await takeScreenshot(
      page,
      "public",
      "forgot-password-reset",
      `${ROUTES.forgotPassword.build()}?step=reset&email=screenshots%40inbox.mailtrap.io`,
    );
    await takeScreenshot(
      page,
      "public",
      "verify-email",
      ROUTES.verifyEmail.build("screenshots@inbox.mailtrap.io"),
    );
    await takeScreenshot(page, "public", "verify-2fa", ROUTES.verify2FA.build());
    await takeScreenshot(page, "public", "invite-invalid", "/invite/screenshot-test-token");
    await takeScreenshot(
      page,
      "public",
      "invite-expired",
      `${ROUTES.invite.build("screenshot-test-token")}?previewState=expired`,
    );
    await takeScreenshot(
      page,
      "public",
      "invite-revoked",
      `${ROUTES.invite.build("screenshot-test-token")}?previewState=revoked`,
    );
    await takeScreenshot(
      page,
      "public",
      "invite-accepted",
      `${ROUTES.invite.build("screenshot-test-token")}?previewState=accepted`,
    );
  }

  if (group !== "seedless" && seed?.inviteToken) {
    await takeScreenshot(page, "public", "invite", ROUTES.invite.build(seed.inviteToken));
  }

  if (group !== "seedless") {
    const unsubscribeToken = seed ? getCurrentConfigUnsubscribeToken(seed) : undefined;
    if (unsubscribeToken) {
      await takeScreenshot(
        page,
        "public",
        "unsubscribe",
        ROUTES.unsubscribe.build(unsubscribeToken),
      );
    }

    if (seed?.portalToken) {
      await takeScreenshot(page, "public", "portal", ROUTES.portal.entry.build(seed.portalToken));
      if (seed.portalProjectId) {
        await takeScreenshot(
          page,
          "public",
          "portal-project",
          ROUTES.portal.project.build(seed.portalToken, seed.portalProjectId),
        );
      }
    }
  }
}

export async function screenshotEmptyStates(page: Page, orgSlug: string): Promise<void> {
  const emptyNames = [
    "dashboard",
    "projects",
    "issues",
    "documents",
    "documents-templates",
    "workspaces",
    "time-tracking",
    "notifications",
    "invoices",
    "clients",
    "meetings",
    "outreach",
    "settings",
    "settings-profile",
  ];
  if (!shouldCaptureAny("empty", emptyNames)) {
    return;
  }

  console.log("    --- Empty states ---");
  const p = "empty";
  await takeScreenshot(page, p, "dashboard", ROUTES.dashboard.build(orgSlug));
  await takeScreenshot(page, p, "projects", ROUTES.projects.list.build(orgSlug));
  await takeScreenshot(page, p, "issues", ROUTES.issues.list.build(orgSlug));
  await takeScreenshot(page, p, "documents", ROUTES.documents.list.build(orgSlug));
  await takeScreenshot(page, p, "documents-templates", ROUTES.documents.templates.build(orgSlug));
  await takeScreenshot(page, p, "workspaces", ROUTES.workspaces.list.build(orgSlug));
  await takeScreenshot(page, p, "time-tracking", ROUTES.timeTracking.build(orgSlug));
  await takeScreenshot(page, p, "notifications", ROUTES.notifications.build(orgSlug));
  await takeScreenshot(page, p, "invoices", ROUTES.invoices.list.build(orgSlug));
  await takeScreenshot(page, p, "clients", ROUTES.clients.list.build(orgSlug));
  await takeScreenshot(page, p, "meetings", ROUTES.meetings.build(orgSlug));
  await takeScreenshot(page, p, "outreach", ROUTES.outreach.build(orgSlug));
  await takeScreenshot(page, p, "settings", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(page, p, "settings-profile", ROUTES.settings.profile.build(orgSlug));
}
