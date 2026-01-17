import { api } from "@convex/_generated/api";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette, useCommands } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { Flex } from "@/components/ui/Flex";
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

function OrganizationLayout() {
  const { orgSlug } = Route.useParams();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Skip queries until auth is ready - this prevents queries from running during auth hydration
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    isAuthenticated ? undefined : "skip",
  ) as UserOrganization[] | undefined;

  // Fetch organization by slug - also skip until authenticated
  const organization = useQuery(
    api.organizations.getOrganizationBySlug,
    isAuthenticated ? { slug: orgSlug } : "skip",
  );

  // Loading state - wait for auth AND queries
  if (isAuthLoading || organization === undefined || userOrganizations === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // Not authenticated - parent _auth route should handle this, but just in case
  if (!isAuthenticated) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // organization not found
  if (organization === null) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-4">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            organization not found
          </Typography>
          <Typography variant="p" color="secondary">
            The organization "{orgSlug}" does not exist.
          </Typography>
        </div>
      </Flex>
    );
  }

  // Check if user has access to this organization
  const userOrganization = userOrganizations?.find((c) => c._id === organization._id);

  if (!userOrganization) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-4">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2">
            Access denied
          </Typography>
          <Typography variant="p" color="secondary">
            You don't have access to this organization.
          </Typography>
        </div>
      </Flex>
    );
  }

  const orgContextValue: OrgContextType = {
    organizationId: organization._id,
    orgSlug: organization.slug,
    organizationName: organization.name,
    userRole: userOrganization.userRole,
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
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
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
