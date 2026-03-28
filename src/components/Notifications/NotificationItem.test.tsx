import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { HOUR } from "@/lib/time";
import { render, screen, waitFor } from "@/test/custom-render";
import { NotificationItem } from "./NotificationItem";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    onClick,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    onClick?: () => void;
  }) => (
    <a
      href={`${to}:${JSON.stringify(params ?? {})}`}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({
    children,
    ...props
  }: {
    children: ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Metadata", () => ({
  Metadata: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MetadataItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MetadataTimestamp: ({ date }: { date: number }) => <time>{date}</time>,
}));

vi.mock("@/components/ui/Popover", async () => await import("@/test/__tests__/popoverMock"));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const markAsRead = vi.fn();
const archive = vi.fn();
const remove = vi.fn();
const snooze = vi.fn();

const notificationId = "notification_1" as Id<"notifications">;
const issueId = "issue_1" as Id<"issues">;
const documentId = "document_1" as Id<"documents">;

describe("NotificationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    mockUseAuthenticatedQuery.mockReturnValue({ key: "CORE-42" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an unread issue notification and marks it as read from the issue link", async () => {
    const user = userEvent.setup();

    render(
      <NotificationItem
        notification={{
          _id: notificationId,
          _creationTime: 1_700_000_000_000,
          userId: "user_1" as Id<"users">,
          type: "issue_assigned",
          title: "Assigned to CORE-42",
          message: "You were assigned the issue",
          issueId,
          documentId: undefined,
          actorId: "user_2" as Id<"users">,
          actorName: "Alex",
          isRead: false,
          isArchived: false,
          snoozedUntil: undefined,
        }}
        onMarkAsRead={markAsRead}
        onArchive={archive}
        onDelete={remove}
        orgSlug="acme"
      />,
    );

    expect(screen.getByText("Assigned to CORE-42")).toBeInTheDocument();
    expect(screen.getByText("You were assigned the issue")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.NOTIFICATION.ITEM)).not.toHaveAttribute(
      "data-notification-item",
    );

    await user.click(screen.getByRole("link", { name: /Assigned to CORE-42/i }));

    expect(markAsRead).toHaveBeenCalledWith(notificationId);
  });

  it("archives and deletes via the row action buttons", async () => {
    const user = userEvent.setup();

    render(
      <NotificationItem
        notification={{
          _id: notificationId,
          _creationTime: 1_700_000_000_000,
          userId: "user_1" as Id<"users">,
          type: "document_shared",
          title: "Document shared",
          message: "A spec was shared with you",
          issueId: undefined,
          documentId,
          actorId: undefined,
          actorName: undefined,
          isRead: true,
          isArchived: false,
          snoozedUntil: undefined,
        }}
        onMarkAsRead={markAsRead}
        onArchive={archive}
        onDelete={remove}
        orgSlug="acme"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Archive notification" }));
    await user.click(screen.getByRole("button", { name: "Delete notification" }));

    expect(archive).toHaveBeenCalledWith(notificationId);
    expect(remove).toHaveBeenCalledWith(notificationId);
    expect(markAsRead).not.toHaveBeenCalled();
  });

  it("keeps notification actions in a mobile footer row that flips to a desktop rail", () => {
    render(
      <NotificationItem
        notification={{
          _id: notificationId,
          _creationTime: 1_700_000_000_000,
          userId: "user_1" as Id<"users">,
          type: "document_shared",
          title: "Document shared",
          message: "A spec was shared with you",
          issueId: undefined,
          documentId,
          actorId: undefined,
          actorName: undefined,
          isRead: true,
          isArchived: false,
          snoozedUntil: undefined,
        }}
        onMarkAsRead={markAsRead}
        onArchive={archive}
        onDelete={remove}
        orgSlug="acme"
      />,
    );

    expect(screen.getByTestId(TEST_IDS.NOTIFICATION.ACTIONS)).toHaveClass(
      "flex",
      "items-center",
      "justify-end",
      "border-t",
      "pt-2",
      "sm:flex-col",
      "sm:items-end",
      "sm:border-t-0",
    );
  });

  it("snoozes using the selected duration and closes over the current time", async () => {
    const user = userEvent.setup();

    render(
      <NotificationItem
        notification={{
          _id: notificationId,
          _creationTime: 1_700_000_000_000,
          userId: "user_1" as Id<"users">,
          type: "issue_commented",
          title: "New comment",
          message: "There is a new comment on your issue",
          issueId,
          documentId: undefined,
          actorId: "user_2" as Id<"users">,
          actorName: "Morgan",
          isRead: true,
          isArchived: false,
          snoozedUntil: undefined,
        }}
        onMarkAsRead={markAsRead}
        onArchive={archive}
        onDelete={remove}
        onSnooze={snooze}
        orgSlug="acme"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Snooze notification" }));
    await user.click(screen.getByRole("button", { name: "3 hours" }));

    await waitFor(() =>
      expect(snooze).toHaveBeenCalledWith(notificationId, 1_700_000_000_000 + 3 * HOUR),
    );
  });
});
