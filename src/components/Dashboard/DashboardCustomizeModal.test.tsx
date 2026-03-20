import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen, waitFor } from "@/test/custom-render";
import { DashboardCustomizeModal } from "./DashboardCustomizeModal";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("../ui/Switch", () => ({
  Switch: ({ checked = false, onCheckedChange }: SwitchProps) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ title, children, open }: { title: string; children: ReactNode; open: boolean }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const mockUpdateSettings = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

describe("DashboardCustomizeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedQuery.mockReturnValue(undefined);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockUpdateSettings,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("opens with persisted dashboard layout preferences from user settings", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue({
      dashboardLayout: {
        showStats: false,
        showRecentActivity: true,
        showWorkspaces: false,
      },
    });

    render(<DashboardCustomizeModal />);

    expect(screen.getByRole("button", { name: /Customize/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Dashboard Customization" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Customize/i }));

    expect(screen.getByRole("dialog", { name: "Dashboard Customization" })).toBeInTheDocument();
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(3);
    expect(switches[0]).toHaveAttribute("aria-checked", "false");
    expect(switches[1]).toHaveAttribute("aria-checked", "true");
    expect(switches[2]).toHaveAttribute("aria-checked", "false");
  });

  it("persists a toggled preference", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue(undefined);

    render(<DashboardCustomizeModal />);
    await user.click(screen.getByRole("button", { name: /Customize/i }));

    const [showStatsSwitch] = screen.getAllByRole("switch");
    await user.click(showStatsSwitch);

    await waitFor(() =>
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        dashboardLayout: {
          showStats: false,
          showRecentActivity: true,
          showWorkspaces: true,
        },
      }),
    );
  });

  it("reverts the optimistic toggle when the settings mutation fails", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockRejectedValue(new Error("save failed"));

    render(<DashboardCustomizeModal />);
    await user.click(screen.getByRole("button", { name: /Customize/i }));

    const [showStatsSwitch] = screen.getAllByRole("switch");
    expect(showStatsSwitch).toHaveAttribute("aria-checked", "true");

    await user.click(showStatsSwitch);

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(showStatsSwitch).toHaveAttribute("aria-checked", "true"));
  });
});
