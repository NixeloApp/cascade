import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { render, screen, waitFor } from "@/test/custom-render";
import { NotificationsPage } from "./notifications";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
  useAuthReady: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganizationOptional: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description?: string;
    actions?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
      <div>{actions}</div>
    </div>
  ),
  PageContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Notifications", () => ({
  NotificationItem: ({
    notification,
    onSnooze,
  }: {
    notification: { _id: Id<"notifications">; title: string };
    onSnooze?: (id: Id<"notifications">, snoozedUntil: number) => void;
  }) => (
    <div>
      <div>{notification.title}</div>
      {onSnooze ? (
        <button type="button" onClick={() => onSnooze(notification._id, 1_234)}>
          Snooze notification
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    value,
    onClick,
  }: {
    children: ReactNode;
    value: string;
    onClick?: () => void;
  }) => (
    <button type="button" data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthReady = vi.mocked(useAuthReady);
const mockUseOrganizationOptional = vi.mocked(useOrganizationOptional);

describe("NotificationsPage", () => {
  const mockMarkAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockMarkAllAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockArchive = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockUnarchive = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockArchiveAll = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockSnooze = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });
  const mockRemove = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    let mutationIndex = 0;
    const mutations = [
      mockMarkAsRead,
      mockMarkAllAsRead,
      mockArchive,
      mockUnarchive,
      mockArchiveAll,
      mockSnooze,
      mockRemove,
    ];

    mockUseAuthenticatedMutation.mockImplementation(() => ({
      mutate: mutations[mutationIndex++] ?? vi.fn(),
      canAct: true,
      isAuthLoading: false,
    }));
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "notif-1" as Id<"notifications">,
          _creationTime: Date.now(),
          title: "Issue assigned",
          message: "You were assigned to DEMO-1",
          type: "issue_assigned",
          isRead: false,
          isArchived: false,
        },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUseAuthenticatedQuery.mockReturnValueOnce([]).mockReturnValueOnce(1);
    mockUseAuthReady.mockReturnValue({
      isAuthenticated: true,
      isAuthLoading: false,
      canAct: true,
    });
    mockUseOrganizationOptional.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
  });

  it("passes snooze handling to inbox notifications", async () => {
    const user = userEvent.setup();
    mockSnooze.mockResolvedValue(undefined);

    render(<NotificationsPage />);

    await user.click(screen.getByRole("button", { name: "Snooze notification" }));

    await waitFor(() => {
      expect(mockSnooze).toHaveBeenCalledWith({
        id: "notif-1",
        snoozedUntil: 1_234,
      });
    });
  });
});
