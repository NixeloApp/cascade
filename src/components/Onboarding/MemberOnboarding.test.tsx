import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { MemberOnboarding } from "./MemberOnboarding";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

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

describe("MemberOnboarding", () => {
  beforeEach(() => {
    let mutationCall = 0;

    vi.clearAllMocks();

    mockUseAuthenticatedMutation.mockImplementation(() => {
      const mutationSlot = mutationCall % 2;
      mutationCall += 1;

      if (mutationSlot === 0) {
        return buildMutationReturnValue(createOrganization);
      }

      return buildMutationReturnValue(completeOnboarding);
    });
  });

  it("renders the project step, supports back, and returns from the feature step", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    createOrganization.mockResolvedValue({ slug: "design-studio" });

    render(<MemberOnboarding onComplete={vi.fn()} onBack={onBack} />);

    expect(screen.getByTestId(TEST_IDS.ONBOARDING.NAME_PROJECT_HEADING)).toHaveTextContent(
      "Name Your Project",
    );

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.type(
      screen.getByPlaceholderText("e.g., Acme Corp, My Team, Design Studio"),
      "Design Studio",
    );
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(screen.getByTestId(TEST_IDS.ONBOARDING.ALL_SET_HEADING)).toHaveTextContent(
        "You're ready",
      ),
    );
    expect(screen.getByText("Work on Issues")).toBeInTheDocument();
    expect(screen.getByText("Collaborate on Docs")).toBeInTheDocument();
    expect(screen.getByText("Track Time")).toBeInTheDocument();
    expect(screen.getByText("Stay Updated")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === "Ctrl+K")).toBeInTheDocument();
    expect(screen.getByLabelText("Command")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId(TEST_IDS.ONBOARDING.NAME_PROJECT_HEADING)).toBeInTheDocument();
  });

  it("creates a project and finishes through the workspace callback when provided", async () => {
    const user = userEvent.setup();
    const onWorkspaceCreated = vi.fn();
    const onComplete = vi.fn();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    createOrganization.mockResolvedValue({ slug: "platform-ops" });
    completeOnboarding.mockResolvedValue(undefined);

    render(
      <MemberOnboarding
        onComplete={onComplete}
        onBack={vi.fn()}
        onWorkspaceCreated={onWorkspaceCreated}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("e.g., Acme Corp, My Team, Design Studio"),
      "  Platform Ops  ",
    );
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(createOrganization).toHaveBeenCalledWith({
        name: "Platform Ops",
        timezone,
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Project created!");

    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.GO_TO_DASHBOARD_BUTTON));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(onWorkspaceCreated).toHaveBeenCalledWith("platform-ops");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("finishes onboarding through onComplete when no workspace callback is provided", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    createOrganization.mockResolvedValue({ slug: "delivery-hub" });
    completeOnboarding.mockResolvedValue(undefined);

    render(<MemberOnboarding onComplete={onComplete} onBack={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("e.g., Acme Corp, My Team, Design Studio"),
      "Delivery Hub",
    );
    await user.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(screen.getByTestId(TEST_IDS.ONBOARDING.ALL_SET_HEADING)).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.GO_TO_DASHBOARD_BUTTON));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
