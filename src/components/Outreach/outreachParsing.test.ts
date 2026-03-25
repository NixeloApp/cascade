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
});
