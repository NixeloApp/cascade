import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen, waitFor } from "@/test/custom-render";
import { OnboardingChecklist } from "./OnboardingChecklist";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const updateOnboarding = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

function mockChecklistQueries({
  onboarding = {
    checklistDismissed: false,
    onboardingCompleted: false,
    tourShown: false,
    wizardCompleted: false,
  },
  projects = { page: [] as Array<unknown> },
  hasCompletedIssue = false,
  userIssueCount = 0,
}: {
  onboarding?: {
    checklistDismissed: boolean;
    onboardingCompleted: boolean;
    tourShown: boolean;
    wizardCompleted: boolean;
  } | null;
  projects?: { page: Array<unknown> } | undefined;
  hasCompletedIssue?: boolean | undefined;
  userIssueCount?: number | undefined;
}) {
  let queryCall = 0;

  mockUseAuthenticatedQuery.mockImplementation(() => {
    const querySlot = queryCall % 4;
    queryCall += 1;

    if (querySlot === 0) {
      return onboarding;
    }

    if (querySlot === 1) {
      return projects;
    }

    if (querySlot === 2) {
      return hasCompletedIssue;
    }

    return userIssueCount;
  });
}

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: updateOnboarding,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when onboarding is unavailable, dismissed, or completed", () => {
    const { rerender } = render(<OnboardingChecklist />);

    expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();

    mockChecklistQueries({
      onboarding: {
        checklistDismissed: true,
        onboardingCompleted: false,
        tourShown: false,
        wizardCompleted: false,
      },
    });
    rerender(<OnboardingChecklist />);

    expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();

    mockChecklistQueries({
      onboarding: {
        checklistDismissed: false,
        onboardingCompleted: true,
        tourShown: true,
        wizardCompleted: true,
      },
    });
    rerender(<OnboardingChecklist />);

    expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
  });

  it("renders progress from onboarding state and supports collapse plus expand", async () => {
    const user = userEvent.setup();

    mockChecklistQueries({
      onboarding: {
        checklistDismissed: false,
        onboardingCompleted: false,
        tourShown: true,
        wizardCompleted: false,
      },
      projects: { page: [{ _id: "project_1" }] },
      hasCompletedIssue: false,
      userIssueCount: 2,
    });

    render(<OnboardingChecklist />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("3 of 4 complete")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Take the welcome tour")).toBeInTheDocument();
    expect(screen.getByText("Create a project")).toBeInTheDocument();
    expect(screen.getByText("Create an issue")).toBeInTheDocument();
    expect(screen.getByText("Complete an issue")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse checklist" }));
    expect(screen.queryByText("Take the welcome tour")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand checklist" }));
    expect(screen.getByText("Take the welcome tour")).toBeInTheDocument();
  });

  it("marks the checklist complete, shows the success callout, and dismisses with completion state", async () => {
    const user = userEvent.setup();
    updateOnboarding.mockResolvedValue(undefined);

    mockChecklistQueries({
      onboarding: {
        checklistDismissed: false,
        onboardingCompleted: false,
        tourShown: true,
        wizardCompleted: false,
      },
      projects: { page: [{ _id: "project_1" }] },
      hasCompletedIssue: true,
      userIssueCount: 1,
    });

    render(<OnboardingChecklist />);

    expect(screen.getByText("4 of 4 complete")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(
      screen.getByText("You're ready to use Nixelo. Feel free to dismiss this checklist."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss checklist" }));

    await waitFor(() =>
      expect(updateOnboarding).toHaveBeenCalledWith({
        checklistDismissed: true,
        onboardingCompleted: true,
      }),
    );
  });
});
