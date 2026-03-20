import { createHash } from "node:crypto";

export interface KnownLoadingStateHash {
  hash: string;
  samplePaths: string[];
}

// Known loading/app-shell captures removed from the screenshot manifest when the
// manifest integrity validator landed. A matching SHA-256 means we captured the
// exact same broken image bytes again and should fail immediately.
export const KNOWN_LOADING_STATE_HASHES: KnownLoadingStateHash[] = [
  {
    hash: "0137790ee9774f35fa6c8dabca1d12006c8821835417108cd318673e66442f5b",
    samplePaths: [
      "docs/design/specs/modals/screenshots/dashboard-customize-mobile-light.png",
      "docs/design/specs/pages/04-dashboard/screenshots/mobile-light-customize-modal.png",
      "docs/design/specs/pages/04-dashboard/screenshots/mobile-light-mobile-hamburger.png",
      "docs/design/specs/pages/21-notifications/screenshots/mobile-light-popover.png",
      "docs/design/specs/pages/27-workspaces/screenshots/mobile-light-create-workspace-modal.png",
    ],
  },
  {
    hash: "17753fc0b2541165fdda9786d9b7c134e39a2eb59c040a7baee093770fa90d33",
    samplePaths: [
      "docs/design/specs/pages/22-time-tracking/screenshots/mobile-light-manual-entry-modal.png",
    ],
  },
  {
    hash: "2c24e497be609eef8186a32ae0de8ef48ced1d1009da68c547122115f9ab3749",
    samplePaths: [
      "docs/design/specs/pages/21-notifications/screenshots/desktop-dark-popover.png",
      "docs/design/specs/pages/22-time-tracking/screenshots/desktop-dark-manual-entry-modal.png",
    ],
  },
  {
    hash: "2d1f7277e8bb3910485f0b7c155d248e79ec1fd12cf09ce54cfe6a8ee5db4fa8",
    samplePaths: [
      "docs/design/specs/modals/screenshots/command-palette-tablet-light.png",
      "docs/design/specs/pages/21-notifications/screenshots/tablet-light-archived.png",
      "docs/design/specs/pages/22-time-tracking/screenshots/tablet-light-manual-entry-modal.png",
    ],
  },
  {
    hash: "38c07e6584e6213156925be0f8136e20be4f627e974c0ef5e7b8167e3f98b22c",
    samplePaths: ["docs/design/specs/pages/17-members/screenshots/mobile-light.png"],
  },
  {
    hash: "4cac3655ab637e444d1838a7321916e816cf8b0d19210aeebbe187879da886f4",
    samplePaths: ["docs/design/specs/modals/screenshots/create-issue-desktop-dark.png"],
  },
  {
    hash: "ea73d14b21142170ffd831fd653afd9a018a40c086bedf11b9fb0cc3d2d4c6e8",
    samplePaths: ["docs/design/specs/pages/21-notifications/screenshots/desktop-dark-archived.png"],
  },
  {
    hash: "f1003e634115c6b89e49c4f9ccf774a17888724c0113fb6b28289365d7e3fde9",
    samplePaths: ["docs/design/specs/pages/21-notifications/screenshots/tablet-light-popover.png"],
  },
  {
    hash: "f694cf4977917544e43b15f668ddda3baa2d609d3acd2e057ba87ab5382b0f60",
    samplePaths: [
      "docs/design/specs/pages/21-notifications/screenshots/desktop-light-popover.png",
      "docs/design/specs/pages/27-workspaces/screenshots/desktop-light-create-workspace-modal.png",
    ],
  },
  {
    hash: "f83123f38e7d1d9c34a89194ca633ea02560f26d9e6e071233063c90a8335e1f",
    samplePaths: [
      "docs/design/specs/pages/21-notifications/screenshots/desktop-light-filter-active.png",
      "docs/design/specs/pages/22-time-tracking/screenshots/desktop-light-manual-entry-modal.png",
    ],
  },
];

const LOADING_STATE_HASH_LOOKUP = new Map(
  KNOWN_LOADING_STATE_HASHES.map((entry) => [entry.hash, entry] as const),
);

export function getScreenshotHash(screenshot: Buffer): string {
  return createHash("sha256").update(screenshot).digest("hex");
}

export function getKnownLoadingStateHash(hash: string): KnownLoadingStateHash | null {
  return LOADING_STATE_HASH_LOOKUP.get(hash) ?? null;
}

export function assertScreenshotHashIsNotLoadingState(hash: string, captureLabel: string): void {
  const match = getKnownLoadingStateHash(hash);
  if (!match) {
    return;
  }

  const sampleList = match.samplePaths.slice(0, 3).join(", ");
  throw new Error(
    `Captured known loading-state screenshot for ${captureLabel} (hash ${hash}). Matches previously removed spinner/app-shell baselines such as ${sampleList}.`,
  );
}
