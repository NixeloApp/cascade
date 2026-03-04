import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock data
let mockProjects: { page: { _id: string; name: string; key: string }[] } | undefined;
const mockCreateEvent = vi.fn();

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockProjects),
  useMutation: vi.fn(() => mockCreateEvent),
}));

// Import after mocks
import { CreateEventModal } from "./CreateEventModal";

describe("CreateEventModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProjects = { page: [] };
    mockCreateEvent.mockResolvedValue({});
  });

  describe("Rendering", () => {
    it("should render dialog when open", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      // Title appears as heading, button text also says "Create Event"
      expect(screen.getByRole("heading", { name: "Create Event" })).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(<CreateEventModal {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render title input", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    });

    it("should render event type buttons", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /meeting/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /deadline/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /timeblock/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /personal/i })).toBeInTheDocument();
    });

    it("should render date input", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });

    it("should render start time input", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    });

    it("should render end time input", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    });

    it("should render all day checkbox", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/All day event/i)).toBeInTheDocument();
    });

    it("should render description textarea", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it("should render location input", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    });
  });

  describe("Event Type Selection", () => {
    it("should select meeting type by default", () => {
      render(<CreateEventModal {...defaultProps} />);

      const meetingButton = screen.getByRole("button", { name: /meeting/i });
      // Primary variant indicates selection
      expect(meetingButton).toHaveClass("bg-linear-to-r");
    });

    it("should change event type when clicking different type", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /deadline/i }));

      const deadlineButton = screen.getByRole("button", { name: /deadline/i });
      expect(deadlineButton).toHaveClass("bg-linear-to-r");
    });

    it("should show meeting URL input only for meeting type", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Meeting Link/i)).toBeInTheDocument();
    });

    it("should show required attendance checkbox only for meeting type", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByLabelText(/Required attendance/i)).toBeInTheDocument();
    });

    it("should hide meeting URL when non-meeting type selected", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /deadline/i }));

      expect(screen.queryByLabelText(/Meeting Link/i)).not.toBeInTheDocument();
    });
  });

  describe("Color Selection", () => {
    it("should render color picker buttons", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Select blue color/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Select green color/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Select red color/i })).toBeInTheDocument();
    });
  });

  describe("All Day Toggle", () => {
    it("should disable time inputs when all day is checked", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal {...defaultProps} />);

      await user.click(screen.getByLabelText(/All day event/i));

      expect(screen.getByLabelText(/Start Time/i)).toBeDisabled();
      expect(screen.getByLabelText(/End Time/i)).toBeDisabled();
    });
  });

  describe("Project Selection", () => {
    it("should render project selection dropdown", () => {
      mockProjects = {
        page: [{ _id: "project-1", name: "Test Project", key: "TEST" }],
      };

      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByText(/Link to Project/i)).toBeInTheDocument();
    });

    it("should show No project option by default", () => {
      render(<CreateEventModal {...defaultProps} />);

      // "No project" appears in both placeholder and option
      expect(screen.getAllByText(/No project/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Form Actions", () => {
    it("should render Cancel button", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("should render Create Event button", () => {
      render(<CreateEventModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /Create Event/i })).toBeInTheDocument();
    });

    it("should call onOpenChange when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<CreateEventModal open={true} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Default Date", () => {
    it("should use provided default date", () => {
      const testDate = new Date("2026-03-15");

      render(<CreateEventModal {...defaultProps} defaultDate={testDate} />);

      const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
      expect(dateInput.value).toBe("2026-03-15");
    });
  });
});
