import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette, useCommands } from "@/components/CommandPalette";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { createKeyboardShortcuts, createKeySequences } from "@/config/keyboardShortcuts";
import { useKeyboardShortcutsWithSequences } from "@/hooks/useKeyboardShortcuts";
import {
  OrgContext,
  type OrgContextType,
  useOrganization,
  useOrganizationOptional,
} from "@/hooks/useOrgContext";
import { SidebarProvider } from "@/hooks/useSidebarState";

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

  const { orgSlug } = useOrganization();

  // Navigation callback for keyboard shortcuts
  const handleNavigate = useCallback(
    (to: string) => {
      navigate({ to });
    },
    [navigate],
  );

  // Build keyboard shortcuts (need orgSlug for navigation)
  const shortcuts = createKeyboardShortcuts({
    orgSlug,
    navigate: handleNavigate,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  const sequences = createKeySequences({
    orgSlug,
    navigate: handleNavigate,
    setShowCommandPalette,
    setShowShortcutsHelp,
    setShowAIAssistant,
  });

  // Enable keyboard shortcuts
  useKeyboardShortcutsWithSequences(shortcuts, sequences, true);

  // Build command palette commands
  const commands = useCommands();

  return (
    <SidebarProvider>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-toast-critical focus:bg-brand focus:text-brand-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Flex className="h-screen overflow-hidden bg-ui-bg-secondary">
        {/* Unified sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <Flex direction="column" className="flex-1 min-w-0">
          {/* Offline indicator */}
          <OfflineBanner />

          {/* Slim header */}
          <AppHeader
            onShowCommandPalette={() => setShowCommandPalette(true)}
            onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
          />

          {/* Page content */}
          <FlexItem as="main" flex="1" id="main-content" className="overflow-auto bg-ui-bg scrollbar-subtle">
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
      </Flex>
    </SidebarProvider>
  );
}
