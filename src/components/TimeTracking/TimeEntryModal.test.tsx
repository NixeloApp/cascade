import type { Id } from "@convex/_generated/dataModel";
import { MINUTE } from "@convex/lib/timeUtils";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { createContext, createElement, useContext } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { TimeEntryModal } from "./TimeEntryModal";

const SelectContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

const SegmentedControlContext = createContext<{
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
    onClick,
    type,
    disabled,
    isLoading,
    form,
    leftIcon,
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
    isLoading?: boolean;
    form?: string;
    leftIcon?: ReactNode;
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled || isLoading} form={form}>
      {leftIcon}
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    title,
    children,
    footer,
    "data-testid": testId,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    "data-testid"?: string;
  }) =>
    open ? (
      <div role="dialog" aria-label={title} data-testid={testId}>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children, as }: { children: ReactNode; as?: "div" | "span" }) =>
    createElement(as ?? "div", undefined, children),
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Checkbox: ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    label: string;
  }) => (
    <label>
      <input aria-label={label} type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  ),
  Input: ({
    id,
    type,
    label,
    value,
    onChange,
    onKeyDown,
    placeholder,
    helperText,
    error,
    max,
    required,
  }: {
    id?: string;
    type?: string;
    label?: string;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    helperText?: string;
    error?: string;
    max?: string;
    required?: boolean;
  }) => (
    <label htmlFor={id}>
      {label && <span>{label}</span>}
      <input
        id={id}
        aria-label={label}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        max={max}
        required={required}
      />
      {helperText && <span>{helperText}</span>}
      {error && <span>{error}</span>}
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

vi.mock("../ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    type,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button";
    "aria-label"?: string;
  }) => (
    <button type={type ?? "button"} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("../ui/SegmentedControl", () => ({
  SegmentedControl: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <SegmentedControlContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SegmentedControlContext.Provider>
  ),
  SegmentedControlItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SegmentedControlContext);
    return (
      <button
        type="button"
        aria-pressed={context.value === value}
        onClick={() => context.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("../ui/Select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    id,
    className,
  }: {
    children: ReactNode;
    id?: string;
    className?: string;
  }) => (
    <button id={id} type="button" className={className}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => {
    const context = useContext(SelectContext);
    return <span>{context.value ?? placeholder}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button type="button" onClick={() => context.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({
    children,
    as,
    id,
    onSubmit,
  }: {
    children: ReactNode;
    as?: "div" | "form";
    id?: string;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  }) => createElement(as ?? "div", { id, onSubmit }, children),
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

const createTimeEntry = vi.fn<MutationProcedure>();
const startTimer = vi.fn<MutationProcedure>();

const projectId = "project_1" as Id<"projects">;
const issueId = "issue_1" as Id<"issues">;

let currentProjects:
  | {
      page: Array<{
        _id: Id<"projects">;
        name: string;
      }>;
    }
  | undefined;
let currentProjectIssues:
  | Array<{
      _id: Id<"issues">;
      key: string;
      title: string;
    }>
  | undefined;
let mutationHookCallCount = 0;

describe("TimeEntryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTimeEntry.mockResolvedValue(undefined);
    startTimer.mockResolvedValue(undefined);
    currentProjects = {
      page: [{ _id: projectId, name: "Core Platform" }],
    };
    currentProjectIssues = [{ _id: issueId, key: "CORE-12", title: "Billing cleanup" }];
    mutationHookCallCount = 0;

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (args === "skip") {
        return undefined;
      }

      if (typeof args === "object" && args && "projectId" in args) {
        return currentProjectIssues;
      }

      return currentProjects;
    });

    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationHookCallCount += 1;

      return {
        mutate:
          mutationHookCallCount % 2 === 1
            ? createMutationMock(createTimeEntry)
            : createMutationMock(startTimer),
        canAct: true,
        isAuthLoading: false,
      };
    });
  });

  it("does not render when closed", () => {
    render(<TimeEntryModal open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("dialog", { name: "Log Time" })).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.TIME_TRACKING.ENTRY_MODAL)).not.toBeInTheDocument();
  });

  it("starts a timer with selected project, issue, tags, and billing details", async () => {
    const onOpenChange = vi.fn();

    render(
      <TimeEntryModal
        open={true}
        onOpenChange={onOpenChange}
        defaultMode="timer"
        billingEnabled={true}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Core Platform" })[0]);

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "CORE-12 - Billing cleanup" }).length,
      ).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "CORE-12 - Billing cleanup" })[0]);
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Debugged the billing pipeline" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Meeting" })[0]);
    fireEvent.click(screen.getByLabelText("Billable time"));
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "client" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Start Timer" })[1]);

    await waitFor(() => {
      expect(startTimer).toHaveBeenCalledWith({
        projectId,
        issueId,
        description: "Debugged the billing pipeline",
        activity: "Meeting",
        billable: true,
        tags: ["client"],
      });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Timer started");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("logs duration-based time with manual context and computed entry times", async () => {
    const onOpenChange = vi.fn();
    const dateValue = "2026-03-13";
    const expectedEndDate = new Date(dateValue);
    expectedEndDate.setHours(17, 0, 0, 0);
    const expectedEndTime = expectedEndDate.getTime();
    const expectedStartTime = expectedEndTime - 90 * MINUTE;

    render(<TimeEntryModal open={true} onOpenChange={onOpenChange} />);

    fireEvent.change(screen.getByLabelText("Date *"), {
      target: { value: dateValue },
    });
    fireEvent.click(screen.getByRole("button", { name: "+30m" }));
    fireEvent.click(screen.getByRole("button", { name: "+1h" }));
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Wrote rollout documentation" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Documentation" })[0]);
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "ops" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Time" }));

    await waitFor(() => {
      expect(createTimeEntry).toHaveBeenCalledWith({
        projectId: undefined,
        issueId: undefined,
        startTime: expectedStartTime,
        endTime: expectedEndTime,
        description: "Wrote rollout documentation",
        activity: "Documentation",
        tags: ["ops"],
        billable: false,
      });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Time entry created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("surfaces time-range creation failures without closing the modal", async () => {
    const onOpenChange = vi.fn();
    const error = new Error("request failed");
    const dateValue = "2026-03-14";

    createTimeEntry.mockRejectedValueOnce(error);

    render(<TimeEntryModal open={true} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Time Range" }));
    fireEvent.change(screen.getByLabelText("Date *"), {
      target: { value: dateValue },
    });
    fireEvent.change(screen.getByLabelText("Start Time *"), {
      target: { value: "09:15" },
    });
    fireEvent.change(screen.getByLabelText("End Time *"), {
      target: { value: "11:00" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Reviewed deployment results" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Development" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Log Time" }));

    await waitFor(() => {
      expect(createTimeEntry).toHaveBeenCalledWith({
        projectId: undefined,
        issueId: undefined,
        startTime: new Date(`${dateValue}T09:15`).getTime(),
        endTime: new Date(`${dateValue}T11:00`).getTime(),
        description: "Reviewed deployment results",
        activity: "Development",
        tags: [],
        billable: false,
      });
    });

    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create time entry");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
