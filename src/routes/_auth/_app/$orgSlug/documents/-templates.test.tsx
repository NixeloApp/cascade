import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSeededDocumentCreation } from "@/hooks/useSeededDocumentCreation";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { DocumentTemplatesPage } from "./templates";

const mockDocumentTemplatesManager = vi.fn();

type MockDocumentTemplatesManagerProps = {
  createRequested?: number;
  onSelectTemplate?: (template: {
    _id: Id<"documentTemplates">;
    _creationTime: number;
    name: string;
    description?: string;
    category: string;
    icon: string;
    content: unknown[];
    isBuiltIn: boolean;
    isPublic: boolean;
    createdBy?: Id<"users">;
    projectId?: Id<"projects">;
    updatedAt: number;
  }) => Promise<void> | void;
};

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
}));

vi.mock("@/components/Documents", () => ({
  DocumentTemplatesManager: (props: MockDocumentTemplatesManagerProps) => {
    mockDocumentTemplatesManager(props);
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            void props.onSelectTemplate?.({
              _id: "template_1" as Id<"documentTemplates">,
              _creationTime: 1,
              name: "Meeting Notes",
              description: "Seeded meeting notes template",
              category: "meeting",
              icon: "lucide:FileText",
              content: [],
              isBuiltIn: true,
              isPublic: true,
              createdBy: undefined,
              projectId: "project_1" as Id<"projects">,
              updatedAt: 1,
            })
          }
        >
          Use Meeting Notes
        </button>
      </div>
    );
  },
}));

vi.mock("@/hooks/useSeededDocumentCreation", () => ({
  useSeededDocumentCreation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageHeader: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description: string;
    actions?: ReactNode;
  }) => (
    <header>
      <div>{title}</div>
      <div>{description}</div>
      {actions}
    </header>
  ),
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseSeededDocumentCreation = vi.mocked(useSeededDocumentCreation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

describe("DocumentTemplatesPage", () => {
  const createTemplateDocumentAndOpen = vi.fn();
  const createSeededDocumentAndOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSeededDocumentCreation.mockReturnValue({
      createSeededDocumentAndOpen,
      createTemplateDocumentAndOpen,
      error: null,
      isCreatingDocument: false,
      isLoading: false,
    });
  });

  it("opens the create template modal from the page header", () => {
    render(<DocumentTemplatesPage />);

    fireEvent.click(screen.getByRole("button", { name: "New Template" }));

    expect(mockDocumentTemplatesManager).toHaveBeenLastCalledWith(
      expect.objectContaining({ createRequested: 1 }),
    );
  });

  it("creates a seeded document when a template is selected", async () => {
    createTemplateDocumentAndOpen.mockResolvedValue({ documentId: "doc_1" as Id<"documents"> });

    render(<DocumentTemplatesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Use Meeting Notes" }));

    await waitFor(() => {
      expect(createTemplateDocumentAndOpen).toHaveBeenCalledWith({
        templateId: "template_1",
        title: "Meeting Notes",
        projectId: "project_1",
        isPublic: false,
      });
      expect(mockShowSuccess).toHaveBeenCalledWith("Document created from template");
    });
  });

  it("surfaces template creation failures", async () => {
    const error = new Error("seed failed");
    createTemplateDocumentAndOpen.mockRejectedValue(error);

    render(<DocumentTemplatesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Use Meeting Notes" }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create document from template");
    });
  });
});
