import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { OutOfOfficeSettings } from "./OutOfOfficeSettings";

const mockSave = vi.fn();
const mockClear = vi.fn();
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();

let mockStatus: {
  startsAt: number;
  endsAt: number;
  reason: "vacation" | "travel" | "sick_leave" | "public_holiday";
  note?: string;
  delegateUserId?: string;
  delegate?: {
    _id: string;
    name: string;
    image?: string;
  };
  updatedAt: number;
  isActive: boolean;
} | null = null;

const mockCurrentUser = {
  _id: "user_self",
};

const mockSearchUsers = [
  { _id: "user_delegate", name: "Casey Delegate", email: "casey@example.com" },
  { _id: "user_self", name: "Self User", email: "self@example.com" },
] as const;

vi.mock("convex/react", () => ({
  useQuery: vi.fn((query) => {
    const queryName = query?.toString() ?? "";
    if (queryName.includes("outOfOffice.getCurrent")) {
      return mockStatus;
    }
    if (queryName.includes("users.getCurrent")) {
      return mockCurrentUser;
    }
    if (queryName.includes("users.searchUsers")) {
      return mockSearchUsers;
    }
    return undefined;
  }),
  useMutation: vi.fn((mutation) => {
    const mutationName = mutation?.toString() ?? "";
    if (mutationName.includes("outOfOffice.upsert")) {
      return mockSave;
    }
    if (mutationName.includes("outOfOffice.clear")) {
      return mockClear;
    }
    return vi.fn();
  }),
  useAction: vi.fn(),
  useConvexAuth: vi.fn(() => ({ isLoading: false, isAuthenticated: true })),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    outOfOffice: {
      getCurrent: "api.outOfOffice.getCurrent",
      upsert: "api.outOfOffice.upsert",
      clear: "api.outOfOffice.clear",
    },
    users: {
      getCurrent: "api.users.getCurrent",
      searchUsers: "api.users.searchUsers",
    },
  },
}));

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => mockShowError(...args),
  showSuccess: (...args: unknown[]) => mockShowSuccess(...args),
}));

describe("OutOfOfficeSettings", () => {
  beforeEach(() => {
    mockStatus = null;
    mockSave.mockReset();
    mockClear.mockReset();
    mockShowError.mockReset();
    mockShowSuccess.mockReset();
  });

  it("renders the saved status summary", () => {
    mockStatus = {
      startsAt: new Date("2026-03-20T00:00:00Z").getTime(),
      endsAt: new Date("2026-03-22T23:59:59Z").getTime(),
      reason: "vacation",
      note: "Annual leave",
      delegate: {
        _id: "user_delegate",
        name: "Casey Delegate",
      },
      updatedAt: Date.now(),
      isActive: true,
    };

    render(<OutOfOfficeSettings />);

    expect(screen.getByText("Active now")).toBeInTheDocument();
    expect(screen.getByText("Vacation", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Annual leave", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Assignment delegate: Casey Delegate")).toBeInTheDocument();
  });

  it("submits the selected range, reason, and delegate", async () => {
    const user = userEvent.setup();
    render(<OutOfOfficeSettings />);

    await user.type(screen.getByLabelText("Start date"), "2026-03-20");
    await user.type(screen.getByLabelText("End date"), "2026-03-22");
    await user.selectOptions(screen.getByLabelText("Reason"), "travel");
    await user.type(screen.getByLabelText("Note"), "Conference week");
    await user.selectOptions(screen.getByLabelText("Delegate assignments to"), "user_delegate");
    await user.click(screen.getByRole("button", { name: "Save OOO" }));

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "travel",
        note: "Conference week",
        delegateUserId: "user_delegate",
      }),
    );
    const payload = mockSave.mock.calls[0]?.[0];
    expect(payload?.endsAt).toBeGreaterThan(payload?.startsAt);
  });

  it("clears the stored status", async () => {
    const user = userEvent.setup();
    mockStatus = {
      startsAt: new Date("2026-03-20T00:00:00Z").getTime(),
      endsAt: new Date("2026-03-22T23:59:59Z").getTime(),
      reason: "vacation",
      updatedAt: Date.now(),
      isActive: false,
    };

    render(<OutOfOfficeSettings />);
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(mockClear).toHaveBeenCalledWith({});
  });
});
