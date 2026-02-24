import { describe, expect, it, vi } from "vitest";
import { sendEmailNotification } from "./helpers";

describe("sendEmailNotification", () => {
  it("should use provided issue/project/actorName and avoid redundant DB lookups", async () => {
    const mockDbGet = vi.fn().mockImplementation(async (id) => {
      if (id === "user1") return { _id: "user1", email: "test@test.com" };
      throw new Error(`Unexpected db.get call for ${id}`);
    });

    const mockRunQuery = vi.fn().mockResolvedValue(true); // shouldSendEmail = true
    const mockRunAfter = vi.fn();

    const ctx = {
      db: { get: mockDbGet },
      runQuery: mockRunQuery,
      scheduler: { runAfter: mockRunAfter },
    } as any;

    const issue = {
      _id: "issue1",
      projectId: "project1",
      key: "PROJ-1",
      title: "Test Issue",
      type: "task",
      priority: "medium",
      dueDate: 123,
    } as any;
    const project = { _id: "project1", name: "Test Project" } as any;
    const actorName = "Test Actor";

    // Override IS_TEST_ENV to allow function to run
    const originalEnv = process.env.IS_TEST_ENV;
    delete process.env.IS_TEST_ENV;

    try {
      await sendEmailNotification(ctx, {
        userId: "user1" as any,
        type: "comment",
        issueId: "issue1" as any,
        actorId: "actor1" as any,
        commentText: "Hello",
        issue,
        project,
        actorName,
      });
    } finally {
      process.env.IS_TEST_ENV = originalEnv;
    }

    // Verify user was fetched (mandatory)
    expect(mockDbGet).toHaveBeenCalledWith("user1");

    // Verify issue, project, and actor were NOT fetched
    expect(mockDbGet).not.toHaveBeenCalledWith("issue1");
    expect(mockDbGet).not.toHaveBeenCalledWith("project1");
    expect(mockDbGet).not.toHaveBeenCalledWith("actor1");

    // Verify email was scheduled with correct data
    expect(mockRunAfter).toHaveBeenCalledWith(
      0,
      expect.anything(), // internal.email.notifications.sendNotificationEmail
      expect.objectContaining({
        to: "test@test.com",
        actorName: "Test Actor",
        projectName: "Test Project",
        issueTitle: "Test Issue",
      }),
    );
  });
});
