import { describe, expect, it } from "vitest";

describe("WikiDocumentGrid", () => {
  it("exports the grid component and types", async () => {
    const mod = await import("./WikiDocumentGrid");
    expect(typeof mod.WikiDocumentGrid).toBe("function");
  });

  it("WikiDocumentGridProps accepts documents array and orgSlug", async () => {
    const mod = await import("./WikiDocumentGrid");
    // Type-level check — if this compiles, the interface is correct
    const props: Parameters<typeof mod.WikiDocumentGrid>[0] = {
      documents: [
        {
          _id: "doc1",
          title: "Getting Started",
          isPublic: true,
          creatorName: "Alice",
          updatedAt: Date.now(),
        },
      ],
      orgSlug: "acme",
    };
    expect(props.documents).toHaveLength(1);
    expect(props.orgSlug).toBe("acme");
  });
});
