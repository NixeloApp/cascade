import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { renderHook } from "@/test/custom-render";
import { useCurrentUser } from "./useCurrentUser";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    users: {
      getCurrent: "api.users.getCurrent",
    },
  },
}));

const mockUser = {
  _id: "user123" as const,
  _creationTime: Date.now(),
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
};

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should return isLoading=true when user is undefined", () => {
      (useQuery as Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(true); // undefined !== null
    });
  });

  describe("Not Authenticated", () => {
    it("should return isAuthenticated=false when user is null", () => {
      (useQuery as Mock).mockReturnValue(null);

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Authenticated", () => {
    it("should return user data when authenticated", () => {
      (useQuery as Mock).mockReturnValue(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should provide access to user properties", () => {
      (useQuery as Mock).mockReturnValue(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user?.name).toBe("Test User");
      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.user?.image).toBe("https://example.com/avatar.jpg");
    });
  });

  describe("State Transitions", () => {
    it("should transition from loading to authenticated", () => {
      const mockUseQuery = useQuery as Mock;

      // Start in loading state
      mockUseQuery.mockReturnValue(undefined);
      const { result, rerender } = renderHook(() => useCurrentUser());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);

      // Transition to authenticated
      mockUseQuery.mockReturnValue(mockUser);
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it("should transition from loading to not authenticated", () => {
      const mockUseQuery = useQuery as Mock;

      // Start in loading state
      mockUseQuery.mockReturnValue(undefined);
      const { result, rerender } = renderHook(() => useCurrentUser());

      expect(result.current.isLoading).toBe(true);

      // Transition to not authenticated
      mockUseQuery.mockReturnValue(null);
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe("API Call", () => {
    it("should call useQuery with the correct API endpoint", () => {
      (useQuery as Mock).mockReturnValue(mockUser);

      renderHook(() => useCurrentUser());

      expect(useQuery).toHaveBeenCalledWith("api.users.getCurrent");
    });
  });
});
