import type { Id } from "@convex/_generated/dataModel";
import { MINUTE } from "@convex/lib/timeUtils";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { ManualTimeEntryModal } from "./ManualTimeEntryModal";

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

vi.mock("@/lib/form", () => ({
  FormTextarea: ({
    field,
    label,
    placeholder,
    rows,
  }: {
    field: { state: { value: string }; handleChange: (value: string) => void };
    label: string;
    placeholder?: string;
    rows?: number;
  }) => (
    <label>
      <span>{label}</span>
      <textarea
        aria-label={label}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </label>
  ),
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
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Checkbox: ({
    checked,
    onChange,
    label,
    helperText,
  }: {
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    label: string;
    helperText?: string;
  }) => (
    <label>
      <input aria-label={label} type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
      {helperText && <span>{helperText}</span>}
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

const createTimeEntry = vi.fn<MutationProcedure>();

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

describe("ManualTimeEntryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTimeEntry.mockResolvedValue(undefined);
    currentProjects = {
      page: [{ _id: projectId, name: "Core Platform" }],
    };
    currentProjectIssues = [{ _id: issueId, key: "CORE-12", title: "Billing cleanup" }];

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "projectId" in args) {
        return currentProjectIssues;
      }
      if (args === "skip") {
        return undefined;
      }
      return currentProjects;
    });

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(createTimeEntry),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when closed", () => {
    render(<ManualTimeEntryModal open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("dialog", { name: "Log Time Manually" })).not.toBeInTheDocument();
  });

  it("creates a duration-based time entry with selected project, issue, activity, tags, and billing", async () => {
    const onOpenChange = vi.fn();
    const dateValue = "2026-03-13";
    const expectedEndDate = new Date(dateValue);
    expectedEndDate.setHours(17, 0, 0, 0);
    const expectedEndTime = expectedEndDate.getTime();
    const expectedStartTime = expectedEndTime - 90 * MINUTE;

    render(<ManualTimeEntryModal open={true} onOpenChange={onOpenChange} />);

    fireEvent.change(screen.getByLabelText("Date *"), {
      target: { value: dateValue },
    });
    fireEvent.change(screen.getByLabelText("Duration *"), {
      target: { value: "1.5" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Core Platform" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "CORE-12 - Billing cleanup" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Meeting" })[0]);
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Reviewed billing export requirements" },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "urgent" },
    });
    fireEvent.keyDown(screen.getByLabelText("Tags"), { key: "Enter" });
    fireEvent.click(screen.getByLabelText("Billable time"));

    expect(screen.getByText("Duration: 1h 30m")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Entry" }));

    await waitFor(() =>
      expect(createTimeEntry).toHaveBeenCalledWith({
        projectId,
        issueId,
        startTime: expectedStartTime,
        endTime: expectedEndTime,
        description: "Reviewed billing export requirements",
        activity: "Meeting",
        tags: ["urgent"],
        billable: true,
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Time entry created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("supports time-range mode and surfaces mutation failures through the shared error toast", async () => {
    const error = new Error("create failed");
    createTimeEntry.mockRejectedValueOnce(error);
    const dateValue = "2026-03-14";

    render(
      <ManualTimeEntryModal
        open={true}
        onOpenChange={vi.fn()}
        projectId={projectId}
        issueId={issueId}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start/End Time" }));
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
      target: { value: "Time range entry" },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "keep" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "drop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByLabelText("Remove tag drop"));

    expect(screen.getByText("Duration: 1h 45m")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Entry" }));

    await waitFor(() =>
      expect(createTimeEntry).toHaveBeenCalledWith({
        projectId,
        issueId,
        startTime: new Date(`${dateValue}T09:15`).getTime(),
        endTime: new Date(`${dateValue}T11:00`).getTime(),
        description: "Time range entry",
        activity: undefined,
        tags: ["keep"],
        billable: false,
      }),
    );
    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to create time entry");
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
