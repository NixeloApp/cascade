import { describe, expect, it } from "vitest";
import { parseIssueSearchShortcuts } from "./search-shortcuts";

describe("parseIssueSearchShortcuts", () => {
  it("returns plain query when no shortcuts are present", () => {
    expect(parseIssueSearchShortcuts("fix auth flow")).toEqual({
      textQuery: "fix auth flow",
      filters: {},
      hasShortcuts: false,
    });
  });

  it("extracts type/status and @me filters", () => {
    expect(parseIssueSearchShortcuts("type:bug status:done @me auth")).toEqual({
      textQuery: "auth",
      filters: {
        type: ["bug"],
        status: ["done"],
        assigneeId: "me",
      },
      hasShortcuts: true,
    });
  });

  it("deduplicates repeated shortcut values", () => {
    expect(parseIssueSearchShortcuts("type:bug type:BUG status:todo status:todo bug")).toEqual({
      textQuery: "bug",
      filters: {
        type: ["bug"],
        status: ["todo"],
      },
      hasShortcuts: true,
    });
  });

  it("keeps malformed tokens in text query", () => {
    expect(parseIssueSearchShortcuts("type: status: @someone login")).toEqual({
      textQuery: "type: status: @someone login",
      filters: {},
      hasShortcuts: false,
    });
  });
});
