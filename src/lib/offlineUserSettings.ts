import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const USER_SETTINGS_OFFLINE_MUTATION_TYPE = "userSettings.update";

export type UserSettingsUpdateArgs = FunctionArgs<typeof api.userSettings.update>;

const VALID_KEYS: ReadonlySet<string> = new Set<keyof UserSettingsUpdateArgs>([
  "dashboardLayout",
  "theme",
  "sidebarCollapsed",
  "emailNotifications",
  "desktopNotifications",
  "timezone",
]);

function isUserSettingsUpdateArgs(value: unknown): value is UserSettingsUpdateArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value).every((key) => VALID_KEYS.has(key));
}

function validateUserSettingsArgs(args: Record<string, unknown>): UserSettingsUpdateArgs {
  if (!isUserSettingsUpdateArgs(args)) {
    const invalidKeys = Object.keys(args).filter((key) => !VALID_KEYS.has(key));
    throw new Error(
      `Invalid userSettings.update args: unexpected keys [${invalidKeys.join(", ")}]. ` +
        `Allowed keys: ${[...VALID_KEYS].join(", ")}`,
    );
  }
  return args;
}

/** Queues a user-settings mutation to IndexedDB for offline replay. */
export async function queueUserSettingsUpdate(
  args: UserSettingsUpdateArgs,
  userId?: string,
): Promise<number> {
  return queueOfflineMutation(USER_SETTINGS_OFFLINE_MUTATION_TYPE, args, userId);
}

/** Replays a queued user-settings mutation through the live Convex client. */
export async function replayUserSettingsUpdate(
  client: ConvexReactClient,
  args: Record<string, unknown>,
): Promise<void> {
  const validated = validateUserSettingsArgs(args);
  await client.mutation(api.userSettings.update, validated);
}
