/**
 * Organization Layout Route
 *
 * Root layout for authenticated organization routes.
 * Provides organization context, sidebar, header, and keyboard shortcuts.
 * Handles global modals and command palette integration.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { AppHeader, AppSidebar } from "@/components/App";
import { useCommands } from "@/components/CommandPalette";
import { CreateProjectFromTemplate } from "@/components/CreateProjectFromTemplate";
import { CreateIssueModal } from "@/components/IssueDetail";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { createKeyboardShortcuts, createKeySequences } from "@/config/keyboardShortcuts";
import { ROUTES } from "@/config/routes";
import { IssueViewModeProvider } from "@/contexts/IssueViewModeContext";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";
import { useKeyboardShortcutsWithSequences } from "@/hooks/useKeyboardShortcuts";
import {
  OrgContext,
  type OrgContextType,
  useOrganization,
  useOrganizationOptional,
} from "@/hooks/useOrgContext";
import { SidebarProvider } from "@/hooks/useSidebarState";
import {
  clearAuthenticatedSessionMarker,
  hasRecoverableAuthenticatedSession,
  markAuthenticatedSession,
  readLocalStorageJson,
  removeLocalStorageValue,
  writeLocalStorageJson,
} from "@/lib/authRecovery";
import { showError, showSuccess } from "@/lib/toast";

// Re-export hooks for backwards compatibility with existing imports
export { useOrganization, useOrganizationOptional };

type UserOrganization = FunctionReturnType<typeof api.organizations.getUserOrganizations>[number];
type PersistedOrganization = FunctionReturnType<typeof api.organizations.getOrganizationBySlug>;
const ORGANIZATION_LAYOUT_CACHE_STORAGE_KEY = "nixelo-organization-layout-cache";

interface PersistedOrganizationLayoutState {
  userOrganizations?: UserOrganization[];
  organizationsBySlug?: Record<string, PersistedOrganization>;
}

let cachedOrgUserOrganizations: UserOrganization[] | undefined;
const cachedOrganizationsBySlug = new Map<
  string,
  FunctionReturnType<typeof api.organizations.getOrganizationBySlug>
>();
let hasAuthenticatedOrgSession = false;

export const Route = createFileRoute("/_auth/_app/$orgSlug")({
  component: OrganizationLayout,
  ssr: false, // Disable SSR to prevent hydration issues with OrgContext
});

function OrgLoading() {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
      <LoadingSpinner size="lg" />
    </Flex>
  );
}

function OrgError({ title, message }: { title: string; message: string }) {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-4">
      <div className="text-center">
        <Typography variant="authStatusTitle" className="mb-2">
          {title}
        </Typography>
        <Typography variant="p" color="secondary">
          {message}
        </Typography>
      </div>
    </Flex>
  );
}

function useStableOrgData(orgSlug: string) {
  const persistedStateRef = useRef(
    readLocalStorageJson<PersistedOrganizationLayoutState>(ORGANIZATION_LAYOUT_CACHE_STORAGE_KEY),
  );
  const userOrganizations = useAuthenticatedQuery(api.organizations.getUserOrganizations, {}) as
    | UserOrganization[]
    | undefined;

  const organization = useAuthenticatedQuery(api.organizations.getOrganizationBySlug, {
    slug: orgSlug,
  });

  useEffect(() => {
    if (userOrganizations === undefined) {
      return;
    }

    cachedOrgUserOrganizations = userOrganizations;
    const current = persistedStateRef.current;
    const next = {
      ...current,
      userOrganizations,
      organizationsBySlug: current?.organizationsBySlug ?? {},
    };
    persistedStateRef.current = next;
    writeLocalStorageJson(ORGANIZATION_LAYOUT_CACHE_STORAGE_KEY, next);
  }, [userOrganizations]);

  useEffect(() => {
    if (organization === undefined) {
      return;
    }

    cachedOrganizationsBySlug.set(orgSlug, organization);
    const current = persistedStateRef.current;
    const next = {
      ...current,
      userOrganizations: userOrganizations ?? current?.userOrganizations,
      organizationsBySlug: {
        ...(current?.organizationsBySlug ?? {}),
        [orgSlug]: organization,
      },
    };
    persistedStateRef.current = next;
    writeLocalStorageJson(ORGANIZATION_LAYOUT_CACHE_STORAGE_KEY, next);
  }, [orgSlug, organization, userOrganizations]);

  const persistedState = persistedStateRef.current;
  return {
    organization:
      organization ??
      cachedOrganizationsBySlug.get(orgSlug) ??
      persistedState?.organizationsBySlug?.[orgSlug],
    userOrgs: userOrganizations ?? cachedOrgUserOrganizations ?? persistedState?.userOrganizations,
  };
}

function isNavigatorOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/** Synchronous module-level state update (safe in render). */
function updateOrgSessionFlags(isAuthenticated: boolean, isAuthLoading: boolean) {
  if (isAuthenticated) {
    hasAuthenticatedOrgSession = true;
  } else if (!isAuthLoading && !isNavigatorOffline()) {
    hasAuthenticatedOrgSession = false;
    cachedOrgUserOrganizations = undefined;
    cachedOrganizationsBySlug.clear();
  }
}

/** Side-effectful localStorage writes (run in useEffect). */
function persistOrgSessionState(isAuthenticated: boolean, isAuthLoading: boolean) {
  if (isAuthenticated) {
    markAuthenticatedSession();
  } else if (!isAuthLoading && !isNavigatorOffline()) {
    clearAuthenticatedSessionMarker();
    removeLocalStorageValue(ORGANIZATION_LAYOUT_CACHE_STORAGE_KEY);
  }
}

function shouldShowOrgLoading(
  isAuthenticated: boolean,
  isAuthLoading: boolean,
  canRecover: boolean,
  organization: unknown,
  userOrgs: unknown,
): boolean {
  const isOffline = isNavigatorOffline();
  const canRenderOffline = isOffline && canRecover && organization && userOrgs;

  if (organization === undefined || userOrgs === undefined) {
    // Only bypass loading if we have a confirmed session OR actual cached data to render.
    // Require both organization AND userOrgs to avoid false "Access denied" while
    // membership data is still loading.
    if (isAuthLoading && (hasAuthenticatedOrgSession || (canRecover && organization && userOrgs))) {
      return false;
    }
    return !canRenderOffline;
  }

  return !(isAuthenticated || (isAuthLoading && organization) || canRenderOffline);
}

function OrganizationLayout() {
  const { orgSlug } = Route.useParams();
  const { isAuthLoading, isAuthenticated } = useAuthReady();
  const canRecoverAuthenticatedSession = hasRecoverableAuthenticatedSession();

  // Module-level flags must be synchronous so guards work on the first render
  updateOrgSessionFlags(isAuthenticated, isAuthLoading);

  // localStorage writes are side effects — run in useEffect to avoid
  // synchronous storage churn during React render (especially StrictMode)
  useEffect(() => {
    persistOrgSessionState(isAuthenticated, isAuthLoading);
  }, [isAuthenticated, isAuthLoading]);

  const { organization, userOrgs } = useStableOrgData(orgSlug);

  if (
    shouldShowOrgLoading(
      isAuthenticated,
      isAuthLoading,
      canRecoverAuthenticatedSession,
      organization,
      userOrgs,
    )
  ) {
    return <OrgLoading />;
  }

  if (organization === null || organization === undefined) {
    return (
      <OrgError
        title="organization not found"
        message={`The organization "${orgSlug}" does not exist.`}
      />
    );
  }

  const userOrganization = userOrgs?.find((c) => c._id === organization._id);

  if (!userOrganization) {
    return <OrgError title="Access denied" message="You don't have access to this organization." />;
  }

  const orgContextValue: OrgContextType = {
    organizationId: organization._id,
    orgSlug: organization.slug,
    organizationName: organization.name,
    userRole: userOrganization.userRole ?? "member",
    billingEnabled: organization.settings.billingEnabled,
  };

  return (
    <OrgContext.Provider value={orgContextValue}>
      <OrganizationLayoutInner />
    </OrgContext.Provider>
  );
}

// Inner component that can safely use useOrganization and other hooks
function OrganizationLayoutInner() {
  const navigate = useNavigate();

  // UI state for modals
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [, setShowAIAssistant] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { orgSlug, organizationId } = useOrganization();

  // Document creation mutation
  const { mutate: createDocument } = useAuthenticatedMutation(api.documents.create);

  const handleCreateDocument = async () => {
    try {
      const { documentId } = await createDocument({
        title: "Untitled Document",
        isPublic: false,
        organizationId,
      });
      navigate({
        to: ROUTES.documents.detail.path,
        params: { orgSlug, id: documentId },
      });
      showSuccess("Document created");
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleCreateIssue = () => setShowCreateIssue(true);
    const handleCreateDoc = async () => {
      try {
        const { documentId } = await createDocument({
          title: "Untitled Document",
          isPublic: false,
          organizationId,
        });
        navigate({
          to: ROUTES.documents.detail.path,
          params: { orgSlug, id: documentId },
        });
        showSuccess("Document created");
      } catch (error) {
        showError(error, "Failed to create document");
      }
    };
    const handleCreateProj = () => setShowCreateProject(true);

    window.addEventListener("nixelo:create-issue", handleCreateIssue);
    window.addEventListener("nixelo:create-document", handleCreateDoc);
    window.addEventListener("nixelo:create-project", handleCreateProj);

    return () => {
      window.removeEventListener("nixelo:create-issue", handleCreateIssue);
      window.removeEventListener("nixelo:create-document", handleCreateDoc);
      window.removeEventListener("nixelo:create-project", handleCreateProj);
    };
  }, [createDocument, navigate, organizationId, orgSlug]);

  // Build keyboard shortcuts (need orgSlug for navigation)
  const shortcuts = createKeyboardShortcuts({
    orgSlug,
    navigate: (to: string) => {
      navigate({ to });
    },
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  const sequences = createKeySequences({
    orgSlug,
    navigate: (to: string) => {
      navigate({ to });
    },
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  // Enable keyboard shortcuts
  useKeyboardShortcutsWithSequences(shortcuts, sequences, true);

  // Build command palette commands with create callbacks
  const commands = useCommands({
    onCreateIssue: () => setShowCreateIssue(true),
    onCreateDocument: handleCreateDocument,
    onCreateProject: () => setShowCreateProject(true),
  });

  return (
    <SidebarProvider>
      <IssueViewModeProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-ui-bg focus:p-2 focus:border focus:border-ui-border focus:shadow-md focus:text-ui-text font-medium"
        >
          Skip to content
        </a>
        <Flex className="h-screen overflow-hidden app-shell-bg">
          {/* Unified sidebar */}
          <AppSidebar onCreateProject={() => setShowCreateProject(true)} />

          {/* Main content area */}
          <Flex direction="column" className="flex-1 min-w-0">
            {/* Slim header */}
            <AppHeader commands={commands} onShowShortcutsHelp={() => setShowShortcutsHelp(true)} />

            {/* Page content */}
            <FlexItem
              as="main"
              flex="1"
              className="overflow-auto app-page-surface scrollbar-subtle"
              id="main-content"
              tabIndex={-1}
            >
              <Outlet />
            </FlexItem>
          </Flex>

          {/* Keyboard Shortcuts Help Modal */}
          <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />

          {/* Create Issue Modal */}
          <CreateIssueModal open={showCreateIssue} onOpenChange={setShowCreateIssue} />

          {/* Create Project Modal */}
          <CreateProjectFromTemplate
            open={showCreateProject}
            onOpenChange={setShowCreateProject}
            onProjectCreated={async ({ projectKey }) => {
              setShowCreateProject(false);
              await navigate({
                to: ROUTES.projects.board.path,
                params: { orgSlug, key: projectKey },
              });
            }}
          />
        </Flex>
      </IssueViewModeProvider>
    </SidebarProvider>
  );
}
