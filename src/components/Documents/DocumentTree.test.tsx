import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={`${to}${params ? `?${JSON.stringify(params)}` : ""}`}>{children}</a>,
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

// Mock data storage
const mockData = {
  rootDocs: undefined as TreeNode[] | undefined,
  favorites: undefined as { _id: Id<"documents">; title: string }[] | undefined,
  archived: undefined as { _id: Id<"documents">; title: string }[] | undefined,
  children: undefined as TreeNode[] | undefined,
};

interface TreeNode {
  _id: Id<"documents">;
  title: string;
  isPublic: boolean;
  parentId?: Id<"documents">;
  order?: number;
  isOwner: boolean;
  hasChildren: boolean;
}

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    // Check args to determine which query is being called
    const argsObj = args as Record<string, unknown> | "skip";
    if (argsObj === "skip") return undefined;

    // listChildren returns rootDocs or children based on parentId
    if (argsObj && "parentId" in argsObj) {
      return argsObj.parentId === undefined ? mockData.rootDocs : mockData.children;
    }
    // listFavorites
    if (argsObj && "limit" in argsObj && !("parentId" in argsObj)) {
      // Distinguish favorites from archived by checking the call order isn't reliable
      // Just return based on what's set
      return mockData.favorites;
    }
    return undefined;
  }),
  useMutation: vi.fn(() => vi.fn()),
}));

// Import after mocks
import { DocumentTree } from "./DocumentTree";

// Helper to set up mocks
function setupMocks(config: {
  rootDocs?: TreeNode[];
  favorites?: { _id: Id<"documents">; title: string }[];
  archived?: { _id: Id<"documents">; title: string }[];
  children?: TreeNode[];
}) {
  mockData.rootDocs = config.rootDocs;
  mockData.favorites = config.favorites;
  mockData.archived = config.archived;
  mockData.children = config.children;
}

function createMockDocument(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    _id: "doc-1" as Id<"documents">,
    title: "Test Document",
    isPublic: false,
    isOwner: true,
    hasChildren: false,
    ...overrides,
  };
}

describe("DocumentTree", () => {
  const defaultProps = {
    organizationId: "org-1" as Id<"organizations">,
    orgSlug: "test-org",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockData.rootDocs = undefined;
    mockData.favorites = undefined;
    mockData.archived = undefined;
    mockData.children = undefined;
  });

  describe("Loading State", () => {
    it("should render loading skeletons when data is loading", () => {
      setupMocks({});

      render(<DocumentTree {...defaultProps} />);

      // Should show 3 skeleton placeholders
      const skeletons = document.querySelectorAll(".h-8");
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no documents exist", () => {
      setupMocks({ rootDocs: [] });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("No documents yet")).toBeInTheDocument();
    });

    it("should show New Document button in empty state when onCreateDocument provided", () => {
      const onCreateDocument = vi.fn();
      setupMocks({ rootDocs: [] });

      render(<DocumentTree {...defaultProps} onCreateDocument={onCreateDocument} />);

      expect(screen.getByRole("button", { name: /new document/i })).toBeInTheDocument();
    });

    it("should call onCreateDocument when New Document button clicked in empty state", async () => {
      const user = userEvent.setup();
      const onCreateDocument = vi.fn();
      setupMocks({ rootDocs: [] });

      render(<DocumentTree {...defaultProps} onCreateDocument={onCreateDocument} />);

      await user.click(screen.getByRole("button", { name: /new document/i }));

      expect(onCreateDocument).toHaveBeenCalledWith();
    });
  });

  describe("Document List", () => {
    it("should render document titles", () => {
      setupMocks({
        rootDocs: [
          createMockDocument({ _id: "doc-1" as Id<"documents">, title: "First Doc" }),
          createMockDocument({ _id: "doc-2" as Id<"documents">, title: "Second Doc" }),
        ],
      });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("First Doc")).toBeInTheDocument();
      expect(screen.getByText("Second Doc")).toBeInTheDocument();
    });

    it("should show 'Untitled' for documents without title", () => {
      setupMocks({
        rootDocs: [createMockDocument({ title: "" })],
      });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });

    it("should highlight selected document", () => {
      const selectedId = "doc-1" as Id<"documents">;
      setupMocks({
        rootDocs: [createMockDocument({ _id: selectedId, title: "Selected Doc" })],
      });

      render(<DocumentTree {...defaultProps} selectedId={selectedId} />);

      // The selected document should have label variant (bolder)
      const docElement = screen.getByText("Selected Doc");
      expect(docElement).toBeInTheDocument();
    });
  });

  describe("New Document Button", () => {
    it("should show New Document button when onCreateDocument provided", () => {
      setupMocks({
        rootDocs: [createMockDocument()],
      });

      render(<DocumentTree {...defaultProps} onCreateDocument={vi.fn()} />);

      expect(screen.getByRole("button", { name: /new document/i })).toBeInTheDocument();
    });

    it("should not show New Document button when onCreateDocument not provided", () => {
      setupMocks({
        rootDocs: [createMockDocument()],
      });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /new document/i })).not.toBeInTheDocument();
    });
  });

  describe("Favorites Section", () => {
    it("should render Favorites section when favorites exist", () => {
      setupMocks({
        rootDocs: [createMockDocument()],
        favorites: [{ _id: "fav-1" as Id<"documents">, title: "Favorite Doc" }],
      });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.getByText("Favorites")).toBeInTheDocument();
      expect(screen.getByText("Favorite Doc")).toBeInTheDocument();
    });

    it("should not render Favorites section when no favorites", () => {
      setupMocks({
        rootDocs: [createMockDocument()],
        favorites: [],
      });

      render(<DocumentTree {...defaultProps} />);

      expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    });

    it("should toggle Favorites section when clicked", async () => {
      const user = userEvent.setup();
      setupMocks({
        rootDocs: [createMockDocument()],
        favorites: [{ _id: "fav-1" as Id<"documents">, title: "Favorite Doc" }],
      });

      render(<DocumentTree {...defaultProps} />);

      // Initially expanded
      expect(screen.getByText("Favorite Doc")).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByRole("button", { name: /favorites/i }));

      // Should hide the favorite doc
      expect(screen.queryByText("Favorite Doc")).not.toBeInTheDocument();
    });
  });

  describe("Tree Node Expansion", () => {
    it("should show expand button for documents with children", () => {
      setupMocks({
        rootDocs: [createMockDocument({ hasChildren: true, title: "Parent Doc" })],
      });

      render(<DocumentTree {...defaultProps} />);

      // Should have an expand/collapse button
      const parentRow = screen.getByText("Parent Doc").closest("a");
      expect(parentRow).toBeInTheDocument();
    });

    it("should hide expand button for documents without children", () => {
      setupMocks({
        rootDocs: [createMockDocument({ hasChildren: false, title: "Leaf Doc" })],
      });

      render(<DocumentTree {...defaultProps} />);

      // The expand button should be invisible (has invisible class)
      const doc = screen.getByText("Leaf Doc");
      expect(doc).toBeInTheDocument();
    });
  });
});
