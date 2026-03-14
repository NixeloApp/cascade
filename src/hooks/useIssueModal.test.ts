import { useLocation, useRouter } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import { useIssueModal, validateIssueSearch } from "./useIssueModal";

vi.mock("@tanstack/react-router", () => ({
  useLocation: vi.fn(),
  useRouter: vi.fn(),
}));

const mockUseLocation = vi.mocked(useLocation);
const mockUseRouter = vi.mocked(useRouter);

const push = vi.fn();
const replace = vi.fn();
const locationState = {};

function mockLocation(search: string) {
  mockUseLocation.mockReturnValue({
    href: `/workspace/issues${search}#details`,
    hash: "#details",
    pathname: "/workspace/issues",
    publicHref: `/workspace/issues${search}#details`,
    searchStr: search,
    search,
    state: locationState,
    external: false,
  } as ReturnType<typeof useLocation>);
}

describe("useIssueModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      history: {
        push,
        replace,
      },
    } as ReturnType<typeof useRouter>);
  });

  it("reads the issue key from search params and exposes the open state", () => {
    mockLocation("?view=list&issue=ENG-42");

    const { result } = renderHook(() => useIssueModal());

    expect(result.current.issueKey).toBe("ENG-42");
    expect(result.current.isOpen).toBe(true);
  });

  it("pushes a new url when opening an issue and preserves existing params plus hash", () => {
    mockLocation("?view=list");

    const { result } = renderHook(() => useIssueModal());

    act(() => {
      result.current.openIssue("BUG-7");
    });

    expect(push).toHaveBeenCalledWith(
      "/workspace/issues?view=list&issue=BUG-7#details",
      locationState,
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces the url when closing an issue and removes only the issue param", () => {
    mockLocation("?view=list&issue=BUG-7");

    const { result } = renderHook(() => useIssueModal());

    act(() => {
      result.current.closeIssue();
    });

    expect(replace).toHaveBeenCalledWith("/workspace/issues?view=list#details", locationState);
    expect(push).not.toHaveBeenCalled();
  });

  it("normalizes issue search values to strings only", () => {
    expect(validateIssueSearch({ issue: "ENG-42" })).toEqual({ issue: "ENG-42" });
    expect(validateIssueSearch({ issue: 123 })).toEqual({ issue: undefined });
    expect(validateIssueSearch({})).toEqual({ issue: undefined });
  });
});
