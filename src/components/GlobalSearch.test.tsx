import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetGlobalSearchStateForTests } from "@/hooks/useGlobalSearch";
import { TEST_IDS } from "@/lib/test-ids";
import { act, render, screen, waitFor } from "@/test/custom-render";
import { GlobalSearch } from "./GlobalSearch";

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(),
}));

function withSearchResults({
  issues = [],
  issueTotal = issues.length,
  documents = [],
  documentTotal = documents.length,
}: {
  issues?: unknown[];
  issueTotal?: number;
  documents?: unknown[];
  documentTotal?: number;
}) {
  let callCount = 0;
  vi.mocked(useQuery).mockImplementation(() => {
    callCount += 1;
    if (callCount % 2 === 1) {
      return { page: issues, total: issueTotal, hasMore: false };
    }
    return { results: documents, total: documentTotal, hasMore: false };
  });
}

describe("GlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalSearchStateForTests();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    withSearchResults({});
  });

  afterEach(() => {
    resetGlobalSearchStateForTests();
    vi.restoreAllMocks();
  });

  it("renders the unified omnibox trigger", () => {
    render(<GlobalSearch />);

    expect(screen.getByRole("button", { name: /open search and commands/i })).toBeInTheDocument();
    expect(screen.getByText(/Search, jump, or create/i)).toBeInTheDocument();
  });

  it("opens from the trigger button", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /open search and commands/i }));

    expect(screen.getByPlaceholderText(/Search issues, docs, and commands/i)).toBeInTheDocument();
    expect(screen.getByText(/jump straight into common actions/i)).toBeInTheDocument();
  });

  it("opens on Cmd+K and Ctrl+K", async () => {
    render(<GlobalSearch />);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search issues, docs, and commands/i)).toBeInTheDocument();
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search issues, docs, and commands/i)).toBeInTheDocument();
    });
  });

  it("shows command actions before full search kicks in", async () => {
    const user = userEvent.setup();
    render(
      <GlobalSearch
        commands={[
          {
            id: "create-issue",
            label: "Create Issue",
            description: "Create a new issue",
            action: vi.fn(),
            group: "Create",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open search and commands/i }));
    expect(screen.getByText("Create Issue")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Search issues, docs, and commands/i), "c");
    expect(screen.getByText("Create Issue")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.SEARCH.MIN_QUERY_MESSAGE)).toHaveTextContent(
      /search issues and docs/i,
    );
  });

  it("shows tabs and search results once enough text is entered", async () => {
    const user = userEvent.setup();
    withSearchResults({
      issues: [{ _id: "1", key: "TEST-1", title: "Test Issue", type: "task", projectId: "proj-1" }],
      documents: [{ _id: "2", title: "Test Doc" }],
    });

    render(<GlobalSearch />);
    await user.click(screen.getByRole("button", { name: /open search and commands/i }));
    await user.type(screen.getByPlaceholderText(/Search issues, docs, and commands/i), "test");

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /All/i })).toBeInTheDocument();
      expect(screen.getByText("TEST-1")).toBeInTheDocument();
      expect(screen.getByText("Test Doc")).toBeInTheDocument();
    });
  });

  it("shows empty state and advanced search action when nothing matches", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /open search and commands/i }));
    await user.type(screen.getByPlaceholderText(/Search issues, docs, and commands/i), "nomatch");

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Open advanced search/i })).toBeInTheDocument();
    });
  });

  it("opens advanced search from the footer action", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /open search and commands/i }));
    await user.click(screen.getByRole("button", { name: /Advanced Search/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Search Issues/i)).toBeInTheDocument();
    });
  });

  it("closes when backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /open search and commands/i }));
    await user.click(screen.getByTestId(TEST_IDS.DIALOG.OVERLAY));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(/Search issues, docs, and commands/i),
      ).not.toBeInTheDocument();
    });
  });
});
