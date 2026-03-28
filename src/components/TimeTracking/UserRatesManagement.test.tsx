import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ChangeEvent, ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { UserRatesManagement } from "./UserRatesManagement";

const RadioGroupContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) =>
    onClick ? (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ) : (
      <div>{children}</div>
    ),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action && (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Input: ({
    id,
    type,
    label,
    value,
    onChange,
    placeholder,
    step,
    min,
  }: {
    id?: string;
    type?: string;
    label?: string;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    step?: string;
    min?: string;
  }) => (
    <label htmlFor={id}>
      {label && <span>{label}</span>}
      <input
        id={id}
        aria-label={label}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
      />
    </label>
  ),
  Textarea: ({
    label,
    value,
    onChange,
    placeholder,
    rows,
  }: {
    label: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <label>
      <span>{label}</span>
      <textarea
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  ),
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("../ui/RadioGroup", () => ({
  RadioGroup: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </RadioGroupContext.Provider>
  ),
  RadioGroupItem: ({
    value,
    "aria-label": ariaLabel,
  }: {
    value: string;
    "aria-label"?: string;
  }) => {
    const context = useContext(RadioGroupContext);
    return (
      <span data-label={ariaLabel} data-value={value} data-checked={context.value === value} />
    );
  },
}));

vi.mock("../ui/Select", async () => await import("@/test/__tests__/selectMock"));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

type MutationProcedure = (
  ...args: Parameters<ReturnType<typeof useAuthenticatedMutation>["mutate"]>
) => ReturnType<ReturnType<typeof useAuthenticatedMutation>["mutate"]>;

function createMutationMock(
  mockProcedure: Mock<MutationProcedure>,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Parameters<typeof mockProcedure>) =>
    mockProcedure(...args)) as ReactMutation<FunctionReference<"mutation">>;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

const setUserRate = vi.fn<MutationProcedure>();

const userId = "user_1" as Id<"users">;
const projectId = "project_1" as Id<"projects">;

let currentUser:
  | {
      _id: Id<"users">;
      name: string;
      email?: string;
    }
  | undefined;
let currentProjects:
  | {
      page: Array<{
        _id: Id<"projects">;
        name: string;
      }>;
    }
  | undefined;
let currentUserRates:
  | Array<{
      _id: Id<"userRates">;
      user: { _id: Id<"users">; name: string; email?: string } | null;
      projectId?: Id<"projects">;
      hourlyRate: number;
      currency: string;
      rateType: "internal" | "billable";
      notes?: string;
    }>
  | undefined;

describe("UserRatesManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserRate.mockResolvedValue({ success: true, rateId: "rate_1" as Id<"userRates"> });
    currentUser = {
      _id: userId,
      name: "Alex Rivera",
      email: "alex@example.com",
    };
    currentProjects = {
      page: [{ _id: projectId, name: "Core Platform" }],
    };
    currentUserRates = [];

    let queryCallCount = 0;
    mockUseAuthenticatedQuery.mockImplementation(() => {
      queryCallCount += 1;
      const position = ((queryCallCount - 1) % 3) + 1;
      if (position === 1) return currentUser;
      if (position === 2) return currentProjects;
      return currentUserRates;
    });

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(setUserRate),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("keeps the rates surface visible while the current user query is unavailable", () => {
    currentUser = undefined;

    render(<UserRatesManagement />);

    expect(screen.getByText("Hourly Rates")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set My Rate" })).toBeDisabled();
  });

  it("renders the empty state and validates hourly rate input before saving", async () => {
    render(<UserRatesManagement />);

    expect(screen.getByText("No hourly rates set")).toBeInTheDocument();
    expect(
      screen.getByText("Set your hourly rate to enable cost tracking and burn rate calculations."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Set My Rate" })[0]);
    expect(screen.getByRole("dialog", { name: "Set Hourly Rate" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Rate" }));

    expect(mockShowError).toHaveBeenCalledWith("Please enter a valid hourly rate");
    expect(setUserRate).not.toHaveBeenCalled();
  });

  it("renders existing rates and saves a project-specific billable rate", async () => {
    currentUserRates = [
      {
        _id: "rate_existing" as Id<"userRates">,
        user: { _id: userId, name: "Alex Rivera", email: "alex@example.com" },
        hourlyRate: 125,
        currency: "USD",
        rateType: "internal",
        notes: "Standard internal cost",
      },
    ];

    render(<UserRatesManagement />);

    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("internal")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("Default rate (applies to all projects)")).toBeInTheDocument();
    expect(screen.getByText("Standard internal cost")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Set My Rate" }));
    fireEvent.click(screen.getByRole("button", { name: "Core Platform (Override)" }));
    fireEvent.click(screen.getByRole("button", { name: /Billable Rate/ }));
    fireEvent.change(screen.getByLabelText("Hourly Rate"), {
      target: { value: "175" },
    });
    fireEvent.click(screen.getByRole("button", { name: "EUR" }));
    fireEvent.change(screen.getByLabelText("Notes (optional)"), {
      target: { value: "Client billing rate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Rate" }));

    await waitFor(() => {
      expect(setUserRate).toHaveBeenCalledWith({
        userId,
        projectId,
        hourlyRate: 175,
        currency: "EUR",
        rateType: "billable",
        notes: "Client billing rate",
      });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Hourly rate saved");
    expect(screen.queryByRole("dialog", { name: "Set Hourly Rate" })).not.toBeInTheDocument();
  });
});
