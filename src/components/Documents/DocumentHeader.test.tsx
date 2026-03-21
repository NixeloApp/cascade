import type { Doc } from "@convex/_generated/dataModel";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { DocumentHeader } from "./DocumentHeader";

// Mock PresenceIndicator
vi.mock("@/components/PresenceIndicator", () => ({
  PresenceIndicator: () => <div data-testid="presence-indicator" />,
}));

const mockDocument = {
  _id: "doc123",
  _creationTime: Date.now(),
  title: "Test Document",
  content: "Test content",
  isPublic: false,
  organizationId: "org123",
  createdBy: "user123",
  updatedAt: Date.now(),
  creatorName: "Test User",
  isOwner: true,
} as unknown as Doc<"documents"> & { creatorName: string; isOwner: boolean };

describe("DocumentHeader", () => {
  it("renders without crashing", () => {
    render(
      <TooltipProvider>
        <DocumentHeader
          document={mockDocument}
          userId="user123"
          versionCount={5}
          isFavorite={false}
          isArchived={false}
          onTitleEdit={vi.fn()}
          onTogglePublic={vi.fn()}
          onToggleFavorite={vi.fn()}
          onToggleArchive={vi.fn()}
          onImportMarkdown={vi.fn()}
          onExportMarkdown={vi.fn()}
          onShowVersionHistory={vi.fn()}
          editorReady={true}
        />
      </TooltipProvider>,
    );
    expect(screen.getByText("Test Document")).toBeInTheDocument();
  });

  it("keeps primary buttons visible and low-frequency owner actions in the manage menu", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <DocumentHeader
          document={mockDocument}
          userId="user123"
          versionCount={5}
          isFavorite={false}
          isArchived={false}
          onTitleEdit={vi.fn()}
          onTogglePublic={vi.fn()}
          onToggleFavorite={vi.fn()}
          onToggleArchive={vi.fn()}
          onToggleLock={vi.fn()}
          onMoveToProject={vi.fn()}
          onImportMarkdown={vi.fn()}
          onExportMarkdown={vi.fn()}
          onShowVersionHistory={vi.fn()}
          editorReady={true}
        />
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Version history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import from Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export as Markdown" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More document actions" }));

    expect(await screen.findByRole("menuitem", { name: "Lock document" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Move to another project" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Archive document" })).toBeInTheDocument();
  });

  it("surfaces explicit editor sync state in the header chrome", () => {
    render(
      <TooltipProvider>
        <DocumentHeader
          document={mockDocument}
          userId="user123"
          versionCount={5}
          isFavorite={false}
          isArchived={false}
          onTitleEdit={vi.fn()}
          onTogglePublic={vi.fn()}
          onToggleFavorite={vi.fn()}
          onToggleArchive={vi.fn()}
          onImportMarkdown={vi.fn()}
          onExportMarkdown={vi.fn()}
          onShowVersionHistory={vi.fn()}
          editorReady={false}
          syncState="saving"
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });
});
