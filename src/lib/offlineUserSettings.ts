import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const USER_SETTINGS_OFFLINE_MUTATION_TYPE = "userSettings.update";

export type UserSettingsUpdateArgs = FunctionArgs<typeof api.userSettings.update>;

export async function queueUserSettingsUpdate(args: UserSettingsUpdateArgs): Promise<number> {
  return queueOfflineMutation(USER_SETTINGS_OFFLINE_MUTATION_TYPE, args);
}

export async function replayUserSettingsUpdate(
  client: ConvexReactClient,
  args: UserSettingsUpdateArgs,
): Promise<void> {
  await client.mutation(api.userSettings.update, args);
}
