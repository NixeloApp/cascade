import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { OrgContext, type OrgContextType } from "@/hooks/useOrgContext";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { type CommandAction, CommandPalette } from "./CommandPalette";

// Mock scrollIntoView for cmdk
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: { search: "api.issues.search" },
    documents: { search: "api.documents.search" },
    projects: { getCurrentUserProjects: "api.projects.getCurrentUserProjects" },
  },
}));

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockOrgContext: OrgContextType = {
  organizationId: "org123" as Id<"organizations">,
  orgSlug: "acme",
  organizationName: "Acme Corporation",
  userRole: "admin",
  billingEnabled: true,
};

const createWrapper =
  (contextValue: OrgContextType = mockOrgContext) =>
  ({ children }: { children: ReactNode }) => (
    <OrgContext.Provider value={contextValue}>{children}</OrgContext.Provider>
  );

const mockCommands: CommandAction[] = [
  {
    id: "go-home",
    label: "Go Home",
    description: "Navigate to dashboard",
    keywords: ["dashboard", "home"],
    group: "Navigation",
    action: vi.fn(),
  },
  {
    id: "create-issue",
    label: "Create Issue",
    description: "Create a new issue",
    keywords: ["new", "task", "bug"],
    group: "Actions",
    action: vi.fn(),
  },
  {
    id: "search-docs",
    label: "Search Documents",
    description: "Search in documents",
    keywords: ["find", "docs"],
    group: "Navigation",
    action: vi.fn(),
  },
];

describe("CommandPalette", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as Mock).mockReturnValue([]);
  });

  describe("Rendering", () => {
    it("should render when open", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should not render dialog content when closed", () => {
      render(<CommandPalette isOpen={false} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render search input", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render all commands", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Go Home")).toBeInTheDocument();
      expect(screen.getByText("Create Issue")).toBeInTheDocument();
      expect(screen.getByText("Search Documents")).toBeInTheDocument();
    });
  });

  describe("Command Groups", () => {
    it("should group commands by group property", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      // Groups should be visible
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should show commands in correct groups", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      // Both navigation commands should be in the same group
      const groups = screen.getAllByRole("group");
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  describe("Search/Filtering", () => {
    it("should filter commands by label", async () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "issue" } });

      await waitFor(() => {
        expect(screen.getByText("Create Issue")).toBeInTheDocument();
      });
    });

    it("should clear search when reopened", async () => {
      const { rerender } = render(
        <CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />,
        { wrapper: createWrapper() },
      );

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "issue" } });

      // Close and reopen
      rerender(<CommandPalette isOpen={false} onClose={mockOnClose} commands={mockCommands} />);
      rerender(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />);

      await waitFor(() => {
        const newInput = screen.getByRole("combobox");
        expect(newInput).toHaveValue("");
      });
    });
  });

  describe("Command Selection", () => {
    it("should call action when command is selected", async () => {
      const actionMock = vi.fn();
      const commands = [
        {
          id: "test-action",
          label: "Test Action",
          action: actionMock,
          group: "Test",
        },
      ];

      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={commands} />, {
        wrapper: createWrapper(),
      });

      const commandItem = screen.getByText("Test Action");
      fireEvent.click(commandItem);

      await waitFor(() => {
        expect(actionMock).toHaveBeenCalled();
      });
    });

    it("should call onClose after selecting command", async () => {
      const actionMock = vi.fn();
      const commands = [
        {
          id: "test-action",
          label: "Test Action",
          action: actionMock,
          group: "Test",
        },
      ];

      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={commands} />, {
        wrapper: createWrapper(),
      });

      const commandItem = screen.getByText("Test Action");
      fireEvent.click(commandItem);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no commands match search", async () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "xyznonexistent" } });

      await waitFor(() => {
        expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Command Descriptions", () => {
    it("should render command descriptions", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Navigate to dashboard")).toBeInTheDocument();
      expect(screen.getByText("Create a new issue")).toBeInTheDocument();
    });
  });

  describe("Empty Commands", () => {
    it("should render without commands", () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={[]} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle escape key to close", async () => {
      render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={mockCommands} />, {
        wrapper: createWrapper(),
      });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
