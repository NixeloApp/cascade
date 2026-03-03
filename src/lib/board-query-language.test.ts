import { describe, expect, it } from "vitest";
import { matchesBoardQuery, parseBoardQuery } from "./board-query-language";

describe("parseBoardQuery", () => {
  it("parses filter tokens and remaining text terms", () => {
    expect(parseBoardQuery("status:done priority:high label:frontend login")).toEqual({
      textTerms: ["login"],
      filters: {
        status: ["done"],
        priority: ["high"],
        labels: ["frontend"],
      },
    });
  });

  it("supports type filter and deduplicates values", () => {
    expect(parseBoardQuery("type:bug type:BUG refactor")).toEqual({
      textTerms: ["refactor"],
      filters: {
        type: ["bug"],
      },
    });
  });
});

describe("matchesBoardQuery", () => {
  const issue = {
    title: "Fix login redirect bug",
    key: "APP-123",
    description: "Auth callback fails",
    status: "done",
    priority: "high",
    type: "bug",
    labels: [{ name: "frontend" }, { name: "auth" }],
  };

  it("matches when all parsed filters are satisfied", () => {
    const parsed = parseBoardQuery("status:done priority:high type:bug label:frontend login");
    expect(matchesBoardQuery(issue, parsed)).toBe(true);
  });

  it("fails when any parsed filter does not match", () => {
    const parsed = parseBoardQuery("status:todo priority:high");
    expect(matchesBoardQuery(issue, parsed)).toBe(false);
  });

  it("matches plain text-only query terms", () => {
    const parsed = parseBoardQuery("APP-123 callback");
    expect(matchesBoardQuery(issue, parsed)).toBe(true);
  });
});
