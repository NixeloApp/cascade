import { describe, expect, it } from "vitest";
import { arrayToCSV, issuesToCSV } from "./csv";

describe("arrayToCSV", () => {
  it("should convert an array of objects to CSV string", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const result = arrayToCSV(data);
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("should handle custom columns", () => {
    const data = [
      { name: "Alice", age: 30, role: "Admin" },
      { name: "Bob", age: 25, role: "User" },
    ];
    const columns = [
      { key: "name", label: "Full Name" },
      { key: "role", label: "Role" },
    ];
    // @ts-expect-error -- testing dynamic usage or just matching the type
    const result = arrayToCSV(data, columns);
    expect(result).toBe("Full Name,Role\nAlice,Admin\nBob,User");
  });

  it("should escape values containing commas", () => {
    const data = [{ message: "Hello, World" }];
    const result = arrayToCSV(data);
    expect(result).toBe('message\n"Hello, World"');
  });

  it("should escape values containing double quotes", () => {
    const data = [{ message: 'Hello "World"' }];
    const result = arrayToCSV(data);
    expect(result).toBe('message\n"Hello ""World"""');
  });

  it("should escape values containing newlines", () => {
    const data = [{ message: "Hello\nWorld" }];
    const result = arrayToCSV(data);
    expect(result).toBe('message\n"Hello\nWorld"');
  });

  it("should handle mixed escaping", () => {
    const data = [{ message: 'Hello, "World"\nNew Line' }];
    const result = arrayToCSV(data);
    expect(result).toBe('message\n"Hello, ""World""\nNew Line"');
  });

  it("should format booleans", () => {
    const data = [{ isActive: true }, { isActive: false }];
    const result = arrayToCSV(data);
    expect(result).toBe("isActive\ntrue\nfalse");
  });

  it("should format dates", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const data = [{ created: date }];
    const result = arrayToCSV(data);
    expect(result).toBe(`created\n${date.toISOString()}`);
  });

  it("should format arrays", () => {
    const data = [{ tags: ["urgent", "bug"] }];
    const result = arrayToCSV(data);
    expect(result).toBe("tags\nurgent; bug");
  });

  it("should format objects using JSON.stringify", () => {
    const data = [{ metadata: { id: 1 } }];
    const result = arrayToCSV(data);
    expect(result).toBe('metadata\n"{""id"":1}"');
  });

  it("should handle null and undefined", () => {
    const data = [{ value: null }, { value: undefined }];
    const result = arrayToCSV(data);
    expect(result).toBe("value\n\n");
  });

  it("should return empty string for empty array", () => {
    const result = arrayToCSV([]);
    expect(result).toBe("");
  });
});

describe("issuesToCSV", () => {
  it("should format issues correctly", () => {
    const issues = [
      {
        key: "PROJ-1",
        title: "Fix bug",
        type: "bug",
        status: "open",
        priority: "high",
        assignee: { name: "Alice" },
        reporter: { name: "Bob" },
        createdAt: 1672531200000, // 2023-01-01T00:00:00.000Z
        updatedAt: 1672617600000, // 2023-01-02T00:00:00.000Z
        dueDate: 1672704000000, // 2023-01-03T00:00:00.000Z
        estimatedHours: 4,
        loggedHours: 2,
        labels: ["frontend", "urgent"],
        description: "Fix the bug",
      },
    ];

    const result = issuesToCSV(issues);
    const lines = result.split("\n");

    // Check header
    expect(lines[0]).toBe(
      "Issue Key,Title,Type,Status,Priority,Assignee,Reporter,Created,Updated,Due Date,Estimated Hours,Logged Hours,Labels,Description",
    );

    // Check data row
    const expectedRow = [
      "PROJ-1",
      "Fix bug",
      "bug",
      "open",
      "high",
      "Alice",
      "Bob",
      new Date(1672531200000).toISOString(),
      new Date(1672617600000).toISOString(),
      new Date(1672704000000).toISOString(),
      "4",
      "2",
      "frontend; urgent",
      "Fix the bug",
    ].join(",");

    expect(lines[1]).toBe(expectedRow);
  });

  it("should handle missing optional fields", () => {
    const issues = [
      {
        key: "PROJ-2",
        title: "Feature",
        type: "feature",
        status: "todo",
        priority: "medium",
        assignee: null,
        reporter: null,
        createdAt: 1672531200000,
        updatedAt: 1672617600000,
        labels: [],
      },
    ];

    const result = issuesToCSV(issues);
    const lines = result.split("\n");

    const expectedRow = [
      "PROJ-2",
      "Feature",
      "feature",
      "todo",
      "medium",
      "Unassigned",
      "Unknown",
      new Date(1672531200000).toISOString(),
      new Date(1672617600000).toISOString(),
      "", // no dueDate
      "", // no estimatedHours
      "", // no loggedHours
      "", // no labels
      "", // no description
    ].join(",");

    expect(lines[1]).toBe(expectedRow);
  });
});
