import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { type BoardFilters, FilterBar } from "./FilterBar";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("FilterBar", () => {
  const mockProjectId = "proj1" as Id<"projects">;
  const emptyFilters: BoardFilters = {};
  const mockOnFilterChange = vi.fn();

  const mockSavedFilters = [
    {
      _id: "filter1" as Id<"savedFilters">,
      name: "High Priority Bugs",
      filters: { priority: ["high"], type: ["bug"] },
      isPublic: true,
      isOwner: true,
      creatorName: "John Doe",
    },
    {
      _id: "filter2" as Id<"savedFilters">,
      name: "My Tasks",
      filters: { type: ["task"] },
      isPublic: false,
      isOwner: true,
      creatorName: "John Doe",
    },
  ];

  const mockLabels = [
    { _id: "label1" as Id<"labels">, name: "frontend", color: "#3b82f6" },
    { _id: "label2" as Id<"labels">, name: "backend", color: "#22c55e" },
  ];

  const mockMembers = [
    { userId: "user1" as Id<"users">, userName: "Alice", userEmail: "alice@test.com" },
    { userId: "user2" as Id<"users">, userName: "Bob", userEmail: "bob@test.com" },
  ];

  const mockCreateFilter = vi.fn();
  const mockRemoveFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Track call counts
    let queryCallCount = 0;
    let mutationCallCount = 0;

    // Default mock returns - useQuery is called in order:
    // 1. savedFilters.list
    // 2. savedFilters.create (mutation, but we mock it separately)
    // 3. savedFilters.remove (mutation)
    // 4. labels.list
    // 5. projectMembers.list
    (useQuery as ReturnType<typeof vi.fn>).mockImplementation(() => {
      queryCallCount++;
      // Order: savedFilters, labels, members
      if (queryCallCount === 1) return mockSavedFilters;
      if (queryCallCount === 2) return mockLabels;
      if (queryCallCount === 3) return mockMembers;
      return [];
    });

    (useMutation as ReturnType<typeof vi.fn>).mockImplementation(() => {
      mutationCallCount++;
      return mutationCallCount % 2 === 1 ? mockCreateFilter : mockRemoveFilter;
    });
  });

  describe("Rendering", () => {
    it("should render filter dropdown buttons", () => {
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByRole("button", { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /priority/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /assignee/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /labels/i })).toBeInTheDocument();
    });

    it("should not show clear/save buttons when no filters active", () => {
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /save filter/i })).not.toBeInTheDocument();
    });

    it("should show clear/save buttons when filters are active", () => {
      const activeFilters: BoardFilters = { type: ["bug"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save filter/i })).toBeInTheDocument();
    });

    it("should show filter count in button when filters active", () => {
      const activeFilters: BoardFilters = { type: ["bug", "task"], priority: ["high"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByRole("button", { name: /type \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /priority \(1\)/i })).toBeInTheDocument();
    });
  });

  describe("Filter Selection", () => {
    it("should call onFilterChange when selecting a type filter", async () => {
      const user = userEvent.setup();
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      // Open type dropdown
      await user.click(screen.getByRole("button", { name: /^type$/i }));

      // Select bug type
      const bugOption = await screen.findByRole("menuitemcheckbox", { name: /bug/i });
      await user.click(bugOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith({ type: ["bug"] });
    });

    it("should remove filter when deselecting", async () => {
      const user = userEvent.setup();
      const activeFilters: BoardFilters = { type: ["bug"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      // Open type dropdown
      await user.click(screen.getByRole("button", { name: /type \(1\)/i }));

      // Deselect bug type
      const bugOption = await screen.findByRole("menuitemcheckbox", { name: /bug/i });
      await user.click(bugOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith({ type: undefined });
    });

    it("should clear all filters when clicking Clear button", async () => {
      const user = userEvent.setup();
      const activeFilters: BoardFilters = { type: ["bug"], priority: ["high"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /clear/i }));

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });
  });

  describe("Save Filter Dialog", () => {
    it("should open save dialog when clicking Save Filter button", async () => {
      const user = userEvent.setup();
      const activeFilters: BoardFilters = { type: ["bug"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /save filter/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/filter name/i)).toBeInTheDocument();
    });

    it("should validate filter name before saving", async () => {
      const user = userEvent.setup();
      const activeFilters: BoardFilters = { type: ["bug"] };
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /save filter/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Find Save button inside dialog
      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      expect(toast.error).toHaveBeenCalledWith("Please enter a filter name");
      expect(mockCreateFilter).not.toHaveBeenCalled();
    });

    it("should save filter with name and public flag", async () => {
      const user = userEvent.setup();
      mockCreateFilter.mockResolvedValueOnce({});
      const activeFilters: BoardFilters = { type: ["bug"] };

      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /save filter/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Enter filter name
      const nameInput = screen.getByLabelText(/filter name/i);
      await user.type(nameInput, "My Bug Filter");

      // Check public checkbox
      const publicCheckbox = screen.getByLabelText(/share with team/i);
      await user.click(publicCheckbox);

      // Save
      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCreateFilter).toHaveBeenCalledWith({
          projectId: mockProjectId,
          name: "My Bug Filter",
          filters: { type: ["bug"] },
          isPublic: true,
        });
      });
      expect(toast.success).toHaveBeenCalledWith("Filter saved");
    });

    it("should handle save filter error", async () => {
      const user = userEvent.setup();
      mockCreateFilter.mockRejectedValueOnce(new Error("Save failed"));
      const activeFilters: BoardFilters = { type: ["bug"] };

      render(
        <FilterBar
          projectId={mockProjectId}
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /save filter/i }));
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/filter name/i);
      await user.type(nameInput, "Test");

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Save failed");
      });
    });
  });

  describe("Saved Filters Dropdown", () => {
    it("should show saved filters dropdown when filters exist", () => {
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      expect(screen.getByRole("button", { name: /saved filters/i })).toBeInTheDocument();
    });

    it("should apply saved filter when selected", async () => {
      const user = userEvent.setup();
      render(
        <FilterBar
          projectId={mockProjectId}
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />,
      );

      // Open saved filters dropdown
      await user.click(screen.getByRole("button", { name: /saved filters/i }));

      // Click on a saved filter
      const filterButton = await screen.findByRole("button", { name: /high priority bugs/i });
      await user.click(filterButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({ priority: ["high"], type: ["bug"] });
      expect(toast.success).toHaveBeenCalledWith("Filter applied");
    });
  });
});
