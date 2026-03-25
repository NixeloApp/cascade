import type { Id } from "@convex/_generated/dataModel";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { OrgContext, type OrgContextType } from "@/hooks/useOrgContext";
import { renderHook } from "@/test/custom-render";
import { useSeededDocumentCreation } from "./useSeededDocumentCreation";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const createDocument = vi.fn();
const deleteDocument = vi.fn();
const createDocumentFromTemplate = vi.fn();
const submitSnapshot = vi.fn();

function asReactMutation<T extends typeof createDocument>(mutation: T) {
  return Object.assign(mutation, {
    withOptimisticUpdate: vi.fn().mockReturnValue(mutation),
  });
}

const organizationContext: OrgContextType = {
  organizationId: "org_1" as Id<"organizations">,
  orgSlug: "acme",
  organizationName: "Acme",
  userRole: "owner",
  billingEnabled: true,
};

describe("useSeededDocumentCreation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    let mutationHookCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationHookCallCount += 1;

      const mutate =
        mutationHookCallCount === 1
          ? asReactMutation(createDocument)
          : mutationHookCallCount === 2
            ? asReactMutation(deleteDocument)
            : mutationHookCallCount === 3
              ? asReactMutation(createDocumentFromTemplate)
              : asReactMutation(submitSnapshot);

      return { mutate, canAct: true, isAuthLoading: false };
    });
  });

  it("creates, seeds, and opens a document", async () => {
    createDocument.mockResolvedValue({ documentId: "doc_1" as Id<"documents"> });
    submitSnapshot.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSeededDocumentCreation(), {
      wrapper: ({ children }) => (
        <OrgContext.Provider value={organizationContext}>{children}</OrgContext.Provider>
      ),
    });

    await act(async () => {
      await result.current.createSeededDocumentAndOpen({
        title: "Weekly Notes",
        isPublic: false,
        projectId: "project_1" as Id<"projects">,
        value: [{ type: "h1", children: [{ text: "Weekly Notes" }] }],
      });
    });

    expect(createDocument).toHaveBeenCalledWith({
      title: "Weekly Notes",
      isPublic: false,
      organizationId: "org_1",
      projectId: "project_1",
    });
    expect(submitSnapshot).toHaveBeenCalledWith({
      id: "doc_1",
      version: 1,
      content: expect.any(String),
    });
    expect(JSON.parse(submitSnapshot.mock.calls[0]?.[0]?.content)).toEqual(
      expect.objectContaining({ type: "doc" }),
    );
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/$orgSlug/documents/$id",
      params: { orgSlug: "acme", id: "doc_1" },
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("cleans up created documents when template seeding fails", async () => {
    const failure = new Error("snapshot failed");
    createDocumentFromTemplate.mockResolvedValue({
      documentId: "doc_2" as Id<"documents">,
      templateContent: [
        {
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text", text: "Meeting Notes" }],
        },
      ],
    });
    submitSnapshot.mockRejectedValue(failure);

    const { result } = renderHook(() => useSeededDocumentCreation(), {
      wrapper: ({ children }) => (
        <OrgContext.Provider value={organizationContext}>{children}</OrgContext.Provider>
      ),
    });

    await act(async () => {
      await expect(
        result.current.createTemplateDocumentAndOpen({
          templateId: "template_1" as Id<"documentTemplates">,
          title: "Meeting Notes",
          isPublic: false,
          projectId: undefined,
        }),
      ).rejects.toThrow("snapshot failed");
    });

    expect(deleteDocument).toHaveBeenCalledWith({ id: "doc_2" });
    expect(result.current.error).toBe(failure);
  });
});
