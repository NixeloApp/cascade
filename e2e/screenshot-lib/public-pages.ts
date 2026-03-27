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
export type EmptyScreenshotCaptureGroup = "all" | "bootstrap" | "separate-auth";
type EmptyScreenshotTargetGroup = Exclude<EmptyScreenshotCaptureGroup, "all">;
export interface SelectedEmptyScreenshotCaptureGroup {
  group: EmptyScreenshotTargetGroup;
  names: string[];
}

type PublicScreenshotSeed = Pick<
  SeedScreenshotResult,
  "inviteToken" | "portalProjectId" | "portalToken" | "unsubscribeTokens"
>;

type PublicScreenshotTargetDefinition = {
  group: PublicScreenshotCaptureTargetGroup;
  name: string;
  resolvePath: (seed?: PublicScreenshotSeed) => string | null;
};

type EmptyScreenshotTargetDefinition = {
  group: EmptyScreenshotTargetGroup;
  name: string;
  resolvePath: (orgSlug: string) => string;
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

const EMPTY_SCREENSHOT_TARGETS = [
  {
    group: "bootstrap",
    name: "dashboard",
    resolvePath: (orgSlug) => ROUTES.dashboard.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "projects",
    resolvePath: (orgSlug) => ROUTES.projects.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "issues",
    resolvePath: (orgSlug) => ROUTES.issues.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "documents",
    resolvePath: (orgSlug) => ROUTES.documents.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "documents-templates",
    resolvePath: (orgSlug) => ROUTES.documents.templates.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "workspaces",
    resolvePath: (orgSlug) => ROUTES.workspaces.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "time-tracking",
    resolvePath: (orgSlug) => ROUTES.timeTracking.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "notifications",
    resolvePath: (orgSlug) => ROUTES.notifications.build(orgSlug),
  },
  {
    group: "separate-auth",
    name: "my-issues",
    resolvePath: (orgSlug) => ROUTES.myIssues.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "invoices",
    resolvePath: (orgSlug) => ROUTES.invoices.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "clients",
    resolvePath: (orgSlug) => ROUTES.clients.list.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "meetings",
    resolvePath: (orgSlug) => ROUTES.meetings.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "outreach",
    resolvePath: (orgSlug) => ROUTES.outreach.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "settings",
    resolvePath: (orgSlug) => ROUTES.settings.profile.build(orgSlug),
  },
  {
    group: "bootstrap",
    name: "settings-profile",
    resolvePath: (orgSlug) => ROUTES.settings.profile.build(orgSlug),
  },
] satisfies EmptyScreenshotTargetDefinition[];

const EMPTY_SCREENSHOT_TARGET_GROUPS = ["bootstrap", "separate-auth"] as const;

export function getCanonicalPublicCaptureNames(): string[] {
  return getCanonicalCaptureNamesForPrefix("public");
}

export function getCanonicalEmptyCaptureNames(): string[] {
  return getCanonicalCaptureNamesForPrefix("empty");
}

export function getCanonicalCaptureNamesForPrefix(prefix: "empty" | "public"): string[] {
  return SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
    const [pagePrefix, ...rest] = pageId.split("-");
    if (pagePrefix !== prefix || rest.length === 0) {
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

export function validateEmptyScreenshotTargets(): void {
  const canonicalEmptyNames = getCanonicalEmptyCaptureNames();
  const definedEmptyNames = EMPTY_SCREENSHOT_TARGETS.map((target) => target.name);
  const missingNames = canonicalEmptyNames.filter((name) => !definedEmptyNames.includes(name));
  const unexpectedNames = definedEmptyNames.filter((name) => !canonicalEmptyNames.includes(name));
  const duplicateNames = definedEmptyNames.filter(
    (name, index) => definedEmptyNames.indexOf(name) !== index,
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
    `Empty screenshot target manifest drifted from SCREENSHOT_PAGE_IDS (${errorParts.join("; ")})`,
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

export function getEmptyScreenshotTargets(
  group: EmptyScreenshotCaptureGroup = "all",
): EmptyScreenshotTargetDefinition[] {
  validateEmptyScreenshotTargets();
  if (group === "all") {
    return EMPTY_SCREENSHOT_TARGETS;
  }

  return EMPTY_SCREENSHOT_TARGETS.filter((target) => target.group === group);
}

export function getEmptyCaptureNames(group: EmptyScreenshotCaptureGroup = "all"): string[] {
  return getEmptyScreenshotTargets(group).map((target) => target.name);
}

export function getSelectedEmptyCaptureGroups(): SelectedEmptyScreenshotCaptureGroup[] {
  validateEmptyScreenshotTargets();

  return getSelectedEmptyCaptureGroupsForNames(
    getCanonicalEmptyCaptureNames().filter((name) => shouldCaptureAny("empty", [name])),
  );
}

export function getSelectedEmptyCaptureGroupsForNames(
  selectedNames: string[],
): SelectedEmptyScreenshotCaptureGroup[] {
  validateEmptyScreenshotTargets();
  const selectedNameSet = new Set(selectedNames);

  return EMPTY_SCREENSHOT_TARGET_GROUPS.flatMap((group) => {
    const names = getEmptyCaptureNames(group).filter((name) => selectedNameSet.has(name));
    if (names.length === 0) {
      return [];
    }

    return [{ group, names }];
  });
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

export async function screenshotEmptyStates(
  page: Page,
  orgSlug: string,
  options: { group?: EmptyScreenshotCaptureGroup } = {},
): Promise<void> {
  const emptyTargets = getEmptyScreenshotTargets(options.group ?? "bootstrap");
  const emptyNames = emptyTargets.map((target) => target.name);
  if (!shouldCaptureAny("empty", emptyNames)) {
    return;
  }

  console.log("    --- Empty states ---");
  for (const target of emptyTargets) {
    await takeScreenshot(page, "empty", target.name, target.resolvePath(orgSlug));
  }
}
