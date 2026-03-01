import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@/test/custom-render";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock custom hooks
vi.mock("@/hooks/useAsyncMutation", () => ({
  useAsyncMutation: vi.fn((fn: () => Promise<void>) => ({
    mutate: () => fn(),
    isLoading: false,
  })),
}));

vi.mock("@/hooks/useDeleteConfirmation", () => ({
  useDeleteConfirmation: vi.fn(() => ({
    deleteId: null,
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    executeDelete: vi.fn(),
    isDeleting: false,
  })),
}));

vi.mock("@/hooks/useEntityForm", () => ({
  useEntityForm: vi.fn(() => ({
    formData: { name: "", color: "#6366F1", groupId: null, description: "" },
    editingId: null,
    startCreate: vi.fn(),
    loadForEdit: vi.fn(),
    updateField: vi.fn(),
    resetForm: vi.fn(),
  })),
}));

vi.mock("@/hooks/useModal", () => ({
  useModal: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Import after mocks
import { useQuery } from "convex/react";
import { LabelsManager } from "./LabelsManager";

// Mock data factory
function createMockLabel(overrides: Partial<Doc<"labels">> = {}): Doc<"labels"> {
  return {
    _id: "label-1" as Id<"labels">,
    _creationTime: Date.now(),
    name: "Bug",
    color: "#EF4444",
    projectId: "proj-1" as Id<"projects">,
    displayOrder: 0,
    ...overrides,
  } as Doc<"labels">;
}

interface MockLabelGroup {
  _id: Id<"labelGroups"> | null;
  name: string;
  description?: string;
  displayOrder: number;
  labels: Doc<"labels">[];
}

function createMockLabelGroup(overrides: Partial<MockLabelGroup> = {}): MockLabelGroup {
  return {
    _id: "group-1" as Id<"labelGroups">,
    name: "Priority",
    description: "Priority labels",
    displayOrder: 0,
    labels: [],
    ...overrides,
  };
}

describe("LabelsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading spinner when data is loading", () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no labels exist", () => {
      vi.mocked(useQuery).mockReturnValue([]);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("No labels yet")).toBeInTheDocument();
      expect(screen.getByText("Create labels and organize them into groups")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create your first label/i })).toBeInTheDocument();
    });
  });

  describe("Label Groups Display", () => {
    it("should render label groups with labels", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          name: "Priority",
          labels: [
            createMockLabel({ name: "High", color: "#EF4444" }),
            createMockLabel({
              _id: "label-2" as Id<"labels">,
              name: "Low",
              color: "#22C55E",
            }),
          ],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("Priority")).toBeInTheDocument();
      expect(screen.getByText("(2)")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    it("should render ungrouped labels section", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          _id: null,
          name: "Ungrouped",
          labels: [createMockLabel({ name: "Standalone" })],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("Ungrouped")).toBeInTheDocument();
      expect(screen.getByText("Standalone")).toBeInTheDocument();
    });

    it("should display label colors", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          labels: [createMockLabel({ name: "Bug", color: "#EF4444" })],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("#EF4444")).toBeInTheDocument();
    });
  });

  describe("Group Collapse", () => {
    it("should collapse group when header is clicked", async () => {
      const user = userEvent.setup();
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          name: "Priority",
          labels: [createMockLabel({ name: "High" })],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      // Label should be visible initially
      expect(screen.getByText("High")).toBeInTheDocument();

      // Click group header to collapse
      const groupHeader = screen.getByRole("button", { name: /priority/i });
      await user.click(groupHeader);

      // Label should be hidden after collapse
      expect(screen.queryByText("High")).not.toBeInTheDocument();
    });

    it("should have correct aria-expanded attribute", async () => {
      const user = userEvent.setup();
      const mockGroups: MockLabelGroup[] = [createMockLabelGroup({ name: "Priority", labels: [] })];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      const groupHeader = screen.getByRole("button", { name: /priority/i });

      // Initially expanded
      expect(groupHeader).toHaveAttribute("aria-expanded", "true");

      // Click to collapse
      await user.click(groupHeader);
      expect(groupHeader).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Action Buttons", () => {
    it("should render New Group and New Label buttons in header", () => {
      vi.mocked(useQuery).mockReturnValue([]);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByRole("button", { name: /new group/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /new label/i })).toBeInTheDocument();
    });

    it("should render Add button for each group", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({ name: "Priority", labels: [] }),
        createMockLabelGroup({
          _id: "group-2" as Id<"labelGroups">,
          name: "Type",
          labels: [],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      const addButtons = screen.getAllByRole("button", { name: /^add$/i });
      expect(addButtons).toHaveLength(2);
    });

    it("should render Edit and Delete buttons for real groups", () => {
      const mockGroups: MockLabelGroup[] = [createMockLabelGroup({ name: "Priority", labels: [] })];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      // Within the Priority group header
      expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });

    it("should NOT render Edit and Delete buttons for ungrouped section", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({ _id: null, name: "Ungrouped", labels: [] }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      // Ungrouped section should only have Add button, not Edit/Delete
      const ungroupedSection = screen.getByText("Ungrouped").closest("[role='button']");
      expect(ungroupedSection).toBeInTheDocument();

      // Get buttons within the ungrouped header area
      const addButton = screen.getByRole("button", { name: /^add$/i });
      expect(addButton).toBeInTheDocument();

      // Edit and Delete for groups should not exist (only Add)
      const allGroupButtons = screen.getAllByRole("button");
      const editGroupButtons = allGroupButtons.filter((btn) => btn.textContent === "Edit");
      const deleteGroupButtons = allGroupButtons.filter((btn) => btn.textContent === "Delete");

      // Since ungrouped is the only group, there should be no Edit/Delete group buttons
      expect(editGroupButtons).toHaveLength(0);
      expect(deleteGroupButtons).toHaveLength(0);
    });

    it("should render Edit and Delete buttons for each label", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          labels: [createMockLabel({ name: "Bug" })],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      // Should have Edit and Delete buttons for group + label
      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      const deleteButtons = screen.getAllByRole("button", { name: /^delete$/i });

      // One for group + one for label = 2 each
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe("Empty Group State", () => {
    it("should show empty message for groups with no labels", () => {
      const mockGroups: MockLabelGroup[] = [createMockLabelGroup({ name: "Priority", labels: [] })];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText(/no labels in this group/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add one/i })).toBeInTheDocument();
    });
  });

  describe("Card Header", () => {
    it("should display card title and description", () => {
      vi.mocked(useQuery).mockReturnValue([]);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("Labels")).toBeInTheDocument();
      expect(
        screen.getByText("Organize issues with colored labels grouped by category"),
      ).toBeInTheDocument();
    });
  });

  describe("Multiple Groups", () => {
    it("should render multiple groups correctly", () => {
      const mockGroups: MockLabelGroup[] = [
        createMockLabelGroup({
          name: "Priority",
          description: "Priority levels",
          labels: [createMockLabel({ name: "High" })],
        }),
        createMockLabelGroup({
          _id: "group-2" as Id<"labelGroups">,
          name: "Type",
          description: "Issue types",
          displayOrder: 1,
          labels: [
            createMockLabel({ _id: "label-2" as Id<"labels">, name: "Bug" }),
            createMockLabel({ _id: "label-3" as Id<"labels">, name: "Feature" }),
          ],
        }),
        createMockLabelGroup({
          _id: null,
          name: "Ungrouped",
          displayOrder: 999,
          labels: [createMockLabel({ _id: "label-4" as Id<"labels">, name: "Misc" })],
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockGroups);

      render(<LabelsManager projectId={"proj-1" as Id<"projects">} />);

      // All groups visible
      expect(screen.getByText("Priority")).toBeInTheDocument();
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Ungrouped")).toBeInTheDocument();

      // All labels visible
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Bug")).toBeInTheDocument();
      expect(screen.getByText("Feature")).toBeInTheDocument();
      expect(screen.getByText("Misc")).toBeInTheDocument();

      // Group descriptions visible
      expect(screen.getByText(/priority levels/i)).toBeInTheDocument();
      expect(screen.getByText(/issue types/i)).toBeInTheDocument();
    });
  });
});
