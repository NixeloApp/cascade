import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { VersionHistory } from "./VersionHistory";

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

describe("VersionHistory", () => {
  const documentId = "doc-1" as Id<"documents">;
  const versions = [
    {
      _id: "v3" as Id<"documentVersions">,
      version: 3,
      title: "Current Title",
      _creationTime: Date.now(),
      createdByName: "Alice",
    },
    {
      _id: "v2" as Id<"documentVersions">,
      version: 2,
      title: "Previous Title",
      _creationTime: Date.now() - 60_000,
      createdByName: "Alice",
    },
    {
      _id: "v1" as Id<"documentVersions">,
      version: 1,
      title: "Initial Title",
      _creationTime: Date.now() - 120_000,
      createdByName: "Alice",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue(vi.fn());
    (useQuery as any).mockImplementation((_query: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      if (typeof args === "object" && args && "versionId" in (args as Record<string, unknown>)) {
        const { versionId } = args as { versionId: string };
        if (versionId === "v2") {
          return {
            version: 2,
            title: "Previous Title",
            snapshot: { type: "doc", content: [{ text: "old text" }] },
            createdByName: "Alice",
          };
        }
        if (versionId === "v1") {
          return {
            version: 1,
            title: "Initial Title",
            snapshot: { type: "doc", content: [{ text: "new text" }] },
            createdByName: "Alice",
          };
        }
      }
      return versions;
    });
  });

  it("orders compared snapshots by version number instead of click order", async () => {
    const user = userEvent.setup();
    render(<VersionHistory documentId={documentId} open onOpenChange={vi.fn()} />);

    const compareButtons = await screen.findAllByRole("button", { name: "Compare" });
    expect(compareButtons).toHaveLength(2);

    await user.click(compareButtons[1]);
    await user.click(compareButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Diff View")).toBeInTheDocument();
    });

    // Verify older pane (v1) contains its correct content
    const olderHeading = screen.getByText(/Older: v1 Initial Title/i);
    const olderPane = olderHeading.closest("div")?.parentElement as HTMLElement;
    expect(within(olderPane).getByText(/new text/i)).toBeInTheDocument();

    // Verify newer pane (v2) contains its correct content
    const newerHeading = screen.getByText(/Newer: v2 Previous Title/i);
    const newerPane = newerHeading.closest("div")?.parentElement as HTMLElement;
    expect(within(newerPane).getByText(/old text/i)).toBeInTheDocument();
  });
});
