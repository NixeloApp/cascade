import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { MoveDocumentDialog } from "./MoveDocumentDialog";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    isLoading,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({
    open,
    title,
    description,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {description && <div>{description}</div>}
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const moveToProject = vi.fn();

function createMutationMock(
  procedure: typeof moveToProject,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Parameters<typeof procedure>) => procedure(...args)) as ReactMutation<
    FunctionReference<"mutation">
  >;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

const documentId = "document_1" as Id<"documents">;
const organizationId = "org_1" as Id<"organizations">;
const currentProjectId = "project_1" as Id<"projects">;
const projectTwoId = "project_2" as Id<"projects">;

describe("MoveDocumentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    moveToProject.mockResolvedValue(undefined);
    mockUseAuthenticatedQuery.mockReturnValue({
      page: [
        { _id: currentProjectId, name: "Core Platform", key: "CORE" },
        { _id: projectTwoId, name: "Client Portal", key: "PORTAL" },
      ],
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(moveToProject),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when closed", () => {
    render(
      <MoveDocumentDialog
        open={false}
        onOpenChange={vi.fn()}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );

    expect(screen.queryByRole("dialog", { name: "Move Document" })).not.toBeInTheDocument();
  });

  it("moves a document to another project and resets the selection when reopened", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MoveDocumentDialog
        open={true}
        onOpenChange={onOpenChange}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );

    const select = screen.getByLabelText("Target Project");
    expect(select).toHaveValue(currentProjectId);
    expect(screen.getByRole("button", { name: "Move" })).toBeDisabled();

    await user.selectOptions(select, projectTwoId);
    expect(screen.getByRole("button", { name: "Move" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Move" }));

    await waitFor(() =>
      expect(moveToProject).toHaveBeenCalledWith({
        id: documentId,
        projectId: projectTwoId,
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Document moved to project");
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <MoveDocumentDialog
        open={false}
        onOpenChange={onOpenChange}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );
    rerender(
      <MoveDocumentDialog
        open={true}
        onOpenChange={onOpenChange}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );

    expect(screen.getByLabelText("Target Project")).toHaveValue(currentProjectId);
  });

  it("supports moving to the organization level and surfaces mutation errors", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const error = new Error("move failed");

    const { rerender } = render(
      <MoveDocumentDialog
        open={true}
        onOpenChange={onOpenChange}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Target Project"), "");
    expect(
      screen.getByText(
        "The document will be moved to the organization level and won't be associated with any project.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move" }));

    await waitFor(() =>
      expect(moveToProject).toHaveBeenCalledWith({
        id: documentId,
        projectId: undefined,
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Document removed from project");

    moveToProject.mockRejectedValueOnce(error);
    rerender(
      <MoveDocumentDialog
        open={true}
        onOpenChange={onOpenChange}
        documentId={documentId}
        currentProjectId={currentProjectId}
        organizationId={organizationId}
      />,
    );

    const closeCallCount = onOpenChange.mock.calls.length;
    await user.selectOptions(screen.getByLabelText("Target Project"), projectTwoId);
    await user.click(screen.getByRole("button", { name: "Move" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to move document"),
    );
    expect(onOpenChange).toHaveBeenCalledTimes(closeCallCount);
  });
});
