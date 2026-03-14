import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { SampleProjectModal } from "./SampleProjectModal";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const createSampleProject = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

describe("SampleProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createSampleProject,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when closed", () => {
    render(
      <SampleProjectModal
        open={false}
        onOpenChange={vi.fn()}
        onCreateSampleProject={vi.fn()}
        onStartFromScratch={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog", { name: "Welcome to Nixelo!" })).not.toBeInTheDocument();
  });

  it("creates a sample project and forwards the created project id", async () => {
    const user = userEvent.setup();
    const onCreateSampleProject = vi.fn();
    const projectId = "project_123" as Id<"projects">;

    createSampleProject.mockResolvedValue({ projectId });

    render(
      <SampleProjectModal
        open={true}
        onOpenChange={vi.fn()}
        onCreateSampleProject={onCreateSampleProject}
        onStartFromScratch={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Would you like us to create a sample project with demo issues to help you explore Nixelo?",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, show me around!" }));

    await waitFor(() => expect(createSampleProject).toHaveBeenCalledWith({}));
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Sample project created! Let's take a quick tour.",
    );
    expect(onCreateSampleProject).toHaveBeenCalledWith(projectId);
  });

  it("surfaces sample project creation errors and supports starting from scratch", async () => {
    const user = userEvent.setup();
    const onStartFromScratch = vi.fn();
    const error = new Error("creation failed");

    createSampleProject.mockRejectedValue(error);

    render(
      <SampleProjectModal
        open={true}
        onOpenChange={vi.fn()}
        onCreateSampleProject={vi.fn()}
        onStartFromScratch={onStartFromScratch}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Yes, show me around!" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create sample project"),
    );

    await user.click(screen.getByRole("button", { name: "I'll start from scratch" }));
    expect(onStartFromScratch).toHaveBeenCalledTimes(1);
  });
});
