import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueDependencies } from "./IssueDependencies";

// Mock convex/react
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (query: any, args: any) => mockUseQuery(query, args),
  useMutation: (mutation: any) => mockUseMutation(mutation),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    issueLinks: {
      getIssueLinks: "issueLinks.getIssueLinks",
      createIssueLink: "issueLinks.createIssueLink",
      deleteIssueLink: "issueLinks.deleteIssueLink",
    },
    issues: {
      search: "issues.search",
    },
  },
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

describe("IssueDependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("renders dependencies and remove buttons with tooltips", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockImplementation((query) => {
      if (query === "issueLinks.getIssueLinks") {
        return {
          outgoing: [
            {
              _id: "link1" as Id<"issueLinks">,
              linkType: "blocks",
              issue: {
                _id: "issue2" as Id<"issues">,
                key: "TEST-2",
                title: "Blocked Issue",
                type: "bug",
              },
            },
          ],
          incoming: [],
        };
      }
      return undefined;
    });

    render(
      <IssueDependencies
        issueId={"issue1" as Id<"issues">}
        projectId={"project1" as Id<"projects">}
      />,
    );

    // Check if the dependency is rendered
    expect(screen.getByText("Blocked Issue")).toBeInTheDocument();

    // Check for the remove button with aria-label
    const removeButton = screen.getByRole("button", { name: "Remove dependency" });
    expect(removeButton).toBeInTheDocument();

    // Test tooltip
    await user.hover(removeButton);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Remove dependency");
  });
});
