import { describe, expect, it } from "vitest";
import {
  parseContactCustomFieldsInput,
  parseContactTagsInput,
  parseOutreachContactImportCsv,
  stringifyContactCustomFields,
} from "./outreachParsing";

describe("outreachParsing", () => {
  it("parses contact-import CSV with quoted values, tags, and custom fields", () => {
    const parsed = parseOutreachContactImportCsv(
      [
        'Email,First Name,Last Name,Company,Tags,"Favorite Product"',
        'alex@example.com,Alex,Stone,"Acme, Inc.","vip; west",Roadmap',
        'jamie@example.com,Jamie,River,Northstar,"trial|beta","Issue ""Radar"""',
      ].join("\n"),
    );

    expect(parsed.headers).toEqual([
      "Email",
      "First Name",
      "Last Name",
      "Company",
      "Tags",
      "Favorite Product",
    ]);
    expect(parsed.contacts).toEqual([
      {
        email: "alex@example.com",
        firstName: "Alex",
        lastName: "Stone",
        company: "Acme, Inc.",
        tags: ["vip", "west"],
        customFields: {
          "Favorite Product": "Roadmap",
        },
      },
      {
        email: "jamie@example.com",
        firstName: "Jamie",
        lastName: "River",
        company: "Northstar",
        tags: ["trial", "beta"],
        customFields: {
          "Favorite Product": 'Issue "Radar"',
        },
      },
    ]);
    expect(parsed.issues).toEqual([]);
    expect(parsed.skippedEmptyRows).toBe(0);
  });

  it("rejects CSV imports that omit the email column", () => {
    expect(() =>
      parseOutreachContactImportCsv(["First Name,Company", "Alex,Acme"].join("\n")),
    ).toThrowError("CSV must include an email column.");
  });

  it("parses and stringifies contact custom fields", () => {
    const customFields = parseContactCustomFieldsInput(
      ["role=Founder", "favoriteColor=Blue"].join("\n"),
    );

    expect(customFields).toEqual({
      favoriteColor: "Blue",
      role: "Founder",
    });
    expect(stringifyContactCustomFields(customFields)).toBe("favoriteColor=Blue\nrole=Founder");
  });

  it("normalizes tag input into a unique trimmed list", () => {
    expect(parseContactTagsInput("vip, west; vip | beta")).toEqual(["vip", "west", "beta"]);
  });

  it("keeps valid rows importable while surfacing duplicate and invalid email rows", () => {
    const parsed = parseOutreachContactImportCsv(
      [
        "email,first name",
        "alex@example.com,Alex",
        "alex@example.com,Alex Duplicate",
        "bad-email,Bad",
        ",Missing",
        "jamie@example.com,Jamie",
      ].join("\n"),
    );

    expect(parsed.contacts).toEqual([
      { email: "alex@example.com", firstName: "Alex" },
      { email: "jamie@example.com", firstName: "Jamie" },
    ]);
    expect(parsed.issues).toEqual([
      {
        email: "alex@example.com",
        kind: "duplicate_email",
        message:
          "Row 3 duplicates alex@example.com, so only the first occurrence will be imported.",
        rowNumber: 3,
      },
      {
        email: "bad-email",
        kind: "invalid_email",
        message: "Row 4 has an invalid email address (bad-email).",
        rowNumber: 4,
      },
      {
        kind: "missing_email",
        message: "Row 5 is missing an email address.",
        rowNumber: 5,
      },
    ]);
  });

  it("returns issues instead of throwing when a CSV has rows but nothing importable", () => {
    const parsed = parseOutreachContactImportCsv(
      ["email,first name", "bad-email,Bad", ",Missing"].join("\n"),
    );

    expect(parsed.contacts).toEqual([]);
    expect(parsed.issues).toHaveLength(2);
  });
});
