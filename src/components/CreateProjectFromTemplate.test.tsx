import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { CreateProjectFromTemplate } from "./CreateProjectFromTemplate";

const mockUseAuthenticatedQuery = vi.fn();
const mockMutate = vi.fn();

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: () => ({
    canAct: true,
    isAuthLoading: false,
    mutate: mockMutate,
  }),
  useAuthenticatedQuery: (...args: unknown[]) => mockUseAuthenticatedQuery(...args),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({ organizationId: "org-123" }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projectTemplates: {
      createFromTemplate: "projectTemplates:createFromTemplate",
      get: "projectTemplates:get",
      list: "projectTemplates:list",
    },
    workspaces: {
      list: "workspaces:list",
    },
  },
}));

const TEMPLATE_LIST = [
  {
    _id: "template-1",
    boardType: "kanban",
    category: "software",
    description: "Plan product delivery with a ready-made workflow.",
    icon: "🚀",
    name: "Software Delivery",
  },
  {
    _id: "template-2",
    boardType: "scrum",
    category: "marketing",
    description: "Organize campaign work with clear ownership.",
    icon: "📣",
    name: "Campaign Sprint",
  },
] as const;

const TEMPLATE_DETAIL = {
  ...TEMPLATE_LIST[0],
  defaultLabels: ["frontend", "backend", "urgent"],
  workflowStates: [
    { category: "todo", name: "Todo", order: 0 },
    { category: "inprogress", name: "Doing", order: 1 },
    { category: "done", name: "Done", order: 2 },
  ],
};

const WORKSPACES = [{ _id: "workspace-1", name: "Core Workspace" }] as const;

describe("CreateProjectFromTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthenticatedQuery.mockImplementation((query: string, args: unknown) => {
      if (args === "skip") {
        return undefined;
      }

      if (query === "projectTemplates:list") {
        return TEMPLATE_LIST;
      }

      if (query === "workspaces:list") {
        return WORKSPACES;
      }

      if (query === "projectTemplates:get") {
        return TEMPLATE_DETAIL;
      }

      return undefined;
    });
  });

  it("renders template list as an unordered list with list items", () => {
    render(<CreateProjectFromTemplate open={true} onOpenChange={() => {}} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(screen.getByText("Software Delivery")).toBeInTheDocument();
    expect(screen.getByText("Campaign Sprint")).toBeInTheDocument();
  });

  it("shows the inset template summary when moving to configuration", () => {
    render(<CreateProjectFromTemplate open={true} onOpenChange={() => {}} />);

    fireEvent.click(screen.getByText("Software Delivery"));

    expect(screen.getByRole("heading", { name: "Configure Project" })).toBeInTheDocument();
    expect(screen.getByText("Included in the template")).toBeInTheDocument();
    expect(screen.getByText("Starter states ready for the project board.")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.PROJECT.NAME_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.PROJECT.KEY_INPUT)).toBeInTheDocument();
  });
});
