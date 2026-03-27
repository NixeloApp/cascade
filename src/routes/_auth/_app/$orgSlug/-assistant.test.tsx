import userEvent from "@testing-library/user-event";
import { createContext, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { AssistantPage } from "./assistant";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({
    actions,
    description,
    title,
  }: {
    actions?: ReactNode;
    description?: string;
    title: string;
  }) => (
    <div>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
      {actions}
    </div>
  ),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  CardBody: ({
    children,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "data-testid"?: string;
  }) => <div data-testid={testId}>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/CardSection", () => ({
  CardSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({
    description,
    title,
    "data-testid": testId,
  }: {
    description?: string;
    title: string;
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
    </div>
  ),
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  Icon: () => null,
}));

vi.mock("@/components/ui/IconCircle", () => ({
  IconCircle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Skeleton", () => ({
  Skeleton: () => <div data-testid={TEST_IDS.LOADING.SKELETON} />,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const TabsContext = createContext<{
  onValueChange: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("@/components/ui/Tabs", () => ({
  Tabs: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
    value: string;
  }) => <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    "data-testid": testId,
    value,
  }: {
    children: ReactNode;
    "data-testid"?: string;
    value: string;
  }) => {
    const tabs = useContext(TabsContext);
    if (!tabs) return null;
    return (
      <button
        type="button"
        data-testid={testId}
        role="tab"
        aria-selected={tabs.value === value}
        onClick={() => tabs.onValueChange(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({
    children,
    "data-testid": testId,
    value,
  }: {
    children: ReactNode;
    "data-testid"?: string;
    value: string;
  }) => {
    const tabs = useContext(TabsContext);
    if (!tabs || tabs.value !== value) {
      return null;
    }
    return <div data-testid={testId}>{children}</div>;
  },
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const populatedStats = {
  avgResponseTime: 428,
  byOperation: {
    analysis: 1,
    automation: 1,
    chat: 3,
    suggestion: 2,
  },
  byProvider: {
    anthropic: 9600,
    openai: 3400,
  },
  successRate: 100,
  totalCost: 912,
  totalRequests: 7,
  totalTokens: 13000,
};

const emptyStats = {
  avgResponseTime: 0,
  byOperation: {
    analysis: 0,
    automation: 0,
    chat: 0,
    suggestion: 0,
  },
  byProvider: {
    anthropic: 0,
    openai: 0,
  },
  successRate: 0,
  totalCost: 0,
  totalRequests: 0,
  totalTokens: 0,
};

const populatedChats = [
  {
    _creationTime: Date.now() - 20_000,
    _id: "chat-1",
    projectId: "project-1",
    title: "Launch risks for DEMO",
    updatedAt: Date.now() - 10_000,
    userId: "user-1",
  },
  {
    _creationTime: Date.now() - 40_000,
    _id: "chat-2",
    projectId: undefined,
    title: "Ops handoff checklist",
    updatedAt: Date.now() - 15_000,
    userId: "user-1",
  },
];

function mockAssistantQueries(args?: {
  chats?: typeof populatedChats | undefined;
  stats?: typeof populatedStats | typeof emptyStats | undefined;
}) {
  const stats = args && "stats" in args ? args.stats : populatedStats;
  const chats = args && "chats" in args ? args.chats : populatedChats;
  let callIndex = 0;

  mockUseAuthenticatedQuery.mockImplementation(() => {
    const result = callIndex % 2 === 0 ? stats : chats;
    callIndex += 1;
    return result;
  });
}

describe("AssistantPage", () => {
  beforeEach(() => {
    mockUseAuthenticatedQuery.mockReset();
    mockAssistantQueries();
  });

  it("renders real assistant snapshot data on the overview tab", () => {
    render(<AssistantPage />);

    expect(screen.getByTestId(TEST_IDS.ASSISTANT.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ASSISTANT.OVERVIEW_PANEL)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ASSISTANT.SNAPSHOT_CARD)).toBeInTheDocument();
    expect(screen.getByText("Workspace AI is active")).toBeInTheDocument();
    expect(screen.getByText("7 requests")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("shows a no-activity overview empty state when no usage has been recorded", () => {
    mockAssistantQueries({ stats: emptyStats });

    render(<AssistantPage />);

    expect(screen.getByTestId(TEST_IDS.ASSISTANT.OVERVIEW_EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText("No AI usage recorded yet")).toBeInTheDocument();
    expect(screen.getByText("No assistant activity yet")).toBeInTheDocument();
  });

  it("shows recent conversations on the conversations tab", async () => {
    const user = userEvent.setup();

    render(<AssistantPage />);
    await user.click(screen.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_TAB));

    expect(screen.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_PANEL)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_LIST)).toBeInTheDocument();
    expect(screen.getByText("Launch risks for DEMO")).toBeInTheDocument();
    expect(screen.getByText("Ops handoff checklist")).toBeInTheDocument();
  });

  it("shows the conversations empty state when no chats exist", async () => {
    const user = userEvent.setup();
    mockAssistantQueries({ chats: [] });

    render(<AssistantPage />);
    await user.click(screen.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_TAB));

    expect(screen.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });

  it("renders the route-scoped loading shell while stats are unresolved", () => {
    mockAssistantQueries({ stats: undefined });

    render(<AssistantPage />);

    expect(screen.getByTestId(TEST_IDS.ASSISTANT.LOADING_STATE)).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.LOADING.SKELETON).length).toBeGreaterThan(0);
  });
});
