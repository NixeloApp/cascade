import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock heavy child components
vi.mock("./AdvancedSearchModal/SearchResultsList", () => ({
  SearchResultsList: () => <div data-testid="mock-search-results">SearchResultsList</div>,
}));

import { AdvancedSearchModal } from "./AdvancedSearchModal";

describe("AdvancedSearchModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSelectIssue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with title and search input", () => {
    render(<AdvancedSearchModal {...defaultProps} />);

    expect(screen.getByRole("heading", { name: /advanced search/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search issues/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search by title, key, or description/i),
    ).toBeInTheDocument();
  });

  it("renders filter groups for Type, Priority, and Status", () => {
    render(<AdvancedSearchModal {...defaultProps} />);

    // Filter group labels
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Type filter options
    expect(screen.getByText("task")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("story")).toBeInTheDocument();
    expect(screen.getByText("epic")).toBeInTheDocument();

    // Priority filter options
    expect(screen.getByText("lowest")).toBeInTheDocument();
    expect(screen.getByText("highest")).toBeInTheDocument();

    // Status filter options
    expect(screen.getByText("todo")).toBeInTheDocument();
    expect(screen.getByText("done")).toBeInTheDocument();
  });

  it("shows placeholder message when search query is less than 2 characters", () => {
    render(<AdvancedSearchModal {...defaultProps} />);

    expect(
      screen.getByText("Results appear once you type at least 2 characters."),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<AdvancedSearchModal {...defaultProps} open={false} />);

    expect(screen.queryByRole("heading", { name: /advanced search/i })).not.toBeInTheDocument();
  });
});
