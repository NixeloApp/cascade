import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { CreateProjectFromTemplate } from "./CreateProjectFromTemplate";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    projectTemplates: {
      list: "list",
      get: "get",
      createFromTemplate: "createFromTemplate",
    },
    workspaces: {
      list: "list",
    },
  },
}));

// Mock Organization context
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({ organizationId: "org-123" }),
}));

describe("CreateProjectFromTemplate (Jules accessibility)", () => {
  it("renders template list as an unordered list (ul) with list items (li)", () => {
    // Mock useQuery implementation
    const useQueryMock = vi.mocked(useQuery);
    useQueryMock.mockImplementation((query: any, ..._args: any[]) => {
      // Check if the query is for projectTemplates.list
      // In the component: useQuery(api.projectTemplates.list)
      // Since we mocked api.projectTemplates.list as "list", we check for that string
      if (query === "list") {
        return [
          {
            _id: "template-1",
            name: "Template 1",
            icon: "🚀",
            description: "Desc 1",
            category: "software",
            boardType: "kanban",
          },
          {
            _id: "template-2",
            name: "Template 2",
            icon: "🐛",
            description: "Desc 2",
            category: "marketing",
            boardType: "scrum",
          },
        ];
      }
      return null;
    });

    render(<CreateProjectFromTemplate open={true} onOpenChange={() => {}} />);

    // Check for unordered list
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe("UL");

    // Check for list items
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(listItems[0].tagName).toBe("LI");

    // Check that there are no headings INSIDE the list items
    // The dialog title "Choose a Template" is a heading, so queryAllByRole('heading') will return something.
    // We specifically check inside the list items.
    const firstItem = listItems[0];
    const itemHeadings = firstItem.querySelectorAll("h1, h2, h3, h4, h5, h6");
    expect(itemHeadings.length).toBe(0);

    // Verify content is still there
    expect(screen.getByText("Template 1")).toBeInTheDocument();
    expect(screen.getByText("Desc 1")).toBeInTheDocument();
  });
});
