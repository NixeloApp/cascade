import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { SSOSettings } from "./SSOSettings";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

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

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div>{message}</div>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
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

const mockCreateConnection = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockRemoveConnection = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockSetEnabled = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const organizationId = "org-1" as Id<"organizations">;
const connectionId = "connection-1" as Id<"ssoConnections">;

const connection = {
  _id: connectionId,
  _creationTime: 1,
  organizationId,
  name: "Okta",
  type: "saml",
  isEnabled: true,
  verifiedDomains: ["example.com"],
  createdBy: "user-1" as Id<"users">,
  updatedAt: 1_700_000_000_000,
} as Doc<"ssoConnections">;

describe("SSOSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCallCount = 0;
    const mutationResults = [
      {
        mutate: mockCreateConnection,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockRemoveConnection,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockSetEnabled,
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

  it("renders a loading state while connections are unresolved", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<SSOSettings organizationId={organizationId} />);

    expect(screen.getByText("Loading md")).toBeInTheDocument();
    expect(screen.queryByText("Single Sign-On (SSO)")).not.toBeInTheDocument();
  });

  it("creates a new connection from the empty state dialog", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue([]);
    mockCreateConnection.mockResolvedValue(undefined);

    render(<SSOSettings organizationId={organizationId} />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          (element.textContent?.includes(
            "Add a SAML or OIDC connection to enable enterprise sign-in.",
          ) ??
            false),
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    const dialog = screen.getByRole("dialog", { name: "Add SSO Connection" });
    expect(dialog).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Connection Name"), "  Okta Workforce  ");
    await user.click(within(dialog).getByRole("button", { name: "Create Connection" }));

    await waitFor(() =>
      expect(mockCreateConnection).toHaveBeenCalledWith({
        organizationId,
        type: "saml",
        name: "Okta Workforce",
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("SSO connection created");
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("toggles and deletes an existing connection", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue([connection]);
    mockSetEnabled.mockResolvedValue(undefined);
    mockRemoveConnection.mockResolvedValue(undefined);

    render(<SSOSettings organizationId={organizationId} />);

    expect(screen.getByText("Okta")).toBeInTheDocument();
    expect(screen.getByText("SAML")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Domains: example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() =>
      expect(mockSetEnabled).toHaveBeenCalledWith({
        connectionId,
        isEnabled: false,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("SSO connection disabled");

    const connectionCard = screen.getByText("Okta").closest("[class*='border']");
    if (!(connectionCard instanceof HTMLElement)) {
      throw new Error("Connection card not found");
    }

    await user.click(within(connectionCard).getAllByRole("button")[2]);

    const dialog = screen.getByRole("dialog", { name: "Delete SSO Connection" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this SSO connection?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockRemoveConnection).toHaveBeenCalledWith({
        connectionId,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("SSO connection deleted");
  });
});
