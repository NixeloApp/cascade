import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { RoadmapHeaderControls } from "./RoadmapHeaderControls";

const SelectContext = createContext<{
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

const SegmentedControlContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("../ui/Select", () => ({
  Select: ({
    children,
    disabled,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <SelectContext.Provider value={{ disabled, onValueChange, value }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    className,
    ...props
  }: {
    children: ReactNode;
    className?: string;
  } & Record<string, unknown>) => (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ children, placeholder }: { children?: ReactNode; placeholder?: string }) => {
    const context = useContext(SelectContext);
    return <span>{children ?? context.value ?? placeholder}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button
        type="button"
        onClick={() => context.onValueChange?.(value)}
        disabled={context.disabled}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("../ui/SegmentedControl", () => ({
  SegmentedControl: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <SegmentedControlContext.Provider value={{ onValueChange, value }}>
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

const epicId = "epic_1" as Id<"issues">;

function createProps() {
  return {
    epics: [{ _id: epicId, key: "EPIC-1", title: "Growth" }],
    filterEpic: "all" as const,
    fitTimelineWindow: {
      anchorDate: new Date(Date.UTC(2026, 0, 1)),
      timelineSpan: 3 as const,
    },
    groupBy: "none" as const,
    nextWindowLabel: "Next 3-month window",
    onFilterEpicChange: vi.fn(),
    onFitToIssues: vi.fn(),
    onGroupByChange: vi.fn(),
    onNextWindow: vi.fn(),
    onPreviousWindow: vi.fn(),
    onTimelineSpanChange: vi.fn(),
    onTimelineZoomChange: vi.fn(),
    onToday: vi.fn(),
    onToggleDependencies: vi.fn(),
    onViewModeChange: vi.fn(),
    previousWindowLabel: "Previous 3-month window",
    showDependencies: false,
    timelineRangeLabel: "Jan 2026 - Mar 2026",
    timelineSpan: 3 as const,
    timelineZoom: "standard" as const,
    viewMode: "months" as const,
  };
}

describe("RoadmapHeaderControls", () => {
  it("renders the range label and wires navigation actions", () => {
    const props = createProps();

    render(<RoadmapHeaderControls {...props} fitTimelineWindow={null} />);

    expect(screen.getByText("Jan 2026 - Mar 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit to issues" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous 3-month window" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: "Next 3-month window" }));
    fireEvent.click(screen.getByTestId("roadmap-dependencies-toggle"));

    expect(props.onPreviousWindow).toHaveBeenCalledTimes(1);
    expect(props.onToday).toHaveBeenCalledTimes(1);
    expect(props.onNextWindow).toHaveBeenCalledTimes(1);
    expect(props.onToggleDependencies).toHaveBeenCalledTimes(1);
  });

  it("routes select and segmented control changes through the typed callbacks", () => {
    const props = createProps();

    render(<RoadmapHeaderControls {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Growth" }));
    fireEvent.click(screen.getByRole("button", { name: "6 Months" }));
    fireEvent.click(screen.getByRole("button", { name: "Epic" }));
    fireEvent.click(screen.getByRole("button", { name: "Weeks" }));
    fireEvent.click(screen.getByRole("button", { name: "Expanded" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit to issues" }));

    expect(props.onFilterEpicChange).toHaveBeenCalledWith(epicId);
    expect(props.onTimelineSpanChange).toHaveBeenCalledWith(6);
    expect(props.onGroupByChange).toHaveBeenCalledWith("epic");
    expect(props.onViewModeChange).toHaveBeenCalledWith("weeks");
    expect(props.onTimelineZoomChange).toHaveBeenCalledWith("expanded");
    expect(props.onFitToIssues).toHaveBeenCalledTimes(1);
  });
});
