import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Entry type definition
interface MockTimeEntry {
  _id: Id<"timeEntries">;
  date: number;
  startTime: number;
  duration: number;
  description?: string;
  activity?: string;
  billable?: boolean;
  isLocked?: boolean;
  billed?: boolean;
  totalCost?: number;
  currency?: string;
  project?: { name: string };
  issue?: { key: string };
}

// Mock data storage
let mockEntries: MockTimeEntry[] | undefined;

const mockDeleteEntry = vi.fn();

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockEntries),
  useMutation: vi.fn(() => mockDeleteEntry),
}));

// Import after mocks
import { TimeEntriesList } from "./TimeEntriesList";

// Create mock entry helper
function createMockEntry(overrides: Partial<MockTimeEntry> = {}): MockTimeEntry {
  const now = Date.now();
  return {
    _id: "entry-1" as Id<"timeEntries">,
    date: now,
    startTime: now - 3600000,
    duration: 3600,
    ...overrides,
  };
}

describe("TimeEntriesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEntries = undefined;
    mockDeleteEntry.mockResolvedValue({});
  });

  describe("Loading State", () => {
    it("should render loading spinner when data is loading", () => {
      mockEntries = undefined;

      render(<TimeEntriesList />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no entries exist", () => {
      mockEntries = [];

      render(<TimeEntriesList />);

      expect(screen.getByText("No time entries")).toBeInTheDocument();
      expect(screen.getByText("Start tracking time to see entries here.")).toBeInTheDocument();
    });
  });

  describe("Entries List", () => {
    it("should render Add Time Entry button", () => {
      mockEntries = [createMockEntry()];

      render(<TimeEntriesList />);

      expect(screen.getByRole("button", { name: /Add Time Entry/i })).toBeInTheDocument();
    });

    it("should render entry description", () => {
      mockEntries = [createMockEntry({ description: "Working on feature" })];

      render(<TimeEntriesList />);

      expect(screen.getByText("Working on feature")).toBeInTheDocument();
    });

    it("should render entry duration", () => {
      mockEntries = [createMockEntry({ duration: 3600 })]; // 1 hour

      render(<TimeEntriesList />);

      // Duration appears twice: in date header and entry row
      const durations = screen.getAllByText("1h 0m");
      expect(durations.length).toBeGreaterThanOrEqual(1);
    });

    it("should render entry duration in minutes for short entries", () => {
      mockEntries = [createMockEntry({ duration: 1800 })]; // 30 minutes

      render(<TimeEntriesList />);

      // Duration appears twice: in date header and entry row
      const durations = screen.getAllByText("30m");
      expect(durations.length).toBeGreaterThanOrEqual(1);
    });

    it("should render project name when available", () => {
      mockEntries = [createMockEntry({ project: { name: "Test Project" } })];

      render(<TimeEntriesList />);

      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("should render issue key when available", () => {
      mockEntries = [createMockEntry({ issue: { key: "PROJ-123" } })];

      render(<TimeEntriesList />);

      expect(screen.getByText("PROJ-123")).toBeInTheDocument();
    });

    it("should render activity badge when available", () => {
      mockEntries = [createMockEntry({ activity: "Development" })];

      render(<TimeEntriesList />);

      expect(screen.getByText("Development")).toBeInTheDocument();
    });

    it("should render Billable badge when entry is billable", () => {
      mockEntries = [createMockEntry({ billable: true })];

      render(<TimeEntriesList />);

      expect(screen.getByText("Billable")).toBeInTheDocument();
    });

    it("should render Locked indicator when entry is locked", () => {
      mockEntries = [createMockEntry({ isLocked: true })];

      render(<TimeEntriesList />);

      expect(screen.getByText("Locked")).toBeInTheDocument();
    });

    it("should render delete button for unlocked entries", () => {
      mockEntries = [createMockEntry({ isLocked: false, billed: false })];

      render(<TimeEntriesList />);

      expect(screen.getByRole("button", { name: /Delete entry/i })).toBeInTheDocument();
    });

    it("should not render delete button for locked entries", () => {
      mockEntries = [createMockEntry({ isLocked: true })];

      render(<TimeEntriesList />);

      expect(screen.queryByRole("button", { name: /Delete entry/i })).not.toBeInTheDocument();
    });

    it("should not render delete button for billed entries", () => {
      mockEntries = [createMockEntry({ billed: true })];

      render(<TimeEntriesList />);

      expect(screen.queryByRole("button", { name: /Delete entry/i })).not.toBeInTheDocument();
    });
  });

  describe("Date Grouping", () => {
    it("should group entries by date", () => {
      const today = Date.now();
      const yesterday = today - 86400000;

      mockEntries = [
        createMockEntry({ _id: "entry-1" as Id<"timeEntries">, date: today, duration: 3600 }),
        createMockEntry({ _id: "entry-2" as Id<"timeEntries">, date: yesterday, duration: 1800 }),
      ];

      render(<TimeEntriesList />);

      // Should show total duration for each day (appears in header and entry)
      expect(screen.getAllByText("1h 0m").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("30m").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Cost Display", () => {
    it("should render cost when totalCost is available", () => {
      mockEntries = [createMockEntry({ totalCost: 150, currency: "USD" })];

      render(<TimeEntriesList />);

      expect(screen.getByText(/\$150/)).toBeInTheDocument();
    });
  });
});
