import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { FocusZone } from "./FocusZone";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

const mockUseOrganization = vi.mocked(useOrganization);

const task = {
  _id: "issue_1",
  key: "APP-42",
  title: "Ship focused onboarding improvements",
  priority: "high",
  status: "In Progress",
  projectName: "App Shell",
  projectKey: "APP",
};

describe("FocusZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      organizationId: "org_1" as Id<"organizations">,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
  });

  it("renders nothing when no focus task is available", () => {
    const { container } = render(<FocusZone task={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the focus task details and navigates to the project board", async () => {
    const user = userEvent.setup();

    render(<FocusZone task={task} />);

    expect(screen.getByText("Focus item")).toBeInTheDocument();
    expect(screen.getByText("Highest-impact next step")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("Ship focused onboarding improvements")).toBeInTheDocument();
    expect(screen.getByText("APP-42")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("App Shell")).toBeInTheDocument();
    expect(screen.getByText("Open board")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Keep the highest-impact task moving before lower-priority work dilutes the week.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Focus task: Ship focused onboarding improvements" }),
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.projects.board.path,
      params: { orgSlug: "acme", key: "APP" },
    });
  });
});
