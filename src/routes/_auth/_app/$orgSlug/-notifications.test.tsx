import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import { createContext, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQueuedOfflineNotificationReadIds } from "@/hooks/useOfflineOptimisticState";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { SECOND } from "@/lib/time";
import { render, screen, waitFor } from "@/test/custom-render";
import { NotificationsPage } from "./notifications";

declare global {
  interface Window {
    __NIXELO_E2E_NOTIFICATIONS_LOADING__?: boolean;
  }
}

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

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useOfflineOptimisticState", () => ({
  useQueuedOfflineNotificationReadIds: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({
    children,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "data-testid"?: string;
  }) => <div data-testid={testId}>{children}</div>,
  PageStack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControls: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControlsRow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControlsGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
    notification: { _id: Id<"notifications">; title: string; isRead: boolean };
    onSnooze?: (id: Id<"notifications">, snoozedUntil: number) => void;
  }) => (
    <div>
      <div>{notification.title}</div>
      <div>{notification.isRead ? "Read" : "Unread"}</div>
      {onSnooze ? (
        <button type="button" onClick={() => onSnooze(notification._id, 1_234)}>
          Snooze notification
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    disabled,
    isLoading,
    onClick,
    "data-testid": testId,
  }: {
    children: ReactNode;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
    "data-testid"?: string;
  }) => (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({
    action,
    description,
    title,
    "data-testid": testId,
  }: {
    action?: { label: string; onClick: () => void };
    description?: string;
    title: string;
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: () => null,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const TabsContext = createContext<{
  onValueChange: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("@/components/ui/Tabs", () => ({
  Tabs: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
    value: string;
  }) => (
    <div>
      <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>
    </div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children: ReactNode; value: string }) => {
    const tabs = useContext(TabsContext);
    if (!tabs) return null;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={tabs.value === value}
        onClick={() => tabs.onValueChange(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({ children, value }: { children: ReactNode; value: string }) => {
    const tabs = useContext(TabsContext);
    if (!tabs || tabs.value !== value) {
      return null;
    }

    return <div>{children}</div>;
  },
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
const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseQueuedOfflineNotificationReadIds = vi.mocked(useQueuedOfflineNotificationReadIds);
const mockUseOrganizationOptional = vi.mocked(useOrganizationOptional);

type MockNotification = {
  _id: Id<"notifications">;
  _creationTime: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isArchived: boolean;
};

const inboxNotification: MockNotification = {
  _id: "notif-1" as Id<"notifications">,
  _creationTime: Date.now(),
  title: "Issue assigned",
  message: "You were assigned to DEMO-1",
  type: "issue_assigned",
  isRead: false,
  isArchived: false,
};

const archivedNotification: MockNotification = {
  _id: "notif-2" as Id<"notifications">,
  _creationTime: Date.now() - SECOND,
  title: "Archived status update",
  message: "DEMO-2 moved to done",
  type: "issue_status_changed",
  isRead: true,
  isArchived: true,
};

function mockUnreadQueries(args: {
  unreadCount: number | undefined;
  unreadHasMore?: boolean;
  unreadIds?: Id<"notifications">[];
}) {
  let authenticatedQueryCallCount = 0;
  mockUseAuthenticatedQuery.mockImplementation(() => {
    authenticatedQueryCallCount += 1;
    if (authenticatedQueryCallCount % 2 === 1) {
      return args.unreadCount;
    }

    return {
      ids: args.unreadIds ?? [],
      hasMore: args.unreadHasMore ?? false,
    };
  });
}

function mockNotificationQueries({
  archived = [archivedNotification],
  archivedStatus = "Exhausted",
  inbox = [inboxNotification],
}: {
  archived?: MockNotification[];
  archivedStatus?: "CanLoadMore" | "Exhausted";
  inbox?: MockNotification[];
} = {}) {
  let callIndex = 0;
  const loadMore = vi.fn();

  mockUsePaginatedQuery.mockImplementation((_, _args) => {
    callIndex += 1;
    const isInboxQuery = callIndex % 2 === 1;

    if (isInboxQuery) {
      return {
        results: inbox,
        status: "Exhausted",
        isLoading: false,
        loadMore,
      };
    }

    return {
      results: archived,
      status: archivedStatus,
      isLoading: false,
      loadMore,
    };
  });
}

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
    delete window.__NIXELO_E2E_NOTIFICATIONS_LOADING__;
    window.sessionStorage.clear();

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
    mockNotificationQueries();
    mockUnreadQueries({ unreadCount: 1, unreadIds: [inboxNotification._id] });
    mockUseAuthReady.mockReturnValue({
      isAuthenticated: true,
      isAuthLoading: false,
      canAct: true,
    });
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: true,
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set());
    mockUseOrganizationOptional.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
  });

  it("applies queued offline reads to the unread summary immediately", () => {
    mockUnreadQueries({
      unreadCount: 2,
      unreadIds: [inboxNotification._id, "notif-queued" as Id<"notifications">],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set([inboxNotification._id]));

    render(<NotificationsPage />);

    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE)).toHaveTextContent("1");
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

  it("clears the active filter from the empty inbox state", async () => {
    let callIndex = 0;
    mockUsePaginatedQuery.mockImplementation((_, args) => {
      callIndex += 1;
      const isInboxQuery = callIndex % 2 === 1;

      if (isInboxQuery) {
        const filtered =
          typeof args === "object" && args !== null && "types" in args && Array.isArray(args.types)
            ? []
            : [inboxNotification];
        return {
          results: filtered,
          status: "Exhausted",
          isLoading: false,
          loadMore: vi.fn(),
        };
      }

      return {
        results: [],
        status: "Exhausted",
        isLoading: false,
        loadMore: vi.fn(),
      };
    });

    const user = userEvent.setup();
    render(<NotificationsPage />);

    await user.click(screen.getByRole("button", { name: /^mentions$/i }));

    expect(await screen.findByTestId(TEST_IDS.NOTIFICATIONS.INBOX_EMPTY_STATE)).toHaveTextContent(
      "No matching notifications",
    );

    await user.click(screen.getByRole("button", { name: /clear filter/i }));

    expect(await screen.findByText("Issue assigned")).toBeInTheDocument();
  });

  it("offers archived recovery when the inbox is empty but archived items exist", async () => {
    const user = userEvent.setup();
    mockNotificationQueries({
      inbox: [],
      archived: [archivedNotification],
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });

    render(<NotificationsPage />);

    expect(await screen.findByTestId(TEST_IDS.NOTIFICATIONS.INBOX_EMPTY_STATE)).toHaveTextContent(
      "You're all caught up",
    );
    expect(screen.getByRole("button", { name: /view archived/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view archived/i }));

    expect(await screen.findByText("Archived status update")).toBeInTheDocument();
  });

  it("renders the archived empty state with an inbox recovery action", async () => {
    const user = userEvent.setup();
    mockNotificationQueries({
      inbox: [inboxNotification],
      archived: [],
    });

    render(<NotificationsPage />);

    await user.click(screen.getByRole("tab", { name: /archived/i }));

    expect(
      await screen.findByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVED_EMPTY_STATE),
    ).toHaveTextContent("No archived notifications");
    expect(screen.getByRole("button", { name: /view inbox/i })).toBeInTheDocument();
  });

  it("honors the archived-tab E2E override on first render", async () => {
    window.sessionStorage.setItem("nixelo:e2e:notifications-state", "archived-tab");
    mockNotificationQueries({
      inbox: [inboxNotification],
      archived: [],
    });

    render(<NotificationsPage />);

    expect(
      await screen.findByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVED_EMPTY_STATE),
    ).toBeInTheDocument();
  });

  it("caps the unread badge at 99+ while preserving the header count", () => {
    mockUnreadQueries({ unreadCount: 100, unreadIds: [inboxNotification._id] });

    render(<NotificationsPage />);

    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE)).toHaveTextContent("99+");
    expect(screen.getByText("100 unread notifications")).toBeInTheDocument();
  });

  it("forces the mark-all-read loading state when the E2E override is enabled", () => {
    window.__NIXELO_E2E_NOTIFICATIONS_LOADING__ = true;
    mockUnreadQueries({ unreadCount: 3, unreadIds: [inboxNotification._id] });

    render(<NotificationsPage />);

    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.MARK_ALL_READ_BUTTON)).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.MARK_ALL_READ_BUTTON)).toBeDisabled();
  });
  it("does not subtract archived queued reads from the inbox badge", () => {
    mockUnreadQueries({ unreadCount: 1, unreadIds: [inboxNotification._id] });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set([archivedNotification._id]));

    render(<NotificationsPage />);

    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE)).toHaveTextContent("1");
  });

  it("subtracts queued reads for unread inbox items outside the current filter or page", () => {
    mockUnreadQueries({
      unreadCount: 2,
      unreadIds: [inboxNotification._id, "notif-off-page" as Id<"notifications">],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(
      new Set(["notif-off-page" as Id<"notifications">]),
    );

    render(<NotificationsPage />);

    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE)).toHaveTextContent("1");
  });

  it("does not subtract queued reads when the unread id list is truncated", () => {
    mockUnreadQueries({
      unreadCount: 100,
      unreadHasMore: true,
      unreadIds: [inboxNotification._id],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set([inboxNotification._id]));

    render(<NotificationsPage />);

    expect(screen.getByText("100 unread notifications")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE)).toHaveTextContent("99+");
  });

  it("applies queued read projection to archived rows", async () => {
    const user = userEvent.setup();
    mockNotificationQueries({
      archived: [{ ...archivedNotification, isRead: false }],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set([archivedNotification._id]));

    render(<NotificationsPage />);

    await user.click(screen.getByRole("tab", { name: /archived/i }));

    expect(await screen.findByText("Archived status update")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
  });
});
