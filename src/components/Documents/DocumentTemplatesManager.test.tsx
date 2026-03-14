import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { DocumentTemplatesManager } from "./DocumentTemplatesManager";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ open, title, children }: DialogProps) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    onConfirm,
    onClose,
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="alertdialog" aria-label={title}>
        <div>{message}</div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/IconPicker", () => ({
  IconPicker: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange(value)}>
      {`Icon ${value}`}
    </button>
  ),
  TemplateIcon: ({ value }: { value: string | { type: "lucide"; name: string } }) => (
    <span>{typeof value === "string" ? value : `lucide:${value.name}`}</span>
  ),
  toTemplateIconString: (
    value: string | { type: "lucide"; name: string } | { type: "emoji"; value: string },
  ) => {
    if (typeof value === "string") {
      return value;
    }
    return value.type === "lucide" ? `lucide:${value.name}` : value.value;
  },
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const mockCreateTemplate = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUpdateTemplate = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockDeleteTemplate = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

const projectId = "project_1" as Id<"projects">;
const builtInTemplateId = "template_builtin" as Id<"documentTemplates">;
const customTemplateId = "template_custom" as Id<"documentTemplates">;

const templates = [
  {
    _id: builtInTemplateId,
    _creationTime: 1,
    name: "Sprint Review",
    description: "Built-in meeting notes",
    category: "meeting",
    icon: "lucide:FileText",
    content: [{ type: "paragraph", content: [] }],
    isBuiltIn: true,
    isPublic: true,
    createdBy: undefined,
    projectId: undefined,
    updatedAt: 1,
  },
  {
    _id: customTemplateId,
    _creationTime: 2,
    name: "Architecture Decision",
    description: "Track architecture choices",
    category: "engineering",
    icon: { type: "lucide" as const, name: "Rocket" },
    content: [{ type: "paragraph", content: [] }],
    isBuiltIn: false,
    isPublic: false,
    createdBy: "user_1" as Id<"users">,
    projectId,
    updatedAt: 2,
  },
];

describe("DocumentTemplatesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthenticatedQuery.mockReturnValue(templates);
    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation((_mutation) => {
      const index = mutationCallCount % 3;
      mutationCallCount += 1;
      if (index === 0) {
        return {
          mutate: mockCreateTemplate,
          canAct: true,
          isAuthLoading: false,
        };
      }

      if (index === 1) {
        return {
          mutate: mockUpdateTemplate,
          canAct: true,
          isAuthLoading: false,
        };
      }

      return {
        mutate: mockDeleteTemplate,
        canAct: true,
        isAuthLoading: false,
      };
    });
  });

  it("renders the empty state and opens the create modal from an external request", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    const { rerender } = render(
      <DocumentTemplatesManager projectId={projectId} createRequested={0} />,
    );

    expect(screen.getByText("No templates yet")).toBeInTheDocument();
    expect(screen.getByText("Create templates to speed up document creation")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Create Template" })).not.toBeInTheDocument();

    rerender(<DocumentTemplatesManager projectId={projectId} createRequested={1} />);

    expect(screen.getByRole("dialog", { name: "Create Template" })).toBeInTheDocument();
  });

  it("renders built-in and custom templates and selects them", async () => {
    const user = userEvent.setup();
    const onSelectTemplate = vi.fn();

    render(<DocumentTemplatesManager projectId={projectId} onSelectTemplate={onSelectTemplate} />);

    expect(screen.getByText("Built-in Templates")).toBeInTheDocument();
    expect(screen.getByText("Custom Templates")).toBeInTheDocument();

    await user.click(screen.getByText("Sprint Review"));
    const customTemplateButton = screen.getByText("Architecture Decision").closest("button");
    expect(customTemplateButton).not.toBeNull();
    if (!customTemplateButton) {
      throw new Error("Expected custom template button");
    }
    await user.click(customTemplateButton);

    expect(onSelectTemplate).toHaveBeenNthCalledWith(1, builtInTemplateId);
    expect(onSelectTemplate).toHaveBeenNthCalledWith(2, customTemplateId);
  });

  it("creates a template with trimmed values", async () => {
    const user = userEvent.setup();
    mockCreateTemplate.mockResolvedValue({ templateId: "created" as Id<"documentTemplates"> });

    render(<DocumentTemplatesManager projectId={projectId} createRequested={1} />);

    await user.clear(screen.getByLabelText("Template Name"));
    await user.type(screen.getByLabelText("Template Name"), "  New doc template  ");
    await user.type(screen.getByLabelText("Description"), "  Standard agenda for project syncs  ");
    await user.selectOptions(screen.getByLabelText("Category"), "meeting");
    await user.click(screen.getByLabelText("Make public (visible to all users)"));
    await user.click(screen.getByRole("button", { name: "Create Template" }));

    await waitFor(() =>
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: "New doc template",
        description: "Standard agenda for project syncs",
        category: "meeting",
        icon: "lucide:FileText",
        content: [
          {
            type: "heading",
            props: { level: 1 },
            content: [{ type: "text", text: "New doc template" }],
          },
          { type: "paragraph", content: [] },
        ],
        isPublic: true,
        projectId,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Template created");
  });

  it("prefills the edit modal and updates the selected template", async () => {
    const user = userEvent.setup();
    mockUpdateTemplate.mockResolvedValue(undefined);

    render(<DocumentTemplatesManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Edit template Architecture Decision" }));

    expect(screen.getByRole("dialog", { name: "Edit Template" })).toBeInTheDocument();
    expect(screen.getByLabelText("Template Name")).toHaveValue("Architecture Decision");
    expect(screen.getByLabelText("Description")).toHaveValue("Track architecture choices");
    expect(screen.getByLabelText("Category")).toHaveValue("engineering");

    await user.clear(screen.getByLabelText("Template Name"));
    await user.type(screen.getByLabelText("Template Name"), "Updated ADR");
    await user.click(screen.getByRole("button", { name: "Update Template" }));

    await waitFor(() =>
      expect(mockUpdateTemplate).toHaveBeenCalledWith({
        id: customTemplateId,
        name: "Updated ADR",
        description: "Track architecture choices",
        category: "engineering",
        icon: "lucide:Rocket",
        isPublic: false,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Template updated");
  });

  it("deletes the selected template after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteTemplate.mockResolvedValue(undefined);

    render(<DocumentTemplatesManager projectId={projectId} />);

    await user.click(screen.getByRole("button", { name: "Delete template Architecture Decision" }));

    expect(screen.getByRole("alertdialog", { name: "Delete Template" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockDeleteTemplate).toHaveBeenCalledWith({ id: customTemplateId }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Template deleted");
  });
});
