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
type PublicScreenshotCaptureTargetGroup = Exclude<PublicScreenshotCaptureGroup, "all">;

type PublicScreenshotSeed = Pick<
  SeedScreenshotResult,
  "inviteToken" | "portalProjectId" | "portalToken" | "unsubscribeTokens"
>;

type PublicScreenshotTargetDefinition = {
  group: PublicScreenshotCaptureTargetGroup;
  name: string;
  resolvePath: (seed?: PublicScreenshotSeed) => string | null;
};

const PUBLIC_SCREENSHOT_TARGETS = [
  {
    group: "seedless",
    name: "landing",
    resolvePath: () => ROUTES.home.build(),
  },
  {
    group: "seedless",
    name: "signin",
    resolvePath: () => ROUTES.signin.build(),
  },
  {
    group: "seedless",
    name: "signup",
    resolvePath: () => ROUTES.signup.build(),
  },
  {
    group: "seedless",
    name: "signup-verify",
    resolvePath: () => `${ROUTES.signup.build()}?step=verify&email=screenshots%40inbox.mailtrap.io`,
  },
  {
    group: "seedless",
    name: "forgot-password",
    resolvePath: () => ROUTES.forgotPassword.build(),
  },
  {
    group: "seedless",
    name: "forgot-password-reset",
    resolvePath: () =>
      `${ROUTES.forgotPassword.build()}?step=reset&email=screenshots%40inbox.mailtrap.io`,
  },
  {
    group: "seedless",
    name: "verify-email",
    resolvePath: () => ROUTES.verifyEmail.build("screenshots@inbox.mailtrap.io"),
  },
  {
    group: "seedless",
    name: "verify-2fa",
    resolvePath: () => ROUTES.verify2FA.build(),
  },
  {
    group: "seeded",
    name: "invite",
    resolvePath: (seed) => (seed?.inviteToken ? ROUTES.invite.build(seed.inviteToken) : null),
  },
  {
    group: "seedless",
    name: "invite-invalid",
    resolvePath: () => "/invite/screenshot-test-token",
  },
  {
    group: "seedless",
    name: "invite-expired",
    resolvePath: () => `${ROUTES.invite.build("screenshot-test-token")}?previewState=expired`,
  },
  {
    group: "seedless",
    name: "invite-revoked",
    resolvePath: () => `${ROUTES.invite.build("screenshot-test-token")}?previewState=revoked`,
  },
  {
    group: "seedless",
    name: "invite-accepted",
    resolvePath: () => `${ROUTES.invite.build("screenshot-test-token")}?previewState=accepted`,
  },
  {
    group: "seeded",
    name: "unsubscribe",
    resolvePath: (seed) => {
      const unsubscribeToken = seed ? getCurrentConfigUnsubscribeToken(seed) : undefined;
      return unsubscribeToken ? ROUTES.unsubscribe.build(unsubscribeToken) : null;
    },
  },
  {
    group: "seeded",
    name: "portal",
    resolvePath: (seed) => (seed?.portalToken ? ROUTES.portal.entry.build(seed.portalToken) : null),
  },
  {
    group: "seeded",
    name: "portal-project",
    resolvePath: (seed) =>
      seed?.portalToken && seed.portalProjectId
        ? ROUTES.portal.project.build(seed.portalToken, seed.portalProjectId)
        : null,
  },
] satisfies PublicScreenshotTargetDefinition[];

export function getCanonicalPublicCaptureNames(): string[] {
  return SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
    const [prefix, ...rest] = pageId.split("-");
    if (prefix !== "public" || rest.length === 0) {
      return [];
    }

    return [rest.join("-")];
  });
}

export function validatePublicScreenshotTargets(): void {
  const canonicalPublicNames = getCanonicalPublicCaptureNames();
  const definedPublicNames = PUBLIC_SCREENSHOT_TARGETS.map((target) => target.name);
  const missingNames = canonicalPublicNames.filter((name) => !definedPublicNames.includes(name));
  const unexpectedNames = definedPublicNames.filter((name) => !canonicalPublicNames.includes(name));
  const duplicateNames = definedPublicNames.filter(
    (name, index) => definedPublicNames.indexOf(name) !== index,
  );

  if (missingNames.length === 0 && unexpectedNames.length === 0 && duplicateNames.length === 0) {
    return;
  }

  const errorParts: string[] = [];
  if (missingNames.length > 0) {
    errorParts.push(`missing: ${missingNames.join(", ")}`);
  }
  if (unexpectedNames.length > 0) {
    errorParts.push(`unexpected: ${unexpectedNames.join(", ")}`);
  }
  if (duplicateNames.length > 0) {
    errorParts.push(`duplicate: ${[...new Set(duplicateNames)].join(", ")}`);
  }

  throw new Error(
    `Public screenshot target manifest drifted from SCREENSHOT_PAGE_IDS (${errorParts.join("; ")})`,
  );
}

export function getPublicScreenshotTargets(
  group: PublicScreenshotCaptureGroup = "all",
): PublicScreenshotTargetDefinition[] {
  validatePublicScreenshotTargets();

  if (group === "all") {
    return PUBLIC_SCREENSHOT_TARGETS;
  }

  return PUBLIC_SCREENSHOT_TARGETS.filter((target) => target.group === group);
}

export function getPublicCaptureNames(group: PublicScreenshotCaptureGroup = "all"): string[] {
  return getPublicScreenshotTargets(group).map((target) => target.name);
}

export async function screenshotPublicPages(
  page: Page,
  seed?: PublicScreenshotSeed,
  options: { group?: PublicScreenshotCaptureGroup } = {},
): Promise<void> {
  const group = options.group ?? "all";
  const publicTargets = getPublicScreenshotTargets(group);
  const publicNames = publicTargets.map((target) => target.name);
  if (!shouldCaptureAny("public", publicNames)) {
    return;
  }

  console.log("    --- Public pages ---");
  for (const target of publicTargets) {
    const route = target.resolvePath(seed);
    if (!route) {
      continue;
    }

    await takeScreenshot(page, "public", target.name, route);
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
