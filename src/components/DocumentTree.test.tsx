import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@/test/custom-render";
import { DocumentTree } from "./DocumentTree";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params: object }) => (
    <a href={`${to}/${JSON.stringify(params)}`} data-testid="doc-link">
      {children}
    </a>
  ),
}));

const mockMoveDocument = vi.fn();

interface TreeNode {
  _id: Id<"documents">;
  title: string;
  isPublic: boolean;
  parentId?: Id<"documents">;
  order?: number;
  isOwner: boolean;
  children: TreeNode[];
  depth: number;
}

const createMockDocument = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  _id: `doc-${Math.random().toString(36).slice(2)}` as Id<"documents">,
  title: "Test Document",
  isPublic: false,
  isOwner: true,
  children: [],
  depth: 0,
  ...overrides,
});

// Helper to get menu trigger button from a document row
function getMenuTrigger(docTitle: string) {
  const link = screen.getByText(docTitle).closest("a");
  if (!link) throw new Error(`Could not find link for "${docTitle}"`);
  return within(link).getAllByRole("button")[1]; // Second button is menu trigger
}

// Helper to get expand button from a document row
function getExpandButton(docTitle: string) {
  const link = screen.getByText(docTitle).closest("a");
  if (!link) throw new Error(`Could not find link for "${docTitle}"`);
  return within(link).getAllByRole("button")[0]; // First button is expand toggle
}

describe("DocumentTree", () => {
  const defaultProps = {
    organizationId: "org-1" as Id<"organizations">,
    orgSlug: "test-org",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as Mock).mockReturnValue(mockMoveDocument);
    mockMoveDocument.mockResolvedValue(undefined);
  });

  describe("loading state", () => {
    it("should render loading skeletons when tree is undefined", () => {
      (useQuery as Mock).mockReturnValue(undefined);

      const { container } = render(<DocumentTree {...defaultProps} />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons).toHaveLength(3);
    });
  });

  describe("empty state", () => {
    it("should render empty state when tree is empty", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("No documents yet")).toBeInTheDocument();
    });

    it("should show create button in empty state when onCreateDocument provided", () => {
      (useQuery as Mock).mockReturnValue([]);
      const mockCreate = vi.fn();

      render(<DocumentTree {...defaultProps} onCreateDocument={mockCreate} />);

      expect(screen.getByRole("button", { name: /new document/i })).toBeInTheDocument();
    });

    it("should call onCreateDocument when clicking create button in empty state", async () => {
      const user = userEvent.setup();
      (useQuery as Mock).mockReturnValue([]);
      const mockCreate = vi.fn();

      render(<DocumentTree {...defaultProps} onCreateDocument={mockCreate} />);

      await user.click(screen.getByRole("button", { name: /new document/i }));

      expect(mockCreate).toHaveBeenCalledWith();
    });

    it("should not show create button in empty state when onCreateDocument not provided", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<DocumentTree {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /new document/i })).not.toBeInTheDocument();
    });
  });

  describe("document list", () => {
    it("should render documents", () => {
      const docs = [
        createMockDocument({ title: "Getting Started" }),
        createMockDocument({ title: "API Reference" }),
      ];
      (useQuery as Mock).mockReturnValue(docs);

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("API Reference")).toBeInTheDocument();
    });

    it("should show 'Untitled' for documents without title", () => {
      const docs = [createMockDocument({ title: "" })];
      (useQuery as Mock).mockReturnValue(docs);

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });

    it("should render create button at top when onCreateDocument provided", () => {
      const docs = [createMockDocument({ title: "Doc 1" })];
      (useQuery as Mock).mockReturnValue(docs);
      const mockCreate = vi.fn();

      render(<DocumentTree {...defaultProps} onCreateDocument={mockCreate} />);

      // Should have New Document button at top
      const buttons = screen.getAllByRole("button", { name: /new document/i });
      expect(buttons).toHaveLength(1);
    });
  });

  describe("document selection", () => {
    it("should highlight selected document", () => {
      const docs = [
        createMockDocument({ _id: "doc-1" as Id<"documents">, title: "Selected Doc" }),
        createMockDocument({ _id: "doc-2" as Id<"documents">, title: "Other Doc" }),
      ];
      (useQuery as Mock).mockReturnValue(docs);

      render(<DocumentTree {...defaultProps} selectedId={"doc-1" as Id<"documents">} />);

      // Selected doc should have brand color styling
      const selectedLink = screen.getByText("Selected Doc").closest("a");
      const selectedContainer = selectedLink?.querySelector(".bg-brand\\/10");
      expect(selectedContainer).toBeInTheDocument();
    });
  });

  describe("nested documents", () => {
    it("should render children when expanded", async () => {
      const user = userEvent.setup();
      const childDoc = createMockDocument({
        _id: "child-1" as Id<"documents">,
        title: "Child Document",
        depth: 1,
      });
      const parentDoc = createMockDocument({
        _id: "parent-1" as Id<"documents">,
        title: "Parent Document",
        children: [childDoc],
        depth: 0,
      });
      (useQuery as Mock).mockReturnValue([parentDoc]);

      render(<DocumentTree {...defaultProps} />);

      // Child should not be visible initially
      expect(screen.queryByText("Child Document")).not.toBeInTheDocument();

      // Click expand button
      const expandButton = getExpandButton("Parent Document");
      await user.click(expandButton);

      // Child should now be visible
      expect(screen.getByText("Child Document")).toBeInTheDocument();
    });

    it("should collapse children when clicking toggle again", async () => {
      const user = userEvent.setup();
      const childDoc = createMockDocument({
        _id: "child-1" as Id<"documents">,
        title: "Child Document",
        depth: 1,
      });
      const parentDoc = createMockDocument({
        _id: "parent-1" as Id<"documents">,
        title: "Parent Document",
        children: [childDoc],
        depth: 0,
      });
      (useQuery as Mock).mockReturnValue([parentDoc]);

      render(<DocumentTree {...defaultProps} />);

      const expandButton = getExpandButton("Parent Document");

      // Expand
      await user.click(expandButton);
      expect(screen.getByText("Child Document")).toBeInTheDocument();

      // Collapse
      await user.click(expandButton);
      expect(screen.queryByText("Child Document")).not.toBeInTheDocument();
    });

    it("should hide expand button for documents without children", () => {
      const doc = createMockDocument({ title: "Leaf Document", children: [] });
      (useQuery as Mock).mockReturnValue([doc]);

      render(<DocumentTree {...defaultProps} />);

      // The expand button should be invisible (has 'invisible' class)
      const link = screen.getByText("Leaf Document").closest("a");
      const expandButton = link?.querySelector("button.invisible");
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe("document actions menu", () => {
    it("should show 'Add subpage' option when onCreateDocument provided", async () => {
      const user = userEvent.setup();
      const doc = createMockDocument({ _id: "doc-1" as Id<"documents">, title: "Test Doc" });
      (useQuery as Mock).mockReturnValue([doc]);
      const mockCreate = vi.fn();

      render(<DocumentTree {...defaultProps} onCreateDocument={mockCreate} />);

      // Find and click the more menu button
      const menuTrigger = getMenuTrigger("Test Doc");
      await user.click(menuTrigger);

      expect(screen.getByText("Add subpage")).toBeInTheDocument();
    });

    it("should call onCreateDocument with parentId when clicking Add subpage", async () => {
      const user = userEvent.setup();
      const doc = createMockDocument({ _id: "doc-123" as Id<"documents">, title: "Parent Doc" });
      (useQuery as Mock).mockReturnValue([doc]);
      const mockCreate = vi.fn();

      render(<DocumentTree {...defaultProps} onCreateDocument={mockCreate} />);

      // Open menu and click Add subpage
      const menuTrigger = getMenuTrigger("Parent Doc");
      await user.click(menuTrigger);
      await user.click(screen.getByText("Add subpage"));

      expect(mockCreate).toHaveBeenCalledWith("doc-123");
    });

    it("should show 'Move to root' for nested documents owned by user", async () => {
      const user = userEvent.setup();
      const doc = createMockDocument({
        _id: "doc-1" as Id<"documents">,
        title: "Nested Doc",
        parentId: "parent-1" as Id<"documents">,
        isOwner: true,
      });
      (useQuery as Mock).mockReturnValue([doc]);

      render(<DocumentTree {...defaultProps} onCreateDocument={vi.fn()} />);

      const menuTrigger = getMenuTrigger("Nested Doc");
      await user.click(menuTrigger);

      expect(screen.getByText("Move to root")).toBeInTheDocument();
    });

    it("should not show 'Move to root' for root documents", async () => {
      const user = userEvent.setup();
      const doc = createMockDocument({
        _id: "doc-1" as Id<"documents">,
        title: "Root Doc",
        parentId: undefined,
        isOwner: true,
      });
      (useQuery as Mock).mockReturnValue([doc]);

      render(<DocumentTree {...defaultProps} onCreateDocument={vi.fn()} />);

      const menuTrigger = getMenuTrigger("Root Doc");
      await user.click(menuTrigger);

      expect(screen.queryByText("Move to root")).not.toBeInTheDocument();
    });

    it("should not show 'Move to root' for documents not owned by user", async () => {
      const user = userEvent.setup();
      const doc = createMockDocument({
        _id: "doc-1" as Id<"documents">,
        title: "Others Doc",
        parentId: "parent-1" as Id<"documents">,
        isOwner: false,
      });
      (useQuery as Mock).mockReturnValue([doc]);

      render(<DocumentTree {...defaultProps} onCreateDocument={vi.fn()} />);

      const menuTrigger = getMenuTrigger("Others Doc");
      await user.click(menuTrigger);

      expect(screen.queryByText("Move to root")).not.toBeInTheDocument();
    });
  });
});
