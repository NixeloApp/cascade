import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ProfileContent } from "./ProfileContent";

const mockUser = {
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
  emailVerificationTime: 1234567890,
};

const mockStats = {
  workspaces: 5,
  issuesCreated: 10,
  issuesAssigned: 3,
  issuesCompleted: 7,
  comments: 42,
};

const mockUpdateProfile = vi.fn();

// Mock convex/react with ALL required hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn((query, args) => {
    if (args === "skip") return undefined;
    const queryStr = query?.toString() || "";
    if (queryStr.includes("getUserStats")) return mockStats;
    return mockUser;
  }),
  useMutation: vi.fn(() => mockUpdateProfile),
  useAction: vi.fn(),
  useConvexAuth: vi.fn(() => ({ isLoading: false, isAuthenticated: true })),
}));

// Mock API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    users: {
      getCurrent: "api.users.getCurrent",
      getUser: "api.users.getUser",
      getUserStats: "api.users.getUserStats",
      updateProfile: "api.users.updateProfile",
    },
  },
}));

describe("ProfileContent", () => {
  it("renders user info and stats", () => {
    render(<ProfileContent />);

    // Check user info renders
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    // Check stats section exists
    expect(screen.getByText("Workspaces")).toBeInTheDocument();
  });

  it("allows editing profile", async () => {
    const user = userEvent.setup();
    render(<ProfileContent />);

    const editButton = screen.getByText("Edit Profile");
    await user.click(editButton);

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue("Test User");
    expect(nameInput).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    // The mutation includes both name and email
    expect(mockUpdateProfile).toHaveBeenCalled();
    const call = mockUpdateProfile.mock.calls[0][0];
    expect(call.name).toBe("Updated Name");
  });
});
