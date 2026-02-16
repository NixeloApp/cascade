/**
 * Integration Tests for Hybrid Convex + Fuse.js Search
 *
 * Tests the full pattern of loading data from Convex and applying
 * client-side fuzzy search with Fuse.js.
 */

import { describe, expect, it } from "vitest";
import { useUserFuzzySearch } from "@/hooks/useFuzzySearch";
import { act, renderHook, waitFor } from "@/test/custom-render";

describe("Hybrid Search Integration", () => {
  describe("Convex + Fuse.js Pattern", () => {
    it("should combine Convex data loading with fuzzy search", async () => {
      // Simulate data loaded from Convex
      const convexData = [
        { _id: "1", name: "John Doe", email: "john@example.com" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com" },
        { _id: "3", name: "Bob Johnson", email: "bob@example.com" },
      ];

      // Apply fuzzy search to loaded data
      const { result } = renderHook(() => useUserFuzzySearch(convexData));

      // Initial state: all items
      expect(result.current.results).toHaveLength(3);
      expect(result.current.totalItems).toBe(3);

      // Search with typo
      await act(async () => {
        result.current.search("jhon"); // Typo
      });

      // Should still find John due to fuzzy matching
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
    });

    it("should handle Convex data updates reactively", async () => {
      // Initial data
      const initialData = [{ _id: "1", name: "John Doe", email: "john@example.com" }];

      const { result, rerender } = renderHook(({ data }) => useUserFuzzySearch(data), {
        initialProps: { data: initialData },
      });

      expect(result.current.results).toHaveLength(1);

      // Simulate Convex pushing new data
      const updatedData = [
        { _id: "1", name: "John Doe", email: "john@example.com" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com" },
      ];

      rerender({ data: updatedData });

      // Fuzzy search should work with new data
      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });
    });

    it("should maintain search query across data updates", async () => {
      const initialData = [
        { _id: "1", name: "John Doe", email: "john@example.com" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com" },
      ];

      const { result, rerender } = renderHook(({ data }) => useUserFuzzySearch(data), {
        initialProps: { data: initialData },
      });

      // Search for "john"
      await act(async () => {
        result.current.search("john");
      });

      await waitFor(() => {
        expect(result.current.query).toBe("john");
      });

      // Simulate new data from Convex
      const updatedData = [
        ...initialData,
        { _id: "3", name: "Johnny Appleseed", email: "johnny@example.com" },
      ];

      rerender({ data: updatedData });

      // Query should persist and now match 2 users
      expect(result.current.query).toBe("john");
      expect(result.current.results.length).toBeGreaterThan(1);
    });

    it("should handle undefined data from Convex (loading state)", async () => {
      const { result } = renderHook(() => useUserFuzzySearch(undefined));

      expect(result.current.results).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.hasResults).toBe(false);
    });

    it("should handle empty array from Convex (no data)", async () => {
      const { result } = renderHook(() => useUserFuzzySearch([]));

      expect(result.current.results).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Performance with Debouncing", () => {
    it("should debounce search queries", async () => {
      const data = [
        { _id: "1", name: "John Doe", email: "john@example.com" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com" },
      ];

      const { result } = renderHook(() => useUserFuzzySearch(data));

      // Type quickly
      await act(async () => {
        result.current.search("j");
        result.current.search("jo");
        result.current.search("joh");
        result.current.search("john");
      });

      // Should be debouncing
      await waitFor(() => {
        expect(result.current.isDebouncing).toBe(true);
        expect(result.current.query).toBe("john");
        expect(result.current.debouncedQuery).not.toBe("john");
      });

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current.debouncedQuery).toBe("john");
          expect(result.current.isDebouncing).toBe(false);
        },
        { timeout: 500 },
      );
    });
  });

  describe("Security: Permission Filtering", () => {
    it("should only search through permission-filtered data from Convex", async () => {
      // Simulate Convex returning only authorized users
      // (In real app, Convex backend filters by permissions)
      const authorizedUsers = [
        { _id: "1", name: "Alice Admin", email: "alice@example.com" },
        { _id: "2", name: "Charlie User", email: "charlie@example.com" },
        // Bob (unauthorized) was filtered out by Convex before reaching client
      ];

      const { result } = renderHook(() => useUserFuzzySearch(authorizedUsers));

      // Search should only work with data Convex returned
      await act(async () => {
        result.current.search("bob"); // User that Convex didn't return
      });

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current.isDebouncing).toBe(false);
        },
        { timeout: 500 },
      );

      // No results because Bob wasn't in the Convex response
      await waitFor(() => {
        expect(result.current.results).toHaveLength(0);
      });

      // Can find authorized users
      await act(async () => {
        result.current.search("alice");
      });

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current.isDebouncing).toBe(false);
        },
        { timeout: 500 },
      );

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
        expect(result.current.results[0].item.name).toContain("Alice");
      });
    });

    it("should respect Convex data boundaries", async () => {
      // Simulate project-scoped members (Convex filters by projectId)
      const projectMembers = [
        { _id: "1", name: "Alice", email: "alice@example.com" },
        { _id: "2", name: "Bob", email: "bob@example.com" },
      ];

      const { result } = renderHook(() => useUserFuzzySearch(projectMembers));

      // Can only search within the project members Convex returned
      expect(result.current.totalItems).toBe(2);
      expect(result.current.results).toHaveLength(2);
    });
  });

  describe("Real-world Use Cases", () => {
    it("should support assignee dropdown pattern", async () => {
      // Typical pattern: Load project members, then fuzzy search
      const projectMembers = [
        { _id: "1", name: "John Doe", email: "john@example.com" },
        { _id: "2", name: "Jane Smith", email: "jane@example.com" },
        { _id: "3", name: "Bob Johnson", email: "bob@example.com" },
      ];

      const { result } = renderHook(() => useUserFuzzySearch(projectMembers));

      // User types with typo
      await act(async () => {
        result.current.search("jhon");
      });

      // Should find John despite typo
      const johnResult = result.current.results.find((r) => r.item?.name?.includes("John"));
      expect(johnResult?.item.name).toBeDefined();
    });

    it("should support project switcher pattern", async () => {
      // User's projects from Convex
      const projects = [
        { name: "Nixelo", email: "Project management" },
        { name: "Atlas", email: "Map viewer" },
      ];

      const { result } = renderHook(() => useUserFuzzySearch(projects));

      // Search works on loaded projects
      expect(result.current.totalItems).toBe(2);

      // Can search by project name
      await act(async () => {
        result.current.search("nixelo");
      });

      expect(result.current.results.length).toBeGreaterThan(0);
      expect(result.current.results[0].item.name).toContain("Nixelo");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed data gracefully", async () => {
      const malformedData = [
        { _id: "1", name: "John", email: "john@example.com" },
        { _id: "2" } as any, // Missing name and email
        { _id: "3", name: "Jane", email: "jane@example.com" },
      ];

      const { result } = renderHook(() => useUserFuzzySearch(malformedData));

      // Should still work with valid entries
      await act(async () => {
        result.current.search("john");
      });

      expect(result.current.results.length).toBeGreaterThan(0);
    });

    it("should recover from search errors", async () => {
      const data = [{ _id: "1", name: "John", email: "john@example.com" }];

      const { result } = renderHook(() => useUserFuzzySearch(data));

      // Normal search
      await act(async () => {
        result.current.search("john");
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      // Clear and search again
      await act(async () => {
        result.current.clear();
      });

      await waitFor(() => {
        expect(result.current.query).toBe("");
      });

      await act(async () => {
        result.current.search("john");
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle medium-sized datasets efficiently", async () => {
      // Generate 500 users
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        _id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const { result } = renderHook(() => useUserFuzzySearch(largeDataset));

      const startTime = performance.now();

      await act(async () => {
        result.current.search("user 123");
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Search should complete quickly (< 50ms for 500 items)
      expect(searchTime).toBeLessThan(50);
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    it("should respect limit to optimize large result sets", async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        _id: `${i}`,
        name: `John ${i}`,
        email: `john${i}@example.com`,
      }));

      const { result } = renderHook(() => useUserFuzzySearch(data));

      result.current.search("john");

      // Wait for debounce (useUserFuzzySearch has debounce: 100ms)
      await waitFor(
        () => {
          expect(result.current.isDebouncing).toBe(false);
        },
        { timeout: 500 },
      );

      // useUserFuzzySearch has limit: 10
      await waitFor(() => {
        expect(result.current.results.length).toBeLessThanOrEqual(10);
      });
    });
  });
});
