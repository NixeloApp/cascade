import type { Doc, Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { useAISuggestions } from "./hooks";

vi.mock("./hooks", () => ({
  useAISuggestions: vi.fn(),
}));

vi.mock("../ui/SegmentedControl", async () => {
  const React = await import("react");
  const SegmentedControlContext = React.createContext<{
    onValueChange?: (value: string) => void;
  } | null>(null);

  return {
    SegmentedControl: ({
      onValueChange,
      children,
    }: {
      onValueChange?: (value: string) => void;
      value?: string;
      children: ReactNode;
      wrap?: boolean;
      className?: string;
      size?: "sm" | "md" | "lg" | "calendarMode";
    }) => (
      <SegmentedControlContext.Provider value={{ onValueChange }}>
        <div>{children}</div>
      </SegmentedControlContext.Provider>
    ),
    SegmentedControlItem: ({ value, children }: { value: string; children: ReactNode }) => {
      const context = React.useContext(SegmentedControlContext);
      if (!context) {
        throw new Error("SegmentedControlItem must be used within SegmentedControl");
      }

      return (
        <button onClick={() => context.onValueChange?.(value)} type="button">
          {children}
        </button>
      );
    },
  };
});

const mockUseAISuggestions = vi.mocked(useAISuggestions);

const handleGenerateInsights = vi.fn();
const handleAcceptSuggestion = vi.fn();
const handleDismissSuggestion = vi.fn();
const setSelectedType = vi.fn();

function createSuggestion(
  overrides: Partial<Doc<"aiSuggestions">> & Pick<Doc<"aiSuggestions">, "_id">,
): Doc<"aiSuggestions"> {
  return {
    _id: overrides._id,
    _creationTime: overrides._creationTime ?? 1_700_000_000_000,
    accepted: overrides.accepted ?? false,
    dismissed: overrides.dismissed ?? false,
    confidence: overrides.confidence,
    projectId: overrides.projectId ?? ("project_1" as Id<"projects">),
    reasoning: overrides.reasoning,
    suggestion: overrides.suggestion ?? "Default suggestion",
    suggestionType: overrides.suggestionType ?? "insight",
    userId: overrides.userId ?? ("user_1" as Id<"users">),
  } as Doc<"aiSuggestions">;
}

describe("AISuggestionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAISuggestions.mockReturnValue({
      isGenerating: false,
      selectedType: undefined,
      suggestions: [],
      unreadCount: 0,
      setSelectedType,
      handleGenerateInsights,
      handleAcceptSuggestion,
      handleDismissSuggestion,
    });
  });

  it("shows the no-project empty state when no project is selected", () => {
    render(<AISuggestionsPanel />);

    expect(screen.getByText("No Project Selected")).toBeInTheDocument();
    expect(screen.getByText("Select a project to view AI suggestions.")).toBeInTheDocument();
  });

  it("renders loading and empty states and wires generate plus filter controls", () => {
    mockUseAISuggestions.mockReturnValue({
      isGenerating: true,
      selectedType: "risk_detection",
      suggestions: undefined,
      unreadCount: 0,
      setSelectedType,
      handleGenerateInsights,
      handleAcceptSuggestion,
      handleDismissSuggestion,
    });

    const { rerender } = render(<AISuggestionsPanel projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByRole("button", { name: /Analyzing/i })).toBeDisabled();
    expect(document.querySelectorAll(".animate-shimmer")).toHaveLength(3);

    mockUseAISuggestions.mockReturnValue({
      isGenerating: false,
      selectedType: undefined,
      suggestions: [],
      unreadCount: 0,
      setSelectedType,
      handleGenerateInsights,
      handleAcceptSuggestion,
      handleDismissSuggestion,
    });

    rerender(<AISuggestionsPanel projectId={"project_1" as Id<"projects">} />);

    fireEvent.click(screen.getByRole("button", { name: /Generate AI Insights/i }));
    expect(handleGenerateInsights).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Risks/i }));
    expect(setSelectedType).toHaveBeenCalledWith("risk_detection");

    fireEvent.click(screen.getByRole("button", { name: /^All$/i }));
    expect(setSelectedType).toHaveBeenCalledWith(undefined);

    expect(screen.getByText("No Suggestions Yet")).toBeInTheDocument();
  });

  it("renders suggestion cards with actions, reasoning, confidence, and resolved badges", () => {
    mockUseAISuggestions.mockReturnValue({
      isGenerating: false,
      selectedType: undefined,
      suggestions: [
        createSuggestion({
          _id: "suggestion_open" as Id<"aiSuggestions">,
          suggestion: "Investigate burn-rate variance",
          suggestionType: "risk_detection",
          reasoning: "Velocity dropped after sprint 12.",
          confidence: 0.82,
        }),
        createSuggestion({
          _id: "suggestion_accepted" as Id<"aiSuggestions">,
          suggestion: "Promote the roadmap update",
          suggestionType: "insight",
          accepted: true,
        }),
        createSuggestion({
          _id: "suggestion_dismissed" as Id<"aiSuggestions">,
          suggestion: "Reassign support queue",
          suggestionType: "sprint_planning",
          dismissed: true,
        }),
      ],
      unreadCount: 1,
      setSelectedType,
      handleGenerateInsights,
      handleAcceptSuggestion,
      handleDismissSuggestion,
    });

    render(<AISuggestionsPanel projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByText("Investigate burn-rate variance")).toBeInTheDocument();
    expect(screen.getByText("Reasoning:")).toBeInTheDocument();
    expect(screen.getByText("Velocity dropped after sprint 12.")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Accept/i }));
    expect(handleAcceptSuggestion).toHaveBeenCalledWith("suggestion_open");

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    expect(handleDismissSuggestion).toHaveBeenCalledWith("suggestion_open");

    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Dismissed")).toBeInTheDocument();
  });
});
