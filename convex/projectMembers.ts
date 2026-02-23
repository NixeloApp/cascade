import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { MAX_TEAM_MEMBERS } from "./lib/queryLimits";
import { assertCanAccessProject } from "./projectAccess";

// List all members of a project with user details
export const list = authenticatedQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Check if user has access to project
    await assertCanAccessProject(ctx, args.projectId, ctx.userId);

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId).lt("isDeleted", true))
      .take(MAX_TEAM_MEMBERS);

    // Batch fetch all users (avoid N+1)
    const userIds = members.map((m) => m.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched user data, filter out deleted users
    return pruneNull(
      members.map((member) => {
        const user = userMap.get(member.userId);
        if (!user) return null; // User was deleted

        return {
          ...member,
          userName: user.name ?? user.email ?? "Unknown User",
          userEmail: user.email,
          userImage: user.image,
        };
      }),
    );
  },
});
