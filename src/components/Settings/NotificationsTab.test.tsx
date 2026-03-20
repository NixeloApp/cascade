import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ChangeEvent, ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { getVapidPublicKey, useWebPush } from "@/lib/webPush";
import { fireEvent, render, screen, waitFor, within } from "@/test/custom-render";
import { NotificationsTab } from "./NotificationsTab";

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

interface RadioGroupItemProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  value?: string;
  onClick?: () => void;
}

interface InputProps {
  label?: string;
  type?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/webPush", () => ({
  getVapidPublicKey: vi.fn(),
  useWebPush: vi.fn(),
}));

vi.mock("../ui/Switch", () => ({
  Switch: ({ checked = false, disabled = false, className, onCheckedChange }: SwitchProps) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={className}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));

vi.mock("../ui/RadioGroup", () => ({
  RadioGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  RadioGroupItem: ({
    label,
    description,
    disabled = false,
    value = "",
    onClick,
  }: RadioGroupItemProps) => (
    <label>
      <input type="radio" value={value} disabled={disabled} onClick={onClick} />
      <span>{label}</span>
      {description ? <span>{description}</span> : null}
    </label>
  ),
}));

vi.mock("../ui/form", () => ({
  Input: ({ label, type = "text", value, disabled = false, onChange }: InputProps) => (
    <label>
      <span>{label}</span>
      <input aria-label={label} type={type} value={value} disabled={disabled} onChange={onChange} />
    </label>
  ),
}));

vi.mock("../ui/Skeleton", () => ({
  SkeletonText: ({ lines }: { lines?: number }) => <div>{`Skeleton ${lines ?? 1}`}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);
const mockGetVapidPublicKey = vi.mocked(getVapidPublicKey);
const mockUseWebPush = vi.mocked(useWebPush);

const mockUpdatePreferences = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUpdatePushPreferences = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

const preferences = {
  emailEnabled: true,
  emailMentions: true,
  emailAssignments: false,
  emailComments: true,
  emailStatusChanges: false,
  emailDigest: "daily" as const,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

const pushPreferences = {
  pushMentions: true,
  pushAssignments: false,
  pushComments: true,
  pushStatusChanges: false,
};

describe("NotificationsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCallCount = 0;
    const mutationResults = [
      {
        mutate: mockUpdatePreferences,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockUpdatePushPreferences,
        canAct: true,
        isAuthLoading: false,
      },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCallCount % mutationResults.length];
      mutationCallCount += 1;
      return result;
    });
    let queryCallCount = 0;
    const queryResults = [preferences, pushPreferences];
    mockUseAuthenticatedQuery.mockImplementation(() => {
      const result = queryResults[queryCallCount % queryResults.length];
      queryCallCount += 1;
      return result;
    });
    mockGetVapidPublicKey.mockReturnValue("test-vapid-key");
    mockUseWebPush.mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      isLoading: false,
      permission: "granted",
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    });
  });

  it("renders loading placeholders while preferences are loading", () => {
    let queryCallCount = 0;
    const queryResults = [null, pushPreferences];
    mockUseAuthenticatedQuery.mockImplementation(() => {
      const result = queryResults[queryCallCount % queryResults.length];
      queryCallCount += 1;
      return result;
    });

    render(<NotificationsTab />);

    expect(screen.getByText("Skeleton 2")).toBeInTheDocument();
    expect(screen.getAllByText("Skeleton 1")).toHaveLength(3);
  });

  it("renders the push configuration warning when the VAPID key is missing", () => {
    mockGetVapidPublicKey.mockReturnValue(undefined);

    render(<NotificationsTab />);

    expect(
      screen.getByText(
        "Push notifications require server configuration. Contact your administrator.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enable" })).not.toBeInTheDocument();
  });

  it("renders a persistent warning when browser notification permission is denied", () => {
    mockUseWebPush.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      isLoading: false,
      permission: "denied",
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    });

    render(<NotificationsTab />);

    expect(screen.getByText("Browser notifications blocked")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Notification permission is denied for this site. Re-enable notifications in your browser settings to receive push alerts.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blocked" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Enable" })).not.toBeInTheDocument();
  });

  it("updates email and quiet-hours preferences", async () => {
    const user = userEvent.setup();
    mockUpdatePreferences.mockResolvedValue(undefined);

    render(<NotificationsTab />);

    const emailCard = screen.getByText("Email Notifications").closest("[class*='border']");
    if (!(emailCard instanceof HTMLElement)) {
      throw new Error("Email notification card not found");
    }

    await user.click(within(emailCard).getByRole("switch"));

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenNthCalledWith(1, {
        emailEnabled: false,
      }),
    );

    const notificationTypesCard = screen
      .getByText("Notification Types")
      .closest("[class*='border']");
    if (!(notificationTypesCard instanceof HTMLElement)) {
      throw new Error("Notification types card not found");
    }

    await user.click(within(notificationTypesCard).getAllByRole("switch")[0]);

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenNthCalledWith(2, {
        emailMentions: false,
      }),
    );

    const quietHoursCard = screen.getByText("Quiet Hours").closest("[class*='border']");
    if (!(quietHoursCard instanceof HTMLElement)) {
      throw new Error("Quiet hours card not found");
    }

    await user.click(within(quietHoursCard).getByRole("switch"));

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenNthCalledWith(3, {
        quietHoursEnabled: false,
      }),
    );

    fireEvent.change(within(quietHoursCard).getByLabelText("Start time"), {
      target: { value: "21:30" },
    });

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenNthCalledWith(4, {
        quietHoursStart: "21:30",
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Preferences updated");
    expect(mockShowSuccess).toHaveBeenCalledWith("Quiet hours updated");
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("updates digest and push notification preferences and can disable push", async () => {
    const user = userEvent.setup();
    mockUpdatePreferences.mockResolvedValue(undefined);
    mockUpdatePushPreferences.mockResolvedValue(undefined);
    mockUnsubscribe.mockResolvedValue(undefined);

    render(<NotificationsTab />);

    const digestCard = screen.getByText("Email Digests").closest("[class*='border']");
    if (!(digestCard instanceof HTMLElement)) {
      throw new Error("Digest card not found");
    }

    await user.click(within(digestCard).getByRole("radio", { name: /weekly digest/i }));

    await waitFor(() =>
      expect(mockUpdatePreferences).toHaveBeenCalledWith({
        emailDigest: "weekly",
      }),
    );

    const pushCard = screen.getByText("Push Notifications").closest("[class*='border']");
    if (!(pushCard instanceof HTMLElement)) {
      throw new Error("Push notifications card not found");
    }

    await user.click(within(pushCard).getAllByRole("switch")[1]);

    await waitFor(() =>
      expect(mockUpdatePushPreferences).toHaveBeenCalledWith({
        pushAssignments: true,
      }),
    );

    await user.click(within(pushCard).getByRole("button", { name: "Disable" }));

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith("Digest preference updated");
    expect(mockShowSuccess).toHaveBeenCalledWith("Push preferences updated");
  });
});
