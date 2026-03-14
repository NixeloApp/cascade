import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { render, screen } from "@/test/custom-render";
import { IssueDetailViewer } from "./IssueDetailViewer";

vi.mock("@/contexts/IssueViewModeContext", () => ({
  useIssueViewMode: vi.fn(),
}));

vi.mock("./IssueDetailModal", () => ({
  IssueDetailModal: ({
    issueId,
    open,
    canEdit,
  }: {
    issueId: Id<"issues">;
    open: boolean;
    canEdit?: boolean;
  }) => (
    <div>{`modal:${issueId}:${open ? "open" : "closed"}:${canEdit ? "editable" : "read-only"}`}</div>
  ),
}));

vi.mock("./IssueDetailSheet", () => ({
  IssueDetailSheet: ({
    issueId,
    open,
    canEdit,
  }: {
    issueId: Id<"issues">;
    open: boolean;
    canEdit?: boolean;
  }) => (
    <div>{`sheet:${issueId}:${open ? "open" : "closed"}:${canEdit ? "editable" : "read-only"}`}</div>
  ),
}));

const mockUseIssueViewMode = vi.mocked(useIssueViewMode);

describe("IssueDetailViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sheet variant when the user prefers peek view", () => {
    mockUseIssueViewMode.mockReturnValue({
      viewMode: "peek",
      setViewMode: vi.fn(),
      toggleViewMode: vi.fn(),
    });

    render(
      <IssueDetailViewer
        issueId={"issue_1" as Id<"issues">}
        open={true}
        onOpenChange={vi.fn()}
        canEdit={false}
      />,
    );

    expect(screen.getByText("sheet:issue_1:open:read-only")).toBeInTheDocument();
    expect(screen.queryByText(/^modal:/)).not.toBeInTheDocument();
  });

  it("renders the modal variant for modal view mode and forwards the default editable state", () => {
    mockUseIssueViewMode.mockReturnValue({
      viewMode: "modal",
      setViewMode: vi.fn(),
      toggleViewMode: vi.fn(),
    });

    render(
      <IssueDetailViewer issueId={"issue_2" as Id<"issues">} open={false} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("modal:issue_2:closed:editable")).toBeInTheDocument();
    expect(screen.queryByText(/^sheet:/)).not.toBeInTheDocument();
  });
});
