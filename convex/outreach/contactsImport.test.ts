import { describe, expect, it, vi } from "vitest";
import type { Id } from "../_generated/dataModel";
import { importContactsForOrganization, type OutreachContactImportInput } from "./contacts";

const TEST_ORGANIZATION_ID = "org_1" as Id<"organizations">;
const TEST_USER_ID = "user_1" as Id<"users">;

function createImportCtx({
  existingEmails = [],
  suppressedEmails = [],
}: {
  existingEmails?: string[];
  suppressedEmails?: string[];
}) {
  type QueryBuilder = {
    eq: (field: string, value: string | Id<"organizations">) => QueryBuilder;
  };

  const persistedEmails = new Set(existingEmails);
  const suppressedEmailSet = new Set(suppressedEmails);
  const insertedRecords: Array<Record<string, unknown>> = [];

  const insert = vi.fn(async (_table: string, value: Record<string, unknown>) => {
    insertedRecords.push(value);
    const insertedEmail = typeof value.email === "string" ? value.email : null;
    if (insertedEmail) {
      persistedEmails.add(insertedEmail);
    }
    return "contact_new";
  });

  const query = vi.fn((table: string) => ({
    withIndex: (_indexName: string, buildIndex: (builder: QueryBuilder) => unknown) => {
      let capturedEmail = "";
      const builder: QueryBuilder = {
        eq: (_field: string, value: string | Id<"organizations">) => {
          if (typeof value === "string") {
            capturedEmail = value;
          }
          return builder;
        },
      };

      buildIndex(builder);

      const exists =
        table === "outreachContacts"
          ? persistedEmails.has(capturedEmail)
          : suppressedEmailSet.has(capturedEmail);

      return {
        first: async () => (exists ? { _id: `${table}:${capturedEmail}` } : null),
      };
    },
  }));

  return {
    storage: {
      findExistingContact: async (_organizationId: Id<"organizations">, email: string) => {
        const result = await query("outreachContacts").withIndex(
          "by_organization_email",
          (builder) => builder.eq("organizationId", TEST_ORGANIZATION_ID).eq("email", email),
        );
        return result.first();
      },
      findSuppression: async (_organizationId: Id<"organizations">, email: string) => {
        const result = await query("outreachSuppressions").withIndex(
          "by_organization_email",
          (builder) => builder.eq("organizationId", TEST_ORGANIZATION_ID).eq("email", email),
        );
        return result.first();
      },
      insertContact: async (contact: Record<string, unknown>) =>
        insert("outreachContacts", contact),
    },
    insert,
    insertedRecords,
  };
}

describe("importContactsForOrganization", () => {
  it("imports valid contacts and reports invalid, existing, and suppressed skips separately", async () => {
    const { storage, insert, insertedRecords } = createImportCtx({
      existingEmails: ["existing@example.com"],
      suppressedEmails: ["blocked@example.com"],
    });

    const contacts: OutreachContactImportInput[] = [
      { email: "valid@example.com", firstName: "Valid" },
      { email: "existing@example.com", firstName: "Existing" },
      { email: "blocked@example.com", firstName: "Blocked" },
      { email: "bad-email", firstName: "Bad" },
      { email: "valid@example.com", firstName: "Duplicate in batch" },
    ];

    const result = await importContactsForOrganization(
      storage,
      TEST_ORGANIZATION_ID,
      TEST_USER_ID,
      contacts,
    );

    expect(result).toEqual({
      imported: 1,
      sampleExistingEmails: ["existing@example.com", "valid@example.com"],
      sampleInvalidEmails: ["bad-email"],
      sampleSuppressedEmails: ["blocked@example.com"],
      skipped: 4,
      skippedExisting: 2,
      skippedInvalid: 1,
      skippedSuppressed: 1,
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insertedRecords).toEqual([
      expect.objectContaining({
        createdBy: TEST_USER_ID,
        email: "valid@example.com",
        firstName: "Valid",
        organizationId: TEST_ORGANIZATION_ID,
        source: "csv_import",
      }),
    ]);
  });

  it("caps sample email feedback lists so large imports stay bounded", async () => {
    const { storage } = createImportCtx({
      existingEmails: [
        "one@example.com",
        "two@example.com",
        "three@example.com",
        "four@example.com",
        "five@example.com",
        "six@example.com",
      ],
    });

    const contacts: OutreachContactImportInput[] = [
      { email: "one@example.com" },
      { email: "two@example.com" },
      { email: "three@example.com" },
      { email: "four@example.com" },
      { email: "five@example.com" },
      { email: "six@example.com" },
    ];

    const result = await importContactsForOrganization(
      storage,
      TEST_ORGANIZATION_ID,
      TEST_USER_ID,
      contacts,
    );

    expect(result.skippedExisting).toBe(6);
    expect(result.sampleExistingEmails).toEqual([
      "one@example.com",
      "two@example.com",
      "three@example.com",
      "four@example.com",
      "five@example.com",
    ]);
  });
});
