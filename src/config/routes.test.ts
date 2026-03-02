import { describe, expect, it } from "vitest";
import { ROUTES } from "./routes";

describe("ROUTES configuration", () => {
  describe("static routes", () => {
    it("should have correct home route", () => {
      expect(ROUTES.home.path).toBe("/");
      expect(ROUTES.home.build()).toBe("/");
    });

    it("should have correct auth routes", () => {
      expect(ROUTES.signin.path).toBe("/signin");
      expect(ROUTES.signin.build()).toBe("/signin");

      expect(ROUTES.signup.path).toBe("/signup");
      expect(ROUTES.signup.build()).toBe("/signup");

      expect(ROUTES.forgotPassword.path).toBe("/forgot-password");
      expect(ROUTES.forgotPassword.build()).toBe("/forgot-password");
    });

    it("should have correct legal routes", () => {
      expect(ROUTES.terms.path).toBe("/terms");
      expect(ROUTES.terms.build()).toBe("/terms");

      expect(ROUTES.privacy.path).toBe("/privacy");
      expect(ROUTES.privacy.build()).toBe("/privacy");
    });

    it("should have correct onboarding route", () => {
      expect(ROUTES.onboarding.path).toBe("/onboarding");
      expect(ROUTES.onboarding.build()).toBe("/onboarding");
    });

    it("should have correct app entry route", () => {
      expect(ROUTES.app.path).toBe("/app");
      expect(ROUTES.app.build()).toBe("/app");
    });
  });

  describe("parameterized routes", () => {
    it("should build invite route with token", () => {
      expect(ROUTES.invite.path).toBe("/invite/$token");
      expect(ROUTES.invite.build("abc123")).toBe("/invite/abc123");
      expect(ROUTES.invite.build("special-token-xyz")).toBe("/invite/special-token-xyz");
    });

    it("should build dashboard route with orgSlug", () => {
      expect(ROUTES.dashboard.path).toBe("/$orgSlug/dashboard");
      expect(ROUTES.dashboard.build("acme")).toBe("/acme/dashboard");
    });

    it("should build organization calendar route with orgSlug", () => {
      expect(ROUTES.calendar.path).toBe("/$orgSlug/calendar");
      expect(ROUTES.calendar.build("acme")).toBe("/acme/calendar");
    });

    it("should build time tracking route with orgSlug", () => {
      expect(ROUTES.timeTracking.path).toBe("/$orgSlug/time-tracking");
      expect(ROUTES.timeTracking.build("acme")).toBe("/acme/time-tracking");
    });
  });

  describe("document routes", () => {
    it("should have correct document list route", () => {
      expect(ROUTES.documents.list.path).toBe("/$orgSlug/documents");
      expect(ROUTES.documents.list.build("acme")).toBe("/acme/documents");
    });

    it("should have correct document detail route", () => {
      expect(ROUTES.documents.detail.path).toBe("/$orgSlug/documents/$id");
      expect(ROUTES.documents.detail.build("acme", "doc123")).toBe("/acme/documents/doc123");
    });

    it("should have correct document templates route", () => {
      expect(ROUTES.documents.templates.path).toBe("/$orgSlug/documents/templates");
      expect(ROUTES.documents.templates.build("acme")).toBe("/acme/documents/templates");
    });
  });

  describe("project routes", () => {
    it("should have correct project list route", () => {
      expect(ROUTES.projects.list.path).toBe("/$orgSlug/projects");
      expect(ROUTES.projects.list.build("acme")).toBe("/acme/projects");
    });

    it("should have correct project board route", () => {
      expect(ROUTES.projects.board.path).toBe("/$orgSlug/projects/$key/board");
      expect(ROUTES.projects.board.build("acme", "PROJ")).toBe("/acme/projects/PROJ/board");
    });

    it("should have correct project calendar route", () => {
      expect(ROUTES.projects.calendar.path).toBe("/$orgSlug/projects/$key/calendar");
      expect(ROUTES.projects.calendar.build("acme", "PROJ")).toBe("/acme/projects/PROJ/calendar");
    });

    it("should have correct project timesheet route", () => {
      expect(ROUTES.projects.timesheet.path).toBe("/$orgSlug/projects/$key/timesheet");
      expect(ROUTES.projects.timesheet.build("acme", "PROJ")).toBe("/acme/projects/PROJ/timesheet");
    });

    it("should have correct project settings route", () => {
      expect(ROUTES.projects.settings.path).toBe("/$orgSlug/projects/$key/settings");
      expect(ROUTES.projects.settings.build("acme", "PROJ")).toBe("/acme/projects/PROJ/settings");
    });
  });

  describe("issue routes", () => {
    it("should have correct issue list route", () => {
      expect(ROUTES.issues.list.path).toBe("/$orgSlug/issues");
      expect(ROUTES.issues.list.build("acme")).toBe("/acme/issues");
    });

    it("should have correct issue detail route", () => {
      expect(ROUTES.issues.detail.path).toBe("/$orgSlug/issues/$key");
      expect(ROUTES.issues.detail.build("acme", "PROJ-123")).toBe("/acme/issues/PROJ-123");
    });

    it("should have correct my issues board route", () => {
      expect(ROUTES.myIssues.path).toBe("/$orgSlug/my-issues");
      expect(ROUTES.myIssues.build("acme")).toBe("/acme/my-issues");
    });
  });

  describe("workspace routes", () => {
    it("should have correct workspace list route", () => {
      expect(ROUTES.workspaces.list.path).toBe("/$orgSlug/workspaces");
      expect(ROUTES.workspaces.list.build("acme")).toBe("/acme/workspaces");
    });

    it("should have correct workspace detail route", () => {
      expect(ROUTES.workspaces.detail.path).toBe("/$orgSlug/workspaces/$workspaceSlug");
      expect(ROUTES.workspaces.detail.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering",
      );
    });

    it("should have correct workspace board route", () => {
      expect(ROUTES.workspaces.board.path).toBe("/$orgSlug/workspaces/$workspaceSlug/board");
      expect(ROUTES.workspaces.board.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/board",
      );
    });

    it("should have correct workspace calendar route", () => {
      expect(ROUTES.workspaces.calendar.path).toBe("/$orgSlug/workspaces/$workspaceSlug/calendar");
      expect(ROUTES.workspaces.calendar.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/calendar",
      );
    });

    it("should have correct workspace wiki route", () => {
      expect(ROUTES.workspaces.wiki.path).toBe("/$orgSlug/workspaces/$workspaceSlug/wiki");
      expect(ROUTES.workspaces.wiki.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/wiki",
      );
    });

    it("should have correct workspace dependencies route", () => {
      expect(ROUTES.workspaces.dependencies.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/dependencies",
      );
      expect(ROUTES.workspaces.dependencies.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/dependencies",
      );
    });

    it("should have correct workspace settings route", () => {
      expect(ROUTES.workspaces.settings.path).toBe("/$orgSlug/workspaces/$workspaceSlug/settings");
      expect(ROUTES.workspaces.settings.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/settings",
      );
    });
  });

  describe("team routes", () => {
    it("should have correct team list route", () => {
      expect(ROUTES.workspaces.teams.list.path).toBe("/$orgSlug/workspaces/$workspaceSlug/teams");
      expect(ROUTES.workspaces.teams.list.build("acme", "engineering")).toBe(
        "/acme/workspaces/engineering/teams",
      );
    });

    it("should have correct team detail route", () => {
      expect(ROUTES.workspaces.teams.detail.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
      );
      expect(ROUTES.workspaces.teams.detail.build("acme", "engineering", "frontend")).toBe(
        "/acme/workspaces/engineering/teams/frontend",
      );
    });

    it("should have correct team board route", () => {
      expect(ROUTES.workspaces.teams.board.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board",
      );
      expect(ROUTES.workspaces.teams.board.build("acme", "engineering", "frontend")).toBe(
        "/acme/workspaces/engineering/teams/frontend/board",
      );
    });

    it("should have correct team backlog route", () => {
      expect(ROUTES.workspaces.teams.backlog.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog",
      );
      expect(ROUTES.workspaces.teams.backlog.build("acme", "engineering", "frontend")).toBe(
        "/acme/workspaces/engineering/teams/frontend/backlog",
      );
    });

    it("should have correct team calendar route", () => {
      expect(ROUTES.workspaces.teams.calendar.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar",
      );
      expect(ROUTES.workspaces.teams.calendar.build("acme", "engineering", "frontend")).toBe(
        "/acme/workspaces/engineering/teams/frontend/calendar",
      );
    });

    it("should have correct team settings route", () => {
      expect(ROUTES.workspaces.teams.settings.path).toBe(
        "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings",
      );
      expect(ROUTES.workspaces.teams.settings.build("acme", "engineering", "frontend")).toBe(
        "/acme/workspaces/engineering/teams/frontend/settings",
      );
    });
  });

  describe("settings routes", () => {
    it("should have correct profile settings route", () => {
      expect(ROUTES.settings.profile.path).toBe("/$orgSlug/settings/profile");
      expect(ROUTES.settings.profile.build("acme")).toBe("/acme/settings/profile");
    });
  });

  describe("route consistency", () => {
    it("path patterns should use $ prefix for parameters", () => {
      // All paths with parameters should use $paramName format
      expect(ROUTES.dashboard.path).toMatch(/\$orgSlug/);
      expect(ROUTES.invite.path).toMatch(/\$token/);
      expect(ROUTES.projects.board.path).toMatch(/\$key/);
      expect(ROUTES.workspaces.detail.path).toMatch(/\$workspaceSlug/);
      expect(ROUTES.workspaces.teams.detail.path).toMatch(/\$teamSlug/);
    });

    it("build functions should generate valid URL paths", () => {
      // All build outputs should start with /
      expect(ROUTES.home.build()).toMatch(/^\//);
      expect(ROUTES.dashboard.build("test")).toMatch(/^\//);
      expect(ROUTES.projects.board.build("org", "key")).toMatch(/^\//);
      expect(ROUTES.workspaces.teams.detail.build("org", "ws", "team")).toMatch(/^\//);
    });

    it("build functions should not have trailing slashes", () => {
      expect(ROUTES.home.build()).toBe("/");
      expect(ROUTES.dashboard.build("test")).not.toMatch(/\/$/);
      expect(ROUTES.projects.board.build("org", "key")).not.toMatch(/\/$/);
    });

    it("build functions should handle special characters in slugs", () => {
      // These are edge cases - slugs should ideally be alphanumeric with dashes
      expect(ROUTES.dashboard.build("my-org")).toBe("/my-org/dashboard");
      expect(ROUTES.projects.board.build("my-org", "PROJ-123")).toBe(
        "/my-org/projects/PROJ-123/board",
      );
    });
  });
});
