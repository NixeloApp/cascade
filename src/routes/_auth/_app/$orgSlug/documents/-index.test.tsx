import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, waitFor } from "@/test/custom-render";
import {
  DocumentsListPage,
  filterDocumentsForWorkspace,
  getDocumentsWorkspaceOverview,
} from "./index";

const mockNavigate = vi.fn();
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();
const mockDocumentTree = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    className,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => (
    <a href={`${to}${params ? `?${JSON.stringify(params)}` : ""}`} className={className}>
      {children}
    </a>
  ),
  createFileRoute: () => () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/components/Documents/DocumentTree", () => ({
  DocumentTree: (props: unknown) => {
    mockDocumentTree(props);
    return <div>DocumentTree</div>;
  },
}));

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => mockShowError(...args),
  showSuccess: (...args: unknown[]) => mockShowSuccess(...args),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

function createDocument(
  overrides: Partial<Parameters<typeof filterDocumentsForWorkspace>[0][number]> = {},
) {
  return {
    _id: "doc-1" as Id<"documents">,
    title: "Project Requirements",
    isPublic: false,
    creatorName: "Emily Chen",
    updatedAt: 1_000,
    ...overrides,
  };
}

describe("DocumentsListPage", () => {
  const mockCreateDocument = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org-1" as Id<"organizations">,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery.mockReturnValue({
      documents: [
        createDocument(),
        createDocument({
          _id: "doc-2" as Id<"documents">,
          title: "Sprint Retrospective",
          creatorName: "Alex Morgan",
          isPublic: true,
          updatedAt: 2_000,
        }),
      ],
      nextCursor: null,
      hasMore: false,
    });

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: Object.assign(mockCreateDocument, {
        withOptimisticUpdate: vi.fn().mockReturnValue(mockCreateDocument),
      }),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders the documents workspace with search and library index", () => {
    render(<DocumentsListPage />);

    expect(screen.getByText("Document workspace")).toBeInTheDocument();
    expect(screen.getByText("Recent documents")).toBeInTheDocument();
    expect(screen.getByText("Library index")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search documents" })).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("1 private")).toBeInTheDocument();
    expect(screen.getByText("1 shared")).toBeInTheDocument();
    expect(mockDocumentTree).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        orgSlug: "acme",
      }),
    );
  });

  it("renders stable screenshot hooks and the search empty state", async () => {
    const user = userEvent.setup();

    render(<DocumentsListPage />);

    expect(screen.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_SUMMARY)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_TEMPLATES_PANEL)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_RECENT_SECTION)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_LIBRARY_SECTION)).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "missing");

    expect(screen.getByTestId(TEST_IDS.DOCUMENT.SEARCH_EMPTY_STATE)).toBeInTheDocument();
  });

  it("filters recent documents by title or creator", async () => {
    const user = userEvent.setup();

    render(<DocumentsListPage />);

    const search = screen.getByRole("searchbox", { name: "Search documents" });
    await user.type(search, "alex");

    expect(screen.getAllByText("Sprint Retrospective")).toHaveLength(2);
    expect(screen.queryAllByText("Project Requirements")).toHaveLength(0);
    expect(screen.getByText("1 result")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "missing");

    expect(screen.getByText("No documents match this search")).toBeInTheDocument();
  });

  it("creates a blank document from the page header and navigates to it", async () => {
    const user = userEvent.setup();
    mockCreateDocument.mockResolvedValue({ documentId: "doc-new" as Id<"documents"> });

    render(<DocumentsListPage />);

    await user.click(screen.getByRole("button", { name: "New Document" }));

    await waitFor(() => {
      expect(mockCreateDocument).toHaveBeenCalledWith({
        title: "Untitled Document",
        isPublic: false,
        organizationId: "org-1",
        parentId: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/$orgSlug/documents/$id",
        params: { orgSlug: "acme", id: "doc-new" },
      });
      expect(mockShowSuccess).toHaveBeenCalledWith("Document created");
    });
  });

  it("surfaces document creation errors", async () => {
    const user = userEvent.setup();
    const error = new Error("boom");
    mockCreateDocument.mockRejectedValue(error);

    render(<DocumentsListPage />);

    await user.click(screen.getByRole("button", { name: "New Document" }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create document");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

describe("documents workspace helpers", () => {
  it("filters by trimmed title or creator query", () => {
    const documents = [
      createDocument(),
      createDocument({
        _id: "doc-2" as Id<"documents">,
        title: "Team Notes",
        creatorName: "Alex Morgan",
      }),
    ];

    expect(filterDocumentsForWorkspace(documents, "  alex ")).toEqual([documents[1]]);
    expect(filterDocumentsForWorkspace(documents, "requirements")).toEqual([documents[0]]);
  });

  it("builds shared, private, contributor, and latest-document summary", () => {
    const documents = [
      createDocument({ updatedAt: 1_000 }),
      createDocument({
        _id: "doc-2" as Id<"documents">,
        creatorName: "Alex Morgan",
        isPublic: true,
        updatedAt: 2_000,
      }),
      createDocument({
        _id: "doc-3" as Id<"documents">,
        creatorName: "Emily Chen",
        updatedAt: 500,
      }),
    ];

    expect(getDocumentsWorkspaceOverview(documents)).toEqual({
      totalCount: 3,
      sharedCount: 1,
      privateCount: 2,
      creatorCount: 2,
      latestDocument: documents[1],
    });
  });
});
