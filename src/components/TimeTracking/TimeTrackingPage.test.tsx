import type { Id } from "@convex/_generated/dataModel";
import { HOUR, MONTH, SECOND } from "@convex/lib/timeUtils";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { TimeTrackingPage } from "./TimeTrackingPage";

const SelectContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

const TabsContext = createContext<{
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("../ui/OverviewBand", () => ({
  OverviewBand: ({
    eyebrow,
    title,
    description,
    metrics,
    aside,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    metrics: Array<{ label: string; value: string | number; detail: string }>;
    aside?: ReactNode;
  }) => (
    <div>
      <div>{eyebrow}</div>
      <div>{title}</div>
      <div>{description}</div>
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div>{metric.label}</div>
          <div>{metric.value}</div>
          <div>{metric.detail}</div>
        </div>
      ))}
      {aside}
    </div>
  ),
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
  SelectTrigger: ({ children, id }: { children: ReactNode; id?: string }) => (
    <button id={id} type="button">
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

vi.mock("../ui/Tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(TabsContext);
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

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./BurnRateDashboard", () => ({
  BurnRateDashboard: ({ projectId }: { projectId: Id<"projects"> }) => (
    <div>{`burn-rate:${projectId}`}</div>
  ),
}));

vi.mock("./TimeEntriesList", () => ({
  TimeEntriesList: ({
    projectId,
    startDate,
    endDate,
    billingEnabled,
  }: {
    projectId?: Id<"projects">;
    startDate?: number;
    endDate?: number;
    billingEnabled?: boolean;
  }) => (
    <div>{`entries:${projectId ?? "all"}:${startDate ?? "none"}:${endDate ?? "none"}:${billingEnabled ? "billing" : "no-billing"}`}</div>
  ),
}));

vi.mock("./UserRatesManagement", () => ({
  UserRatesManagement: () => <div>rates-panel</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

const projectId = "project_1" as Id<"projects">;
const secondProjectId = "project_2" as Id<"projects">;

let currentProjects:
  | {
      page: Array<{
        _id: Id<"projects">;
        name: string;
      }>;
    }
  | undefined;
let currentSummary:
  | {
      totalDuration: number;
      billableDuration: number;
      totalCost: number;
      entryCount: number;
      isTruncated: boolean;
    }
  | undefined;

describe("TimeTrackingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProjects = {
      page: [
        { _id: projectId, name: "Core Platform" },
        { _id: secondProjectId, name: "Client Portal" },
      ],
    };
    currentSummary = {
      totalDuration: (3 * HOUR) / SECOND,
      billableDuration: HOUR / SECOND,
      totalCost: 2400,
      entryCount: 12,
      isTruncated: false,
    };

    mockUseOrganization.mockReturnValue({
      organizationId: "org_1" as Id<"organizations">,
      orgSlug: "nixelo",
      organizationName: "Nixelo",
      userRole: "admin",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (args === "skip") {
        return undefined;
      }

      if (typeof args === "object" && args && "projectId" in args) {
        return currentSummary;
      }

      return currentProjects;
    });
  });

  it("renders overview metrics and entries tab with project/date filters", () => {
    render(<TimeTrackingPage userRole="admin" />);

    expect(screen.getByText("Operations pulse")).toBeInTheDocument();
    expect(
      screen.getByText("Track time with enough context to understand cost, not just duration."),
    ).toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
    expect(screen.getByText("3h")).toBeInTheDocument();
    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Billable")).toBeInTheDocument();
    expect(screen.getByText("$2,400.00")).toBeInTheDocument();
    expect(screen.getByText("Time Entries")).toBeInTheDocument();
    expect(screen.getByText("Burn Rate & Costs")).toBeInTheDocument();
    expect(screen.getByText("Hourly Rates")).toBeInTheDocument();
    expect(screen.getByText("All Projects")).toBeInTheDocument();
    expect(screen.getAllByText("Last 7 Days").length).toBeGreaterThan(0);
    expect(screen.getByText(/^entries:all:/)).toBeInTheDocument();
  });

  it("updates project and date filters for the entries tab and forwards them to child data surfaces", async () => {
    render(<TimeTrackingPage userRole="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Client Portal" }));
    fireEvent.click(screen.getByRole("button", { name: "Last 30 Days" }));

    await waitFor(() => {
      const entriesPanel = screen.getByText((text) =>
        text.startsWith(`entries:${secondProjectId}:`),
      );
      expect(entriesPanel).toBeInTheDocument();
    });

    const summaryCalls = mockUseAuthenticatedQuery.mock.calls.filter(
      ([, args]) => typeof args === "object" && args && "projectId" in args,
    );
    const latestSummaryArgs = summaryCalls[summaryCalls.length - 1]?.[1];

    expect(latestSummaryArgs).toEqual({
      projectId: secondProjectId,
      startDate: expect.any(Number),
      endDate: expect.any(Number),
    });

    const argsObject = latestSummaryArgs as {
      startDate: number;
      endDate: number;
    };
    expect(argsObject.endDate - argsObject.startDate).toBe(MONTH);
  });

  it("shows the all-project burn-rate prompt until an admin selects a project, then renders burn and rates tabs", async () => {
    render(<TimeTrackingPage userRole="admin" />);

    fireEvent.click(screen.getByRole("button", { name: "Burn Rate & Costs" }));
    expect(screen.getByText("Select a project")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose a project from the filter above to view burn rate and cost analysis.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Core Platform" }));

    await waitFor(() => {
      expect(screen.getByText(`burn-rate:${projectId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Hourly Rates" }));
    expect(screen.getByText("rates-panel")).toBeInTheDocument();
  });

  it("hides sensitive tabs and project selection when locked to a project for a non-admin user", () => {
    render(<TimeTrackingPage projectId={projectId} userRole="viewer" />);

    expect(screen.getByText(new RegExp(`^entries:${projectId}:`))).toBeInTheDocument();
    expect(screen.queryByText("Burn Rate & Costs")).not.toBeInTheDocument();
    expect(screen.queryByText("Hourly Rates")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Project")).not.toBeInTheDocument();
    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });
});
