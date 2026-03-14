import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { LeadOnboarding } from "./LeadOnboarding";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("./FeatureHighlights", () => ({
  FeatureHighlights: () => <div>Feature Highlights Stub</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const createSampleProject = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const createOrganization = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const completeOnboarding = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

function buildMutationReturnValue(
  mutate: ReactMutation<FunctionReference<"mutation">>,
): ReturnType<typeof useAuthenticatedMutation> {
  return {
    mutate,
    canAct: true,
    isAuthLoading: false,
  };
}

describe("LeadOnboarding", () => {
  beforeEach(() => {
    let mutationCall = 0;

    vi.clearAllMocks();

    mockUseAuthenticatedMutation.mockImplementation(() => {
      const mutationSlot = mutationCall % 3;
      mutationCall += 1;

      if (mutationSlot === 0) {
        return buildMutationReturnValue(createSampleProject);
      }

      if (mutationSlot === 1) {
        return buildMutationReturnValue(createOrganization);
      }

      return buildMutationReturnValue(completeOnboarding);
    });
  });

  it("renders the feature step and supports back plus internal step navigation", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<LeadOnboarding onComplete={vi.fn()} onCreateProject={vi.fn()} onBack={onBack} />);

    expect(screen.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_HEADING)).toHaveTextContent(
      "Perfect for Team Leads",
    );
    expect(screen.getByText("Feature Highlights Stub")).toBeInTheDocument();
    expect(screen.getByText("Invite team members and manage roles")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON));
    expect(screen.getByRole("heading", { name: "Name Your Project" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_HEADING)).toBeInTheDocument();
  });

  it("creates an organization and finishes onboarding through the workspace callback", async () => {
    const user = userEvent.setup();
    const onWorkspaceCreated = vi.fn();
    const onCreateProject = vi.fn();
    const onComplete = vi.fn();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    createOrganization.mockResolvedValue({ slug: "acme-platform" });
    completeOnboarding.mockResolvedValue(undefined);

    render(
      <LeadOnboarding
        onComplete={onComplete}
        onCreateProject={onCreateProject}
        onBack={vi.fn()}
        onWorkspaceCreated={onWorkspaceCreated}
      />,
    );

    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON));
    await user.type(
      screen.getByPlaceholderText("e.g., Acme Corp, My Startup, Design Team"),
      "  Acme Platform  ",
    );
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(createOrganization).toHaveBeenCalledWith({
        name: "Acme Platform",
        timezone,
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Project created!");
    expect(screen.getByRole("heading", { name: "Start Your First Project" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "I'll explore on my own" }));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(onWorkspaceCreated).toHaveBeenCalledWith("acme-platform");
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCreateProject).not.toHaveBeenCalled();
  });

  it("creates a sample project and routes to it when no workspace callback is provided", async () => {
    const user = userEvent.setup();
    const onCreateProject = vi.fn();
    const projectId = "project_123" as Id<"projects">;

    createOrganization.mockResolvedValue({ slug: "delivery-hub" });
    createSampleProject.mockResolvedValue({ projectId });
    completeOnboarding.mockResolvedValue(undefined);

    render(
      <LeadOnboarding onComplete={vi.fn()} onCreateProject={onCreateProject} onBack={vi.fn()} />,
    );

    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON));
    await user.type(
      screen.getByPlaceholderText("e.g., Acme Corp, My Startup, Design Team"),
      "Delivery Hub",
    );
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Start Your First Project" })).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Start with a Sample"));

    await waitFor(() => expect(createSampleProject).toHaveBeenCalledWith({}));
    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(onCreateProject).toHaveBeenCalledWith(projectId);
    expect(showSuccess).toHaveBeenCalledWith("Sample project created! Explore and customize it.");
  });
});
