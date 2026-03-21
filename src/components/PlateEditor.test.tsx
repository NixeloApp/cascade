import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { act, type PropsWithChildren } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  getEditorPlugins,
  getInitialValue,
  isEmptyValue,
  proseMirrorSnapshotToValue,
} from "@/lib/plate/editor";
import { markdownToValue, readMarkdownForPreview } from "@/lib/plate/markdown";
import { showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { PlateEditor } from "./PlateEditor";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("platejs/react", () => ({
  Plate: vi.fn(),
  usePlateEditor: vi.fn(),
}));

vi.mock("@/components/ui/PlateRichTextContent", () => ({
  PlateRichTextContent: ({ "data-testid": testId }: { "data-testid"?: string }) => (
    <div data-testid={testId ?? "plate-rich-text-content"} />
  ),
}));

vi.mock("@/lib/plate/editor", () => ({
  getEditorPlugins: vi.fn(),
  getInitialValue: vi.fn(),
  isEmptyValue: vi.fn(),
  proseMirrorSnapshotToValue: vi.fn(),
}));

vi.mock("@/lib/plate/markdown", () => ({
  markdownToValue: vi.fn(),
  readMarkdownForPreview: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("./Documents", () => ({
  DocumentHeader: ({ onImportMarkdown }: { onImportMarkdown: () => Promise<void> }) => (
    <button type="button" onClick={() => void onImportMarkdown()}>
      Import markdown
    </button>
  ),
  DocumentSidebar: () => null,
}));

vi.mock("./ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock("./MoveDocumentDialog", () => ({
  MoveDocumentDialog: () => null,
}));

vi.mock("./Plate/FloatingToolbar", () => ({
  FloatingToolbar: () => null,
}));

vi.mock("./Plate/SlashMenu", () => ({
  SlashMenu: () => null,
}));

vi.mock("./VersionHistory", () => ({
  VersionHistory: () => null,
}));

const mockUseAuthenticatedQuery = useAuthenticatedQuery as Mock;
const mockUseAuthenticatedMutation = useAuthenticatedMutation as Mock;
const mockPlate = vi.mocked(Plate);
const mockUsePlateEditor = vi.mocked(usePlateEditor);
const mockGetEditorPlugins = vi.mocked(getEditorPlugins);
const mockGetInitialValue = vi.mocked(getInitialValue);
const mockIsEmptyValue = vi.mocked(isEmptyValue);
const mockProseMirrorSnapshotToValue = vi.mocked(proseMirrorSnapshotToValue);
const mockMarkdownToValue = vi.mocked(markdownToValue);
const mockReadMarkdownForPreview = vi.mocked(readMarkdownForPreview);
const mockShowSuccess = vi.mocked(showSuccess);
const mockMutate = vi.fn();

const documentId = "document-1" as Id<"documents">;
const initialValue: Value = [{ type: "p", children: [{ text: "" }] }];
const importedValue: Value = [{ type: "p", children: [{ text: "Imported content" }] }];
const loadedDocument = {
  _id: documentId,
  _creationTime: Date.now(),
  title: "Spec",
  updatedAt: Date.now(),
  creatorName: "Alex",
  isOwner: true,
  isPublic: false,
  projectId: "project-1",
  organizationId: "org-1",
} as const;

function mockQueryResults(results: readonly unknown[]) {
  let index = 0;
  mockUseAuthenticatedQuery.mockImplementation(() => {
    const value = index < results.length ? results[index] : results[results.length - 1];
    index += 1;
    return value;
  });
}

describe("PlateEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({ mutate: mockMutate });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    mockPlate.mockImplementation(({ children }: PropsWithChildren) => <>{children}</>);
    mockUsePlateEditor.mockReturnValue({ id: "mock-editor" } as NonNullable<
      ReturnType<typeof usePlateEditor>
    >);
    mockGetEditorPlugins.mockReturnValue([]);
    mockGetInitialValue.mockReturnValue(initialValue);
    mockIsEmptyValue.mockReturnValue(false);
    mockProseMirrorSnapshotToValue.mockReturnValue(initialValue);
    mockMarkdownToValue.mockReturnValue(importedValue);
    mockReadMarkdownForPreview.mockResolvedValue(null);
  });

  it("renders the loading state while document data is unresolved", () => {
    mockQueryResults([undefined, undefined, undefined, undefined, undefined, undefined, undefined]);

    const { container } = render(<PlateEditor documentId={documentId} />);

    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Document Not Found")).not.toBeInTheDocument();
  });

  it("renders the blank-document starter panel when the editor value is empty", () => {
    mockIsEmptyValue.mockReturnValue(true);
    mockQueryResults([loadedDocument, false, false, undefined, "user-1", 0, []]);

    render(<PlateEditor documentId={documentId} />);

    expect(screen.getByText("Blank document")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start with the handoff context, then turn the note into operational follow-up.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Capture the context")).toBeInTheDocument();
    expect(screen.getByText("Turn notes into action")).toBeInTheDocument();
    expect(screen.getByText("Keep the trail visible")).toBeInTheDocument();
  });

  it("renders an empty state when the user session cannot be loaded", () => {
    mockQueryResults([{ _id: documentId, title: "Spec" }, false, false, undefined, null, 0, []]);

    render(<PlateEditor documentId={documentId} />);

    expect(screen.getByRole("heading", { name: "Unable to load user data" })).toBeInTheDocument();
    expect(
      screen.getByText("There was a problem loading your editor session."),
    ).toBeInTheDocument();
  });

  it("renders a not-found state and wires the back action when the document is missing", async () => {
    const user = userEvent.setup();
    const historyBackSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});

    mockQueryResults([null, false, false, undefined, "user-1", 0, []]);

    render(<PlateEditor documentId={documentId} />);

    expect(screen.getByRole("heading", { name: "Document Not Found" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(historyBackSpy).toHaveBeenCalledOnce();
  });

  it("opens the markdown import preview and applies the imported content on confirm", async () => {
    const user = userEvent.setup();
    const preview = {
      markdown: "# Imported\n\n- Bullet",
      filename: "import.md",
    };
    mockReadMarkdownForPreview.mockResolvedValue(preview);
    mockQueryResults([loadedDocument, false, false, undefined, "user-1", 0, []]);

    render(<PlateEditor documentId={documentId} />);

    await user.click(screen.getByRole("button", { name: "Import markdown" }));

    expect(await screen.findByText("Preview Markdown Import")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Import & Replace Content" }));

    await waitFor(() => {
      expect(mockMarkdownToValue).toHaveBeenCalledWith(preview.markdown);
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Imported import.md");
    await waitFor(() => {
      expect(screen.queryByText("Preview Markdown Import")).not.toBeInTheDocument();
    });
  });

  it("replaces the editor value when the e2e markdown event is dispatched", async () => {
    mockQueryResults([loadedDocument, false, false, undefined, "user-1", 0, []]);

    render(<PlateEditor documentId={documentId} />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("nixelo:e2e-set-editor-markdown", {
          detail: { markdown: "# Release Readiness\n\n- Ship it" },
        }),
      );
    });

    await waitFor(() => {
      expect(mockMarkdownToValue).toHaveBeenCalledWith("# Release Readiness\n\n- Ship it");
    });
  });

  it("accepts a direct e2e editor value event without reparsing markdown", async () => {
    mockQueryResults([loadedDocument, false, false, undefined, "user-1", 0, []]);

    render(<PlateEditor documentId={documentId} />);
    const markdownCallCount = mockMarkdownToValue.mock.calls.length;

    act(() => {
      window.dispatchEvent(
        new CustomEvent("nixelo:e2e-set-editor-value", {
          detail: {
            value: [{ type: "paragraph", children: [{ text: "Injected state" }] }],
          },
        }),
      );
    });

    await waitFor(() => {
      expect(mockMarkdownToValue).toHaveBeenCalledTimes(markdownCallCount);
    });
  });
});
