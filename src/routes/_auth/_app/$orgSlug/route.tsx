import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette, useCommands } from "@/components/CommandPalette";
import { CreateIssueModal } from "@/components/CreateIssueModal";
import { CreateProjectFromTemplate } from "@/components/CreateProjectFromTemplate";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { createKeyboardShortcuts, createKeySequences } from "@/config/keyboardShortcuts";
import { ROUTES } from "@/config/routes";
import { IssueViewModeProvider } from "@/contexts/IssueViewModeContext";
import { useKeyboardShortcutsWithSequences } from "@/hooks/useKeyboardShortcuts";
import {
  OrgContext,
  type OrgContextType,
  useOrganization,
  useOrganizationOptional,
} from "@/hooks/useOrgContext";
import { SidebarProvider } from "@/hooks/useSidebarState";
import { showError, showSuccess } from "@/lib/toast";

// Re-export hooks for backwards compatibility with existing imports
export { useOrganization, useOrganizationOptional };

type UserOrganization = FunctionReturnType<typeof api.organizations.getUserOrganizations>[number];

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
        <Typography variant="h2" className="text-xl font-medium mb-2">
          {title}
        </Typography>
        <Typography variant="p" color="secondary">
          {message}
        </Typography>
      </div>
    </Flex>
  );
}

function useStableOrgData(isAuthenticated: boolean, orgSlug: string) {
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    isAuthenticated ? undefined : "skip",
  ) as UserOrganization[] | undefined;

  const [stableUserOrgs, setStableUserOrgs] = useState(userOrganizations);
  if (userOrganizations !== undefined && userOrganizations !== stableUserOrgs) {
    setStableUserOrgs(userOrganizations);
  }

  const organization = useQuery(
    api.organizations.getOrganizationBySlug,
    isAuthenticated ? { slug: orgSlug } : "skip",
  );

  const [stableOrg, setStableOrg] = useState(organization);
  if (organization !== undefined && organization !== stableOrg) {
    setStableOrg(organization);
  }

  return {
    organization: organization ?? stableOrg,
    userOrgs: userOrganizations ?? stableUserOrgs,
  };
}

function OrganizationLayout() {
  const { orgSlug } = Route.useParams();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  const { organization, userOrgs } = useStableOrgData(isAuthenticated, orgSlug);

  if ((isAuthLoading && !organization) || organization === undefined || userOrgs === undefined) {
    return <OrgLoading />;
  }

  if (!(isAuthenticated || organization)) {
    return <OrgLoading />;
  }

  if (organization === null) {
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [_showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { orgSlug, organizationId } = useOrganization();

  // Document creation mutation
  const createDocument = useMutation(api.documents.create);

  const handleCreateDocument = useCallback(async () => {
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
  }, [createDocument, navigate, organizationId, orgSlug]);

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleCreateIssue = () => setShowCreateIssue(true);
    const handleCreateDoc = () => void handleCreateDocument();
    const handleCreateProj = () => setShowCreateProject(true);

    window.addEventListener("nixelo:create-issue", handleCreateIssue);
    window.addEventListener("nixelo:create-document", handleCreateDoc);
    window.addEventListener("nixelo:create-project", handleCreateProj);

    return () => {
      window.removeEventListener("nixelo:create-issue", handleCreateIssue);
      window.removeEventListener("nixelo:create-document", handleCreateDoc);
      window.removeEventListener("nixelo:create-project", handleCreateProj);
    };
  }, [handleCreateDocument]);

  // Build keyboard shortcuts (need orgSlug for navigation)
  const shortcuts = createKeyboardShortcuts({
    orgSlug,
    navigate: (to: string) => {
      navigate({ to });
    },
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  const sequences = createKeySequences({
    orgSlug,
    navigate: (to: string) => {
      navigate({ to });
    },
    setShowCommandPalette,
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
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-ui-bg focus:p-2 focus:border focus:border-ui-border focus:shadow-md focus:rounded-md focus:text-ui-text font-medium"
        >
          Skip to content
        </a>
        <Flex className="h-screen overflow-hidden bg-ui-bg-secondary">
          {/* Unified sidebar */}
          <AppSidebar />

          {/* Main content area */}
          <Flex direction="column" className="flex-1 min-w-0">
            {/* Slim header */}
            <AppHeader
              onShowCommandPalette={() => setShowCommandPalette(true)}
              onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
            />

            {/* Page content */}
            <FlexItem
              as="main"
              flex="1"
              className="overflow-auto bg-ui-bg scrollbar-subtle"
              id="main-content"
              tabIndex={-1}
            >
              <Outlet />
            </FlexItem>
          </Flex>

          {/* Command Palette Modal */}
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            commands={commands}
          />

          {/* Keyboard Shortcuts Help Modal */}
          <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />

          {/* Create Issue Modal */}
          <CreateIssueModal open={showCreateIssue} onOpenChange={setShowCreateIssue} />

          {/* Create Project Modal */}
          <CreateProjectFromTemplate
            open={showCreateProject}
            onOpenChange={setShowCreateProject}
            onProjectCreated={async (_projectId, projectKey) => {
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
