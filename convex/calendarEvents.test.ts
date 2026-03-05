import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { DAY, HOUR } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

// Helper to set up workspace context for calendar event tests
async function setupCalendarTestContext(t: ReturnType<typeof convexTest>) {
  const userId = await createTestUser(t);
  const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);
  const asUser = asAuthenticatedUser(t, userId);
  return { userId, organizationId, workspaceId, asUser };
}

// Helper to set up multi-user workspace context
async function setupMultiUserCalendarContext(t: ReturnType<typeof convexTest>) {
  const organizerId = await createTestUser(t, { name: "Organizer" });
  const attendeeId = await createTestUser(t, { name: "Attendee" });
  const { organizationId, workspaceId } = await createOrganizationAdmin(t, organizerId);
  await addUserToOrganization(t, organizationId, attendeeId, organizerId);
  // Add attendee to workspace
  const asOrganizer = asAuthenticatedUser(t, organizerId);
  await asOrganizer.mutation(api.workspaces.addMember, {
    workspaceId,
    userId: attendeeId,
    role: "member",
  });
  const asAttendee = asAuthenticatedUser(t, attendeeId);
  return { organizerId, attendeeId, organizationId, workspaceId, asOrganizer, asAttendee };
}

describe("calendarEvents", () => {
  describe("create", () => {
    it("should create a calendar event", async () => {
      const t = convexTest(schema, modules);
      const { userId, workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Team Meeting",
        startTime: now + 1 * HOUR, // 1 hour from now
        endTime: now + 2 * HOUR, // 2 hours from now
        allDay: false,
        eventType: "meeting",
      });

      expect(eventId).toBeDefined();

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("Team Meeting");
      expect(event?.eventType).toBe("meeting");
      expect(event?.status).toBe("confirmed");
      expect(event?.organizerId).toBe(userId);
    });

    it("should reject event where endTime is before startTime", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      await expect(
        asUser.mutation(api.calendarEvents.create, {
          title: "Invalid Event",
          startTime: now + 2 * HOUR,
          endTime: now + HOUR, // Before start time
          allDay: false,
          eventType: "meeting",
        }),
      ).rejects.toThrow(/End time must be after start time/);
    });

    it("should create event with all optional fields", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);
      const attendeeId = await createTestUser(t, { name: "Attendee" });

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Full Featured Event",
        description: "A detailed description",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        location: "Conference Room A",
        eventType: "meeting",
        attendeeIds: [attendeeId],
        externalAttendees: ["external@example.com"],
        status: "tentative",
        isRecurring: true,
        recurrenceRule: "FREQ=WEEKLY;COUNT=4",
        meetingUrl: "https://meet.example.com/abc",
        notes: "Bring laptop",
        isRequired: true,
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.description).toBe("A detailed description");
      expect(event?.location).toBe("Conference Room A");
      expect(event?.attendeeIds).toContain(attendeeId);
      expect(event?.externalAttendees).toContain("external@example.com");
      expect(event?.status).toBe("tentative");
      expect(event?.isRecurring).toBe(true);
      expect(event?.meetingUrl).toBe("https://meet.example.com/abc");
    });

    it("should reject creating project-scoped event for inaccessible project", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const attackerId = await createTestUser(t, { name: "Attacker" });
      const asAttacker = asAuthenticatedUser(t, attackerId);

      const { organizationId: ownerOrgId } = await createOrganizationAdmin(t, ownerId);
      const projectId = await createProjectInOrganization(t, ownerId, ownerOrgId, {
        name: "Owner Project",
        key: "OWN",
      });
      const now = Date.now();
      await expect(
        asAttacker.mutation(api.calendarEvents.create, {
          title: "Unauthorized Project Event",
          startTime: now + HOUR,
          endTime: now + 2 * HOUR,
          allDay: false,
          eventType: "meeting",
          projectId,
        }),
      ).rejects.toThrow(/FORBIDDEN|access to this project|Not authorized/);
    });
  });

  describe("get", () => {
    it("should return event for organizer", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "My Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "personal",
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("My Event");
      expect(event?.organizerName).toBeDefined();
    });

    it("should return event for attendee", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, attendeeId, asOrganizer, asAttendee } =
        await setupMultiUserCalendarContext(t);

      const now = Date.now();
      const { eventId } = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Team Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      const event = await asAttendee.query(api.calendarEvents.get, { id: eventId });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("Team Event");
    });

    it("should return null for non-participant", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asOrganizer } = await setupMultiUserCalendarContext(t);
      const otherUserId = await createTestUser(t, { name: "Other" });
      const asOther = asAuthenticatedUser(t, otherUserId);

      const now = Date.now();
      const { eventId } = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Private Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "personal",
      });

      const event = await asOther.query(api.calendarEvents.get, { id: eventId });
      expect(event).toBeNull();
    });
  });

  describe("update", () => {
    it("should allow organizer to update event", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Original Title",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const result = await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        title: "Updated Title",
        location: "New Location",
      });
      expect(result).toEqual({ success: true, eventId });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.title).toBe("Updated Title");
      expect(event?.location).toBe("New Location");
    });

    it("should reject update from non-organizer", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, attendeeId, asOrganizer, asAttendee } =
        await setupMultiUserCalendarContext(t);

      const now = Date.now();
      const { eventId } = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Team Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      await expect(
        asAttendee.mutation(api.calendarEvents.update, {
          id: eventId,
          title: "Hijacked Event",
        }),
      ).rejects.toThrow(/Only the event organizer/);
    });

    it("should validate times on update", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await expect(
        asUser.mutation(api.calendarEvents.update, {
          id: eventId,
          startTime: now + 2 * HOUR,
          endTime: now + HOUR, // Before new start
        }),
      ).rejects.toThrow(/End time must be after start time/);
    });
  });

  describe("remove", () => {
    it("should allow organizer to delete event", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "To Delete",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "personal",
      });

      const result = await asUser.mutation(api.calendarEvents.remove, { id: eventId });
      expect(result).toEqual({ success: true, deleted: true });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event).toBeNull();
    });

    it("should reject delete from non-organizer", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, attendeeId, asOrganizer, asAttendee } =
        await setupMultiUserCalendarContext(t);

      const now = Date.now();
      const { eventId } = await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Protected Event",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      await expect(asAttendee.mutation(api.calendarEvents.remove, { id: eventId })).rejects.toThrow(
        /Only the event organizer/,
      );
    });
  });

  describe("listByDateRange", () => {
    it("should return events in date range", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      // Create events at different times
      await asUser.mutation(api.calendarEvents.create, {
        title: "Event 1",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Event 2",
        startTime: now + 2 * DAY,
        endTime: now + 2 * DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Event Outside Range",
        startTime: now + 10 * DAY,
        endTime: now + 10 * DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.listByDateRange, {
        startDate: now,
        endDate: now + 5 * DAY,
      });

      expect(events.length).toBe(2);
      expect(events.map((e) => e.title)).toContain("Event 1");
      expect(events.map((e) => e.title)).toContain("Event 2");
      expect(events.map((e) => e.title)).not.toContain("Event Outside Range");
    });

    it("should only show events user is part of", async () => {
      const t = convexTest(schema, modules);
      // Each user gets their own workspace
      const { workspaceId: ws1, asUser: asUser1 } = await setupCalendarTestContext(t);
      const { workspaceId: ws2, asUser: asUser2 } = await setupCalendarTestContext(t);

      const now = Date.now();

      await asUser1.mutation(api.calendarEvents.create, {
        title: "User 1 Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "personal",
      });

      await asUser2.mutation(api.calendarEvents.create, {
        title: "User 2 Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "personal",
      });

      const user1Events = await asUser1.query(api.calendarEvents.listByDateRange, {
        startDate: now,
        endDate: now + 5 * DAY,
      });

      expect(user1Events.length).toBe(1);
      expect(user1Events[0].title).toBe("User 1 Event");
    });
  });

  describe("listByTeamDateRange", () => {
    it("should return team events for team members, including project-level events", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member" });
      const asOwner = asAuthenticatedUser(t, ownerId);
      const asMember = asAuthenticatedUser(t, memberId);

      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      await addUserToOrganization(t, organizationId, memberId, ownerId);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Team Calendar Project",
        key: "TCP",
      });
      const project = await t.run(async (ctx) => {
        const currentProject = await ctx.db.get(projectId);
        if (!currentProject) {
          throw new Error("Project should exist");
        }
        if (!currentProject.teamId || !currentProject.workspaceId) {
          throw new Error("Project should have a teamId and workspaceId");
        }

        await ctx.db.insert("teamMembers", {
          teamId: currentProject.teamId,
          userId: memberId,
          role: "member",
          addedBy: ownerId,
        });

        // Add member to the project's workspace
        await ctx.db.insert("workspaceMembers", {
          workspaceId: currentProject.workspaceId,
          userId: memberId,
          role: "member",
          addedBy: ownerId,
        });

        return {
          ...currentProject,
          teamId: currentProject.teamId,
          workspaceId: currentProject.workspaceId,
        };
      });

      const now = Date.now();
      // Use the project to scope the event
      await asOwner.mutation(api.calendarEvents.create, {
        title: "Project Planning",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
        projectId,
      });

      const events = await asMember.query(api.calendarEvents.listByTeamDateRange, {
        teamId: project.teamId,
        startDate: now,
        endDate: now + 3 * DAY,
      });

      expect(events.map((event) => event.title)).toContain("Project Planning");
      expect(events[0].teamId).toBe(project.teamId);
      expect(events[0].projectId).toBe(projectId);
    });

    it("should return no team events for non-members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const outsiderId = await createTestUser(t, { name: "Outsider" });
      const asOwner = asAuthenticatedUser(t, ownerId);
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      const { organizationId } = await createOrganizationAdmin(t, ownerId);
      await addUserToOrganization(t, organizationId, outsiderId, ownerId);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Restricted Team Project",
        key: "RTP",
      });
      const project = await t.run(async (ctx) => {
        const currentProject = await ctx.db.get(projectId);
        if (!currentProject) {
          throw new Error("Project should exist");
        }
        if (!currentProject.teamId || !currentProject.workspaceId) {
          throw new Error("Project should have a teamId and workspaceId");
        }
        return {
          ...currentProject,
          teamId: currentProject.teamId,
          workspaceId: currentProject.workspaceId,
        };
      });

      const now = Date.now();
      // Use the project to scope the event
      await asOwner.mutation(api.calendarEvents.create, {
        title: "Restricted Team Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
        projectId,
      });

      const events = await asOutsider.query(api.calendarEvents.listByTeamDateRange, {
        teamId: project.teamId,
        startDate: now,
        endDate: now + 3 * DAY,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("organization/workspace scoped calendar queries", () => {
    it("should return workspace events for workspace members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member" });
      const asOwner = asAuthenticatedUser(t, ownerId);
      const asMember = asAuthenticatedUser(t, memberId);

      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);
      await addUserToOrganization(t, organizationId, memberId, ownerId);
      await asOwner.mutation(api.workspaces.addMember, {
        workspaceId,
        userId: memberId,
        role: "member",
      });

      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("calendarEvents", {
          title: "Workspace Sync",
          startTime: now + DAY,
          endTime: now + DAY + HOUR,
          allDay: false,
          eventType: "meeting",
          organizerId: ownerId,
          attendeeIds: [],
          organizationId,
          workspaceId,
          teamId,
          status: "confirmed",
          isRecurring: false,
          updatedAt: now,
        });
      });

      const events = await asMember.query(api.calendarEvents.listByWorkspaceDateRange, {
        workspaceId,
        startDate: now,
        endDate: now + 3 * DAY,
      });

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Workspace Sync");
      expect(events[0].workspaceId).toBe(workspaceId);
    });

    it("should apply organization filters for workspace and team", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member" });
      const asOwner = asAuthenticatedUser(t, ownerId);
      const asMember = asAuthenticatedUser(t, memberId);

      const { organizationId, workspaceId, teamId } = await createOrganizationAdmin(t, ownerId);
      await addUserToOrganization(t, organizationId, memberId, ownerId);

      const { workspaceId: secondWorkspaceId } = await asOwner.mutation(api.workspaces.create, {
        organizationId,
        name: "Second Workspace",
        slug: "second-workspace",
      });
      const { teamId: secondTeamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId: secondWorkspaceId,
        name: "Second Team",
        isPrivate: false,
      });

      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("calendarEvents", {
          title: "Primary Workspace Event",
          startTime: now + DAY,
          endTime: now + DAY + HOUR,
          allDay: false,
          eventType: "meeting",
          organizerId: ownerId,
          attendeeIds: [],
          organizationId,
          workspaceId,
          teamId,
          status: "confirmed",
          isRecurring: false,
          updatedAt: now,
        });
        await ctx.db.insert("calendarEvents", {
          title: "Secondary Workspace Event",
          startTime: now + DAY,
          endTime: now + DAY + HOUR,
          allDay: false,
          eventType: "meeting",
          organizerId: ownerId,
          attendeeIds: [],
          organizationId,
          workspaceId: secondWorkspaceId,
          teamId: secondTeamId,
          status: "confirmed",
          isRecurring: false,
          updatedAt: now,
        });
      });

      const filteredByWorkspace = await asMember.query(
        api.calendarEvents.listByOrganizationDateRange,
        {
          organizationId,
          startDate: now,
          endDate: now + 3 * DAY,
          workspaceId,
        },
      );
      expect(filteredByWorkspace).toHaveLength(1);
      expect(filteredByWorkspace[0].title).toBe("Primary Workspace Event");

      const filteredByTeam = await asMember.query(api.calendarEvents.listByOrganizationDateRange, {
        organizationId,
        startDate: now,
        endDate: now + 3 * DAY,
        teamId: secondTeamId,
      });
      expect(filteredByTeam).toHaveLength(1);
      expect(filteredByTeam[0].title).toBe("Secondary Workspace Event");
    });
  });

  describe("listMine", () => {
    it("should return user's events with default date range", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      await asUser.mutation(api.calendarEvents.create, {
        title: "Upcoming Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {});
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.map((e) => e.title)).toContain("Upcoming Event");
    });

    it("should exclude cancelled events by default", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {});
      expect(events.map((e) => e.title)).not.toContain("Cancelled Event");
    });

    it("should include cancelled events when requested", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.listMine, {
        includeCompleted: true,
      });
      expect(events.map((e) => e.title)).toContain("Cancelled Event");
    });

    it("should include events where user is attendee", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, attendeeId, asOrganizer, asAttendee } =
        await setupMultiUserCalendarContext(t);

      const now = Date.now();

      await asOrganizer.mutation(api.calendarEvents.create, {
        title: "Invited Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
        attendeeIds: [attendeeId],
      });

      const attendeeEvents = await asAttendee.query(api.calendarEvents.listMine, {});
      expect(attendeeEvents.map((e) => e.title)).toContain("Invited Event");
    });
  });

  describe("getUpcoming", () => {
    it("should return events in next 7 days", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      await asUser.mutation(api.calendarEvents.create, {
        title: "Tomorrow Event",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Next Week Event",
        startTime: now + 10 * DAY, // Outside 7-day window
        endTime: now + 10 * DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events.map((e) => e.title)).toContain("Tomorrow Event");
      expect(events.map((e) => e.title)).not.toContain("Next Week Event");
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      // Create multiple events
      for (let i = 0; i < 5; i++) {
        await asUser.mutation(api.calendarEvents.create, {
          title: `Event ${i + 1}`,
          startTime: now + (i + 1) * HOUR,
          endTime: now + (i + 2) * HOUR,
          allDay: false,
          eventType: "meeting",
        });
      }

      const events = await asUser.query(api.calendarEvents.getUpcoming, { limit: 3 });
      expect(events.length).toBe(3);
    });

    it("should exclude cancelled events", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "Cancelled Upcoming",
        startTime: now + DAY,
        endTime: now + DAY + HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.update, {
        id: eventId,
        status: "cancelled",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events.map((e) => e.title)).not.toContain("Cancelled Upcoming");
    });

    it("should sort events by start time", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();

      // Create in reverse order
      await asUser.mutation(api.calendarEvents.create, {
        title: "Third",
        startTime: now + 3 * HOUR,
        endTime: now + 4 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "First",
        startTime: now + HOUR,
        endTime: now + 2 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      await asUser.mutation(api.calendarEvents.create, {
        title: "Second",
        startTime: now + 2 * HOUR,
        endTime: now + 3 * HOUR,
        allDay: false,
        eventType: "meeting",
      });

      const events = await asUser.query(api.calendarEvents.getUpcoming, {});
      expect(events[0].title).toBe("First");
      expect(events[1].title).toBe("Second");
      expect(events[2].title).toBe("Third");
    });
  });

  describe("event types", () => {
    it("should support all event types", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const now = Date.now();
      const types = ["meeting", "deadline", "timeblock", "personal"] as const;

      for (const eventType of types) {
        const { eventId } = await asUser.mutation(api.calendarEvents.create, {
          title: `${eventType} event`,
          startTime: now + HOUR,
          endTime: now + 2 * HOUR,
          allDay: false,
          eventType,
        });

        const event = await asUser.query(api.calendarEvents.get, { id: eventId });
        expect(event?.eventType).toBe(eventType);
      }
    });
  });

  describe("all-day events", () => {
    it("should handle all-day events", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser } = await setupCalendarTestContext(t);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const endOfDay = startOfDay + DAY - 1;

      const { eventId } = await asUser.mutation(api.calendarEvents.create, {
        title: "All Day Event",
        startTime: startOfDay,
        endTime: endOfDay,
        allDay: true,
        eventType: "personal",
      });

      const event = await asUser.query(api.calendarEvents.get, { id: eventId });
      expect(event?.allDay).toBe(true);
    });
  });
});
