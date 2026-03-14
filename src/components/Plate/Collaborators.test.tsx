import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, renderHook, screen, waitFor } from "@/test/custom-render";
import { Collaborators, useCollaboratorCount } from "./Collaborators";

const { managers, getUserColorMock } = vi.hoisted(() => ({
  managers: [] as Array<{
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    emit: (users: Array<unknown>) => void;
    user: { name: string; image?: string } | undefined;
  }>,
  getUserColorMock: vi.fn((userId: string) => ({
    main: `color-${userId}`,
    light: `light-${userId}`,
  })),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/components/ui/Avatar", () => ({
  Avatar: ({
    name,
    src,
    style,
    indicatorColor,
  }: {
    name: string;
    src?: string;
    style?: { borderColor?: string };
    indicatorColor?: string;
  }) => (
    <div
      data-testid="collaborator-avatar"
      data-name={name}
      data-src={src ?? ""}
      data-border-color={style?.borderColor ?? ""}
      data-indicator-color={indicatorColor ?? ""}
    >
      {name}
    </div>
  ),
  AvatarGroup: ({
    children,
    max,
    className,
    overflowTooltipContent,
  }: {
    children: ReactNode;
    max: number;
    className?: string;
    overflowTooltipContent?: string;
  }) => (
    <div
      data-testid="avatar-group"
      data-max={String(max)}
      data-class-name={className ?? ""}
      data-overflow-tooltip-content={overflowTooltipContent ?? ""}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) => (
    <div>
      {children}
      <div>{content}</div>
    </div>
  ),
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/lib/yjs/awareness", () => ({
  createAwarenessManager: vi.fn((documentId: string, user?: { name: string; image?: string }) => {
    let listener: ((users: Array<unknown>) => void) | undefined;
    const manager = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onUpdate: vi.fn((callback: (users: Array<unknown>) => void) => {
        listener = callback;
        return () => {
          listener = undefined;
        };
      }),
      emit(users: Array<unknown>) {
        listener?.(users);
      },
      documentId,
      user,
    };
    managers.push(manager);
    return manager;
  }),
  getUserColor: getUserColorMock,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

describe("Collaborators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    managers.length = 0;
  });

  it("renders nothing when there is no current user", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    const { container } = render(<Collaborators documentId={"doc_1" as never} />);

    expect(container).toBeEmptyDOMElement();
    expect(managers).toHaveLength(0);
  });

  it("renders non-current collaborators with overflow metadata and fallback colors", async () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      _id: "user_1",
      name: "Alex Rivera",
      image: "alex.png",
    });

    render(<Collaborators documentId={"doc_1" as never} maxVisible={2} className="top-right" />);

    expect(managers).toHaveLength(1);
    expect(managers[0].connect).toHaveBeenCalledTimes(1);
    expect(managers[0].user).toEqual({
      name: "Alex Rivera",
      image: "alex.png",
    });

    act(() => {
      managers[0].emit([
        {
          userId: "self",
          isCurrentUser: true,
          user: { name: "Alex Rivera", image: "alex.png", color: "self-color" },
        },
        {
          userId: "sam",
          isCurrentUser: false,
          user: { name: "Sam Lee", image: "sam.png", color: "teal" },
        },
        {
          userId: "pat",
          isCurrentUser: false,
          user: undefined,
        },
        {
          userId: "jo",
          isCurrentUser: false,
          user: { name: "Jo Kim", image: undefined, color: "violet" },
        },
      ]);
    });

    await waitFor(() => expect(screen.getAllByTestId("collaborator-avatar")).toHaveLength(3));

    expect(screen.getByTestId("avatar-group")).toHaveAttribute("data-max", "2");
    expect(screen.getByTestId("avatar-group")).toHaveAttribute("data-class-name", "top-right");
    expect(screen.getByTestId("avatar-group")).toHaveAttribute(
      "data-overflow-tooltip-content",
      "1 more collaborator",
    );

    expect(screen.getAllByText("Sam Lee")).toHaveLength(2);
    expect(screen.getAllByText("Currently editing")).toHaveLength(3);
    expect(screen.getAllByText("Anonymous")).toHaveLength(2);
    expect(getUserColorMock).toHaveBeenCalledWith("pat");

    const avatars = screen.getAllByTestId("collaborator-avatar");
    expect(avatars[0]).toHaveAttribute("data-border-color", "teal");
    expect(avatars[0]).toHaveAttribute("data-indicator-color", "teal");
    expect(avatars[1]).toHaveAttribute("data-border-color", "color-pat");
    expect(avatars[1]).toHaveAttribute("data-indicator-color", "color-pat");
  });

  it("tracks collaborator count updates and disconnects on unmount", async () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      _id: "user_1",
      name: "Alex Rivera",
      image: "alex.png",
    });

    const { result, unmount } = renderHook(() => useCollaboratorCount("doc_2" as never));

    expect(result.current).toBe(0);
    expect(managers).toHaveLength(1);
    expect(managers[0].connect).toHaveBeenCalledTimes(1);

    act(() => {
      managers[0].emit([
        { userId: "self", isCurrentUser: true },
        { userId: "sam", isCurrentUser: false },
        { userId: "pat", isCurrentUser: false },
      ]);
    });

    await waitFor(() => expect(result.current).toBe(2));

    unmount();

    expect(managers[0].disconnect).toHaveBeenCalledTimes(1);
  });
});
