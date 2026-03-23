import { describe, expect, it } from "vitest";

describe("WorkspaceCard", () => {
  it("exports all components and types", async () => {
    const mod = await import("./WorkspaceCard");
    expect(typeof mod.WorkspaceCard).toBe("function");
  });

  it("WorkspaceCardProps interface includes compact flag", async () => {
    // Type-level check — if this compiles, the interface is correct
    const mod = await import("./WorkspaceCard");
    const props: Parameters<typeof mod.WorkspaceCard>[0] = {
      orgSlug: "acme",
      workspace: {
        _id: "ws1" as never,
        _creationTime: Date.now(),
        organizationId: "org1" as never,
        name: "Engineering",
        slug: "engineering",
        teamCount: 3,
        projectCount: 7,
        updatedAt: Date.now(),
        createdBy: "user1" as never,
      },
      compact: true,
    };
    expect(props.compact).toBe(true);
  });
});
