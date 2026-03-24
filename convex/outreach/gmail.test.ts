import { describe, expect, it } from "vitest";

describe("outreach gmail", () => {
  it("exports Gmail integration functions", async () => {
    const mod = await import("./gmail");
    expect(mod).toHaveProperty("sendViaGmailAction");
    expect(mod).toHaveProperty("checkReplies");
    expect(mod).toHaveProperty("checkAllMailboxReplies");
    expect(mod).toHaveProperty("getMailboxTokens");
    expect(mod).toHaveProperty("updateMailboxTokens");
    expect(mod).toHaveProperty("findEnrollmentForReply");
  });
});
