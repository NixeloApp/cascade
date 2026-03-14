import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { PlateEditor } from "./PlateEditor";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("./Documents", () => ({
  DocumentHeader: () => null,
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
const mockMutate = vi.fn();

const documentId = "document-1" as Id<"documents">;

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
  });

  it("renders the loading state while document data is unresolved", () => {
    mockQueryResults([undefined, undefined, undefined, undefined, undefined, undefined, undefined]);

    const { container } = render(<PlateEditor documentId={documentId} />);

    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Document Not Found")).not.toBeInTheDocument();
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
});
