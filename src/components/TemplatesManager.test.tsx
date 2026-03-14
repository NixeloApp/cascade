import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { render, screen, waitFor } from "@/test/custom-render";
import { TemplatesManager } from "./TemplatesManager";

interface TemplateFormProps {
  open: boolean;
  template: { name: string } | null | undefined;
  onOpenChange: (open: boolean) => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useDeleteConfirmation", () => ({
  useDeleteConfirmation: vi.fn(),
}));

vi.mock("./Templates/TemplateCard", () => ({
  TemplateCard: ({
    template,
    onEdit,
    onDelete,
  }: {
    template: { name: string };
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div>
      <span>{template.name}</span>
      <button type="button" onClick={onEdit}>
        {`Edit ${template.name}`}
      </button>
      <button type="button" onClick={onDelete}>
        {`Delete ${template.name}`}
      </button>
    </div>
  ),
}));

vi.mock("./Templates/TemplateForm", () => ({
  TemplateForm: ({ open, template, onOpenChange }: TemplateFormProps) =>
    open ? (
      <div>
        <div>{template ? `Editing ${template.name}` : "Creating template"}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Template Form
        </button>
      </div>
    ) : null,
}));

vi.mock("./ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onConfirm,
    onClose,
    title,
    message,
    confirmLabel = "Confirm",
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div>{message}</div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose}>
          Cancel Delete
        </button>
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseDeleteConfirmation = vi.mocked(useDeleteConfirmation);

const mockDeleteTemplate = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const confirmDelete = vi.fn();
const cancelDelete = vi.fn();
const executeDelete = vi.fn();

const projectId = "project_1" as Id<"projects">;

const templates = [
  {
    _id: "template_1" as Id<"issueTemplates">,
    name: "Bug Report",
    type: "bug" as const,
    titleTemplate: "[BUG] {summary}",
    descriptionTemplate: "Describe the bug",
    defaultPriority: "high" as const,
  },
  {
    _id: "template_2" as Id<"issueTemplates">,
    name: "Feature Request",
    type: "story" as const,
    titleTemplate: "[FEATURE] {summary}",
    descriptionTemplate: "Describe the feature",
    defaultPriority: "medium" as const,
  },
];

describe("TemplatesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedQuery.mockReturnValue(templates);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockDeleteTemplate,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseDeleteConfirmation.mockReturnValue({
      deleteId: null,
      isDeleting: false,
      confirmDelete,
      cancelDelete,
      executeDelete,
    });
  });

  it("renders the empty state when there are no templates", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<TemplatesManager projectId={projectId} />);

    expect(screen.getByText("No templates yet")).toBeInTheDocument();
    expect(screen.getByText("Create templates to speed up issue creation")).toBeInTheDocument();
    expect(screen.queryByText("Creating template")).not.toBeInTheDocument();
  });

  it("opens the create form when clicking New Template", async () => {
    const user = userEvent.setup();

    render(<TemplatesManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "New Template" }));

    expect(screen.getByText("Creating template")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close Template Form" }));

    expect(screen.queryByText("Creating template")).not.toBeInTheDocument();
  });

  it("opens the edit form for the selected template", async () => {
    const user = userEvent.setup();

    render(<TemplatesManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Edit Feature Request" }));

    expect(screen.getByText("Editing Feature Request")).toBeInTheDocument();
  });

  it("requests delete confirmation for the selected template", async () => {
    const user = userEvent.setup();

    render(<TemplatesManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Delete Bug Report" }));

    expect(confirmDelete).toHaveBeenCalledWith("template_1");
  });

  it("executes the delete mutation through the confirmation dialog", async () => {
    const user = userEvent.setup();
    mockUseDeleteConfirmation.mockReturnValue({
      deleteId: "template_2" as Id<"issueTemplates">,
      isDeleting: false,
      confirmDelete,
      cancelDelete,
      executeDelete: vi.fn(async (deleteFn: (id: Id<"issueTemplates">) => Promise<void>) => {
        await deleteFn("template_2" as Id<"issueTemplates">);
      }),
    });
    mockDeleteTemplate.mockResolvedValue(undefined);

    render(<TemplatesManager projectId={projectId} />);

    expect(screen.getByRole("dialog", { name: "Delete Template" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockDeleteTemplate).toHaveBeenCalledWith({ id: "template_2" }));
  });
});
