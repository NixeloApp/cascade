import type { Doc, Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { AI_CONFIG } from "./config";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("../ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../ui/Tabs", async () => {
  const React = await import("react");
  const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
  } | null>(null);

  return {
    Tabs: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (value: string) => void;
      children: ReactNode;
    }) => <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>,
    TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TabsTrigger: ({
      value,
      children,
    }: {
      value: string;
      children: ReactNode;
      width?: "fill" | "default" | "responsive";
    }) => {
      const context = React.useContext(TabsContext);
      if (!context) {
        throw new Error("TabsTrigger must be used within Tabs");
      }

      return (
        <button
          aria-selected={context.value === value}
          onClick={() => context.onValueChange(value)}
          role="tab"
          type="button"
        >
          {children}
        </button>
      );
    },
  };
});

vi.mock("./AIChat", () => ({
  AIChat: ({
    projectId,
    chatId,
    onChatCreated,
  }: {
    projectId?: Id<"projects">;
    chatId?: Id<"aiChats">;
    onChatCreated: (chatId: Id<"aiChats">) => void;
  }) => (
    <div data-testid="ai-chat">
      <div>{`project:${projectId ?? "none"}`}</div>
      <div>{`chat:${chatId ?? "none"}`}</div>
      <button onClick={() => onChatCreated("chat_created" as Id<"aiChats">)} type="button">
        Create chat
      </button>
    </div>
  ),
}));

vi.mock("./AISuggestionsPanel", () => ({
  AISuggestionsPanel: ({ projectId }: { projectId?: Id<"projects"> }) => (
    <div data-testid="ai-suggestions">{`suggestions:${projectId ?? "none"}`}</div>
  ),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

let chatsData: Array<Partial<Doc<"aiChats">>> | undefined;
let suggestionsData: Array<Partial<Doc<"aiSuggestions">>> | undefined;

function setQueryData({
  chats,
  suggestions,
}: {
  chats?: Array<Partial<Doc<"aiChats">>>;
  suggestions?: Array<Partial<Doc<"aiSuggestions">>>;
}) {
  chatsData = chats;
  suggestionsData = suggestions;
}

describe("AIAssistantPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setQueryData({
      chats: [],
      suggestions: [],
    });

    mockUseAuthenticatedQuery.mockImplementation(() => {
      const callPosition = mockUseAuthenticatedQuery.mock.calls.length % 2;
      return callPosition === 1 ? chatsData : suggestionsData;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the general chat panel and skips project suggestions without a project id", () => {
    setQueryData({
      chats: [{ _id: "chat_1" as Id<"aiChats"> }, { _id: "chat_2" as Id<"aiChats"> }],
    });

    render(<AIAssistantPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("General chat")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat")).toHaveTextContent("project:none");
    expect(screen.getByTestId("ai-chat")).toHaveTextContent("chat:none");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContainEqual({});
    expect(mockUseAuthenticatedQuery.mock.calls.map((call) => call[1])).toContain("skip");
  });

  it("updates the current chat id when AIChat reports a newly created chat", () => {
    render(
      <AIAssistantPanel
        projectId={"project_1" as Id<"projects">}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ai-chat")).toHaveTextContent("project:project_1");
    expect(screen.getByTestId("ai-chat")).toHaveTextContent("chat:none");

    fireEvent.click(screen.getByRole("button", { name: "Create chat" }));

    expect(screen.getByTestId("ai-chat")).toHaveTextContent("chat:chat_created");
  });

  it("shows unread suggestion count and switches tabs after the configured animation delay", () => {
    setQueryData({
      chats: [],
      suggestions: [
        { _id: "suggestion_1" as Id<"aiSuggestions">, accepted: false, dismissed: false },
      ],
    });

    render(
      <AIAssistantPanel
        projectId={"project_1" as Id<"projects">}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: /Suggestions/i })).toHaveTextContent("1");
    expect(screen.getByTestId("ai-chat")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-suggestions")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Suggestions/i }));

    expect(screen.getByTestId("ai-chat")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-suggestions")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(AI_CONFIG.animations.tabTransition);
    });

    expect(screen.queryByTestId("ai-chat")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-suggestions")).toHaveTextContent("suggestions:project_1");
  });
});
