import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { TwoFactorSettings } from "./TwoFactorSettings";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div>{`QR:${value}`}</div>,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title, description, children, footer }: DialogProps) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {description ? <div>{description}</div> : null}
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: ({ size }: { size?: string }) => <div>{`Loading ${size ?? "md"}`}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockBeginSetup = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockCompleteSetup = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockDisable = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockRegenerateBackupCodes = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const disabledStatus = {
  enabled: false,
  hasBackupCodes: false,
};

const enabledStatus = {
  enabled: true,
  hasBackupCodes: true,
};

describe("TwoFactorSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCallCount = 0;
    const mutationResults = [
      {
        mutate: mockBeginSetup,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockCompleteSetup,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockDisable,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockRegenerateBackupCodes,
        canAct: true,
        isAuthLoading: false,
      },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCallCount % mutationResults.length];
      mutationCallCount += 1;
      return result;
    });
  });

  it("renders a loading state while status is unresolved", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<TwoFactorSettings />);

    expect(screen.getByText("Loading md")).toBeInTheDocument();
    expect(screen.queryByText("Two-Factor Authentication")).not.toBeInTheDocument();
  });

  it("completes the setup flow and copies backup codes", async () => {
    const user = userEvent.setup();
    const clipboardWriteText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    mockUseAuthenticatedQuery.mockReturnValue(disabledStatus);
    mockBeginSetup.mockResolvedValue({
      secret: "ABCDEF123456",
      otpauthUrl: "otpauth://totp/Nixelo:test@example.com?secret=ABCDEF123456",
    });
    mockCompleteSetup.mockResolvedValue({
      success: true,
      backupCodes: ["ABCD-EFGH", "IJKL-MNOP"],
    });

    render(<TwoFactorSettings />);

    await user.click(screen.getByRole("button", { name: "Enable 2FA" }));

    await waitFor(() => expect(mockBeginSetup).toHaveBeenCalled());

    expect(screen.getByText("Set Up Two-Factor Authentication")).toBeInTheDocument();
    expect(
      screen.getByText("QR:otpauth://totp/Nixelo:test@example.com?secret=ABCDEF123456"),
    ).toBeInTheDocument();
    expect(screen.getByText("ABCDEF123456")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(mockCompleteSetup).toHaveBeenCalledWith({
        code: "123456",
      }),
    );

    expect(await screen.findByText("Save Your Backup Codes")).toBeInTheDocument();
    expect(screen.getByText("ABCD-EFGH")).toBeInTheDocument();
    expect(screen.getByText("IJKL-MNOP")).toBeInTheDocument();
    expect(mockShowSuccess).toHaveBeenCalledWith("2FA enabled successfully!");

    await user.click(screen.getByRole("button", { name: "Copy Codes" }));

    await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledWith("ABCD-EFGH\nIJKL-MNOP"));
    expect(mockShowSuccess).toHaveBeenCalledWith("Backup codes copied to clipboard");

    await user.click(screen.getByRole("button", { name: "I've Saved My Codes" }));

    expect(screen.getByRole("button", { name: "Enable 2FA" })).toBeInTheDocument();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("disables 2FA using a backup code", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue(enabledStatus);
    mockDisable.mockResolvedValue({ success: true });

    render(<TwoFactorSettings />);

    expect(screen.getByText("2FA is active")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disable 2FA" }));

    const dialog = screen.getByRole("dialog", { name: "Disable Two-Factor Authentication" });
    expect(dialog).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Verification Code"), "ABCD-EFGH");
    await user.click(within(dialog).getByRole("button", { name: "Disable 2FA" }));

    await waitFor(() =>
      expect(mockDisable).toHaveBeenCalledWith({
        code: "ABCD-EFGH",
        isBackupCode: true,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("2FA has been disabled");
  });

  it("regenerates backup codes from the enabled state", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue(enabledStatus);
    mockRegenerateBackupCodes.mockResolvedValue({
      success: true,
      backupCodes: ["QRST-UVWX", "YZAB-CDEF"],
    });

    render(<TwoFactorSettings />);

    await user.click(screen.getByRole("button", { name: "Regenerate Backup Codes" }));

    const dialog = screen.getByRole("dialog", { name: "Regenerate Backup Codes" });
    expect(dialog).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Authenticator Code"), "654321");
    await user.click(within(dialog).getByRole("button", { name: "Generate New Codes" }));

    await waitFor(() =>
      expect(mockRegenerateBackupCodes).toHaveBeenCalledWith({
        totpCode: "654321",
      }),
    );

    expect(await screen.findByText("Save Your Backup Codes")).toBeInTheDocument();
    expect(screen.getByText("QRST-UVWX")).toBeInTheDocument();
    expect(screen.getByText("YZAB-CDEF")).toBeInTheDocument();
    expect(mockShowSuccess).toHaveBeenCalledWith("New backup codes generated");
  });
});
