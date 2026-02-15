/**
 * Centralized Route Definitions
 * path: The pattern used for route definition (TanStack Router)
 * build: Function to generate the actual URL string
 */
export const ROUTES = {
  home: {
    path: "/" as const,
    build: () => "/",
  },
  signin: {
    path: "/signin" as const,
    build: () => "/signin",
  },
  signup: {
    path: "/signup" as const,
    build: () => "/signup",
  },
  forgotPassword: {
    path: "/forgot-password" as const,
    build: () => "/forgot-password",
  },
  invite: {
    path: "/invite/$token" as const,
    build: (token: string) => `/invite/${token}`,
  },
  terms: {
    path: "/terms" as const,
    build: () => "/terms",
  },
  privacy: {
    path: "/privacy" as const,
    build: () => "/privacy",
  },
  onboarding: {
    path: "/onboarding" as const,
    build: () => "/onboarding",
  },
  verify2FA: {
    path: "/verify-2fa" as const,
    build: () => "/verify-2fa",
  },
  app: {
    path: "/app" as const,
    build: () => "/app",
  },
  dashboard: {
    path: "/$orgSlug/dashboard" as const,
    build: (orgSlug: string) => `/${orgSlug}/dashboard`,
  },
  inbox: {
    path: "/$orgSlug/inbox" as const,
    build: (orgSlug: string) => `/${orgSlug}/inbox`,
  },
  analytics: {
    path: "/$orgSlug/analytics" as const,
    build: (orgSlug: string) => `/${orgSlug}/analytics`,
  },
  team: {
    path: "/$orgSlug/team" as const,
    build: (orgSlug: string) => `/${orgSlug}/team`,
  },

  documents: {
    list: {
      path: "/$orgSlug/documents" as const,
      build: (orgSlug: string) => `/${orgSlug}/documents`,
    },
    detail: {
      path: "/$orgSlug/documents/$id" as const,
      build: (orgSlug: string, id: string) => `/${orgSlug}/documents/${id}`,
    },
    templates: {
      path: "/$orgSlug/documents/templates" as const,
      build: (orgSlug: string) => `/${orgSlug}/documents/templates`,
    },
  },

  workspaces: {
    list: {
      path: "/$orgSlug/workspaces" as const,
      build: (orgSlug: string) => `/${orgSlug}/workspaces`,
    },
    detail: {
      path: "/$orgSlug/workspaces/$workspaceSlug" as const,
      build: (orgSlug: string, workspaceSlug: string) => `/${orgSlug}/workspaces/${workspaceSlug}`,
    },
    board: {
      path: "/$orgSlug/workspaces/$workspaceSlug/board" as const,
      build: (orgSlug: string, workspaceSlug: string) =>
        `/${orgSlug}/workspaces/${workspaceSlug}/board`,
    },
    wiki: {
      path: "/$orgSlug/workspaces/$workspaceSlug/wiki" as const,
      build: (orgSlug: string, workspaceSlug: string) =>
        `/${orgSlug}/workspaces/${workspaceSlug}/wiki`,
    },
    settings: {
      path: "/$orgSlug/workspaces/$workspaceSlug/settings" as const,
      build: (orgSlug: string, workspaceSlug: string) =>
        `/${orgSlug}/workspaces/${workspaceSlug}/settings`,
    },

    teams: {
      list: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams" as const,
        build: (orgSlug: string, workspaceSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams`,
      },
      detail: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
        build: (orgSlug: string, workspaceSlug: string, teamSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams/${teamSlug}`,
      },
      board: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board" as const,
        build: (orgSlug: string, workspaceSlug: string, teamSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams/${teamSlug}/board`,
      },
      backlog: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog" as const,
        build: (orgSlug: string, workspaceSlug: string, teamSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams/${teamSlug}/backlog`,
      },
      calendar: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar" as const,
        build: (orgSlug: string, workspaceSlug: string, teamSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams/${teamSlug}/calendar`,
      },
      settings: {
        path: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings" as const,
        build: (orgSlug: string, workspaceSlug: string, teamSlug: string) =>
          `/${orgSlug}/workspaces/${workspaceSlug}/teams/${teamSlug}/settings`,
      },
    },
  },

  projects: {
    list: {
      path: "/$orgSlug/projects" as const,
      build: (orgSlug: string) => `/${orgSlug}/projects`,
    },
    board: {
      path: "/$orgSlug/projects/$key/board" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/board`,
    },
    backlog: {
      path: "/$orgSlug/projects/$key/backlog" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/backlog`,
    },
    sprints: {
      path: "/$orgSlug/projects/$key/sprints" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/sprints`,
    },
    roadmap: {
      path: "/$orgSlug/projects/$key/roadmap" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/roadmap`,
    },
    calendar: {
      path: "/$orgSlug/projects/$key/calendar" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/calendar`,
    },
    activity: {
      path: "/$orgSlug/projects/$key/activity" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/activity`,
    },
    analytics: {
      path: "/$orgSlug/projects/$key/analytics" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/analytics`,
    },
    billing: {
      path: "/$orgSlug/projects/$key/billing" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/billing`,
    },
    timesheet: {
      path: "/$orgSlug/projects/$key/timesheet" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/timesheet`,
    },
    settings: {
      path: "/$orgSlug/projects/$key/settings" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/projects/${key}/settings`,
    },
  },

  issues: {
    list: {
      path: "/$orgSlug/issues" as const,
      build: (orgSlug: string) => `/${orgSlug}/issues`,
    },
    detail: {
      path: "/$orgSlug/issues/$key" as const,
      build: (orgSlug: string, key: string) => `/${orgSlug}/issues/${key}`,
    },
  },

  settings: {
    profile: {
      path: "/$orgSlug/settings/profile" as const,
      build: (orgSlug: string) => `/${orgSlug}/settings/profile`,
    },
  },

  timeTracking: {
    path: "/$orgSlug/time-tracking" as const,
    build: (orgSlug: string) => `/${orgSlug}/time-tracking`,
  },

  // Products
  assistant: {
    path: "/$orgSlug/assistant" as const,
    build: (orgSlug: string) => `/${orgSlug}/assistant`,
  },
  mcp: {
    path: "/$orgSlug/mcp-server" as const,
    build: (orgSlug: string) => `/${orgSlug}/mcp-server`,
  },
  addOns: {
    path: "/$orgSlug/add-ons" as const,
    build: (orgSlug: string) => `/${orgSlug}/add-ons`,
  },
  authentication: {
    path: "/$orgSlug/authentication" as const,
    build: (orgSlug: string) => `/${orgSlug}/authentication`,
  },
} as const;
