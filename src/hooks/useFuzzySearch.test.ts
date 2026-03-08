import { act } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@/test/custom-render";
import {
  highlightMatches,
  useDocumentFuzzySearch,
  useFuzzySearch,
  useIssueFuzzySearch,
  useLabelFuzzySearch,
  useProjectFuzzySearch,
  useSprintFuzzySearch,
  useUserFuzzySearch,
} from "./useFuzzySearch";

function expectDefined<T>(value: T | undefined, label: string): T {
  expect(value, `${label} should be defined`).not.toBeUndefined();
  if (value === undefined) {
    throw new Error(`${label} should be defined`);
  }
  return value;
}

describe("useFuzzySearch", () => {
  const sampleUsers = [
    { _id: "1", name: "John Doe", email: "john@example.com" },
    { _id: "2", name: "Jane Smith", email: "jane@example.com" },
    { _id: "3", name: "Bob Johnson", email: "bob@example.com" },
  ];

  it("should return all items when query is empty", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name", "email"],
      }),
    );

    expect(result.current.results).toHaveLength(3);
    expect(result.current.results[0].item.name).toBe("John Doe");
  });

  it("should filter items based on query", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name", "email"],
      }),
    );

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
      expect(result.current.results[0].item.name).toContain("John");
    });
  });

  it("should handle typos with fuzzy matching", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
        threshold: 0.5, // More permissive for typos
      }),
    );

    act(() => {
      result.current.search("jon"); // Typo: "jon" instead of "john"
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
      // Should fuzzy match "John"
      const johnResult = expectDefined(
        result.current.results.find((r) => r.item.name.includes("John")),
        "John search result",
      );
      expect(johnResult.item.name).toBe("John Doe");
    });
  });

  it("should respect limit option", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
        limit: 1,
      }),
    );

    act(() => {
      result.current.search("j");
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
  });

  it("should clear query", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
      }),
    );

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      expect(result.current.query).toBe("john");
    });

    act(() => {
      result.current.clear();
    });

    await waitFor(() => {
      expect(result.current.query).toBe("");
      expect(result.current.results).toHaveLength(3); // Back to all items
    });
  });

  it("should debounce search query", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
        debounce: 100,
      }),
    );

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      // Immediately after search, debounced query should be empty
      expect(result.current.query).toBe("john");
      expect(result.current.debouncedQuery).toBe("");
      expect(result.current.isDebouncing).toBe(true);
    });

    // Wait for debounce
    await waitFor(
      () => {
        expect(result.current.debouncedQuery).toBe("john");
        expect(result.current.isDebouncing).toBe(false);
      },
      { timeout: 200 },
    );
  });

  it("should indicate searching state", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
      }),
    );

    expect(result.current.isSearching).toBe(false);

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(true);
    });
  });

  it("should indicate when results exist", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
      }),
    );

    expect(result.current.hasResults).toBe(true);

    act(() => {
      result.current.search("xyz123nonexistent");
    });

    await waitFor(() => {
      expect(result.current.hasResults).toBe(false);
    });
  });

  it("should return total items count", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: ["name"],
      }),
    );

    expect(result.current.totalItems).toBe(3);
  });

  it("should handle undefined items", () => {
    const { result } = renderHook(() =>
      useFuzzySearch(undefined, {
        keys: ["name"],
      }),
    );

    expect(result.current.results).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it("should handle empty array", () => {
    const { result } = renderHook(() =>
      useFuzzySearch([], {
        keys: ["name"],
      }),
    );

    expect(result.current.results).toHaveLength(0);
  });

  it("should prioritize weighted keys", async () => {
    const { result } = renderHook(() =>
      useFuzzySearch(sampleUsers, {
        keys: [
          { name: "name", weight: 3 },
          { name: "email", weight: 1 },
        ],
      }),
    );

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      // Name match should rank higher than email match
      expect(result.current.results[0].item.name).toBe("John Doe");
    });
  });
});

describe("useUserFuzzySearch", () => {
  const users = [
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
  ];

  it("should search users by name and email", async () => {
    const { result } = renderHook(() => useUserFuzzySearch(users));

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
      expect(result.current.results[0].item.name).toBe("John Doe");
    });
  });

  it("should have debounce enabled", async () => {
    const { result } = renderHook(() => useUserFuzzySearch(users));

    act(() => {
      result.current.search("john");
    });

    await waitFor(() => {
      expect(result.current.isDebouncing).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isDebouncing).toBe(false);
    });
  });
});

describe("useProjectFuzzySearch", () => {
  const projects = [
    { name: "Project Alpha", key: "ALPHA", description: "First project" },
    { name: "Project Beta", key: "BETA", description: "Second project" },
  ];

  it("should search projects by name, key, and description", async () => {
    const { result } = renderHook(() => useProjectFuzzySearch(projects));

    act(() => {
      result.current.search("alpha");
    });

    await waitFor(() => {
      expect(result.current.results[0].item.name).toBe("Project Alpha");
    });
  });

  it("should match project keys", async () => {
    const { result } = renderHook(() => useProjectFuzzySearch(projects));

    act(() => {
      result.current.search("BETA");
    });

    await waitFor(() => {
      // Should find BETA project
      const betaProject = expectDefined(
        result.current.results.find((r) => r.item.key === "BETA"),
        "BETA project result",
      );
      expect(betaProject.item.key).toBe("BETA");
      expect(betaProject.item.name).toBe("Project Beta");
    });
  });
});

describe("useIssueFuzzySearch", () => {
  const issues = [
    { title: "Fix login bug", key: "PROJ-123", description: "Users cannot login" },
    { title: "Add dark mode", key: "PROJ-124", description: "Implement dark theme" },
  ];

  it("should search issues by title and key", async () => {
    const { result } = renderHook(() => useIssueFuzzySearch(issues));

    act(() => {
      result.current.search("PROJ-123");
    });

    await waitFor(() => {
      expect(result.current.results[0].item.key).toBe("PROJ-123");
    });
  });

  it("should match issue titles", async () => {
    const { result } = renderHook(() => useIssueFuzzySearch(issues));

    act(() => {
      result.current.search("dark mode");
    });

    await waitFor(() => {
      // Should find "Add dark mode" issue
      const darkModeIssue = expectDefined(
        result.current.results.find((r) => r.item.title.includes("dark mode")),
        "dark mode issue result",
      );
      expect(darkModeIssue.item.key).toBe("PROJ-124");
      expect(darkModeIssue.item.title).toBe("Add dark mode");
    });
  });
});

describe("useSprintFuzzySearch", () => {
  const sprints = [
    { name: "Sprint 1", goal: "Foundation" },
    { name: "Sprint 2", goal: "Polish" },
  ];

  it("should search sprints by name", async () => {
    const { result } = renderHook(() => useSprintFuzzySearch(sprints));

    act(() => {
      result.current.search("sprint 1");
    });

    await waitFor(() => {
      expect(result.current.results[0].item.name).toBe("Sprint 1");
    });
  });
});

describe("useLabelFuzzySearch", () => {
  const labels = ["bug", "feature", "enhancement", "documentation"];

  it("should search labels", async () => {
    const { result } = renderHook(() => useLabelFuzzySearch(labels));

    act(() => {
      result.current.search("bug");
    });

    await waitFor(() => {
      expect(result.current.results[0].item.label).toBe("bug");
    });
  });

  it("should handle typos in labels", async () => {
    const { result } = renderHook(() => useLabelFuzzySearch(labels));

    act(() => {
      result.current.search("enhanc"); // Partial match
    });

    await waitFor(() => {
      // Should find "enhancement"
      const enhancementLabel = expectDefined(
        result.current.results.find((r) => r.item.label === "enhancement"),
        "enhancement label result",
      );
      expect(enhancementLabel.item.label).toBe("enhancement");
    });
  });
});

describe("useDocumentFuzzySearch", () => {
  const documents = [
    { title: "Getting Started", description: "Introduction to the platform" },
    { title: "API Reference", description: "Detailed API documentation" },
  ];

  it("should search documents by title", async () => {
    const { result } = renderHook(() => useDocumentFuzzySearch(documents));

    act(() => {
      result.current.search("getting started");
    });

    await waitFor(() => {
      expect(result.current.results[0].item.title).toBe("Getting Started");
    });
  });
});

describe("highlightMatches", () => {
  it("should return text without highlights when no matches", () => {
    const result = highlightMatches("Hello World", undefined);

    expect(result).toEqual([{ text: "Hello World", highlight: false }]);
  });

  it("should highlight single match", () => {
    const result = highlightMatches("Hello World", [[0, 4]]);

    expect(result).toEqual([
      { text: "Hello", highlight: true },
      { text: " World", highlight: false },
    ]);
  });

  it("should highlight multiple matches", () => {
    const result = highlightMatches("Hello World", [
      [0, 4],
      [6, 10],
    ]);

    expect(result).toEqual([
      { text: "Hello", highlight: true },
      { text: " ", highlight: false },
      { text: "World", highlight: true },
    ]);
  });

  it("should handle empty indices array", () => {
    const result = highlightMatches("Hello World", []);

    expect(result).toEqual([{ text: "Hello World", highlight: false }]);
  });
});
