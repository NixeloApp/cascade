/**
 * App Sidebar
 *
 * Main navigation sidebar with collapsible sections for projects, documents, and teams.
 * Supports favorites, recent items, workspace switching, and keyboard navigation.
 * Integrates with organization context for multi-tenant navigation.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link, type LinkProps, useLocation, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { CreateTeamModal } from "@/components/CreateTeamModal";
import { SidebarTeamItem } from "@/components/Sidebar/SidebarTeamItem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon as AppIcon, type IconSize } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { NavItem as NavItemBase } from "@/components/ui/NavItem";
import { Separator } from "@/components/ui/Separator";
import { Stack } from "@/components/ui/Stack";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { useSidebarState } from "@/hooks/useSidebarState";
import type { LucideIcon } from "@/lib/icons";
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  FileText,
  FolderKanban,
  Home,
  ListIcon,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Puzzle,
  Server,
  Settings,
  ShieldCheck,
  Star,
  Users,
  X,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Main application sidebar with navigation, projects, and teams.
 */

/** Slim shapes returned by the sidebar-specific queries. */
type SidebarWorkspace = FunctionReturnType<typeof api.workspaces.listForSidebar>[number];
type SidebarTeam = FunctionReturnType<typeof api.teams.listForSidebar>[number];
type SidebarDocument = FunctionReturnType<typeof api.documents.listForSidebar>["documents"][number];
type SidebarFavoriteDocument = FunctionReturnType<typeof api.documents.listFavorites>[number];

const DOCUMENT_DISPLAY_LIMIT = 10;
const WORKSPACE_DISPLAY_LIMIT = 25;

function createSetToggle<T extends string>(
  setter: React.Dispatch<React.SetStateAction<Set<T>>>,
): (key: T) => void {
  return (key: T) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
}

function filterItems<T extends { name?: string; title?: string }>(
  items: T[],
  search: string,
  field: "name" | "title",
): T[] {
  const trimmed = search.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter((item) => {
    const value = field === "name" ? item.name : (item as { title?: string }).title;
    return value?.toLowerCase().includes(trimmed);
  });
}

function groupTeamsByWorkspace(
  teams: SidebarTeam[] | undefined,
): Map<Id<"workspaces">, SidebarTeam[]> {
  const map = new Map<Id<"workspaces">, SidebarTeam[]>();
  if (!teams) return map;
  for (const team of teams) {
    const existing = map.get(team.workspaceId);
    if (existing) existing.push(team);
    else map.set(team.workspaceId, [team]);
  }
  return map;
}

interface SidebarIconShellProps {
  icon: LucideIcon;
  recipe:
    | "sidebarNavIcon"
    | "sidebarPrimaryNavIcon"
    | "sidebarPrimaryNavIconActive"
    | "sidebarSectionIcon"
    | "sidebarSectionIconActive";
  shellSizeClass?: string;
  iconSize?: IconSize;
  iconClassName?: string;
}

function SidebarIconShell({
  icon,
  recipe,
  shellSizeClass = "size-8",
  iconSize = "sm",
  iconClassName,
}: SidebarIconShellProps) {
  return (
    <Card recipe={recipe} padding="none" className={cn(shellSizeClass, "shrink-0")}>
      <Flex align="center" justify="center" className="h-full">
        <AppIcon icon={icon} size={iconSize} className={iconClassName} />
      </Flex>
    </Card>
  );
}

// Sub-item Component (defined early as it's used by other components)
type NavSubItemProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  label: string;
  isActive: boolean;
  icon?: LucideIcon;
  onClick?: (event: React.MouseEvent) => void;
};

function NavSubItem({
  label,
  isActive,
  icon: Icon,
  to,
  params,
  onClick,
  ...props
}: NavSubItemProps) {
  return (
    <Tooltip content={label}>
      <NavItemBase asChild active={isActive} size="sm" className="min-h-9">
        <Link to={to} params={params} onClick={onClick} {...props}>
          {Icon && (
            <SidebarIconShell
              icon={Icon}
              recipe="sidebarNavIcon"
              shellSizeClass="size-6"
              iconSize="xsPlus"
              iconClassName="shrink-0"
            />
          )}
          <span className="truncate">{label}</span>
        </Link>
      </NavItemBase>
    </Tooltip>
  );
}

interface WorkspacesSectionContentProps {
  workspaces: SidebarWorkspace[];
  filteredCount: number;
  totalCount: number;
  showSearch: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  teamsByWorkspace: Map<Id<"workspaces">, SidebarTeam[]>;
  expandedWorkspaces: Set<string>;
  expandedTeams: Set<string>;
  onToggleWorkspace: (slug: string) => void;
  onToggleTeam: (slug: string) => void;
  orgSlug: string;
  location: { pathname: string };
  onNavClick: () => void;
  onCreateTeam: (workspace: { id: Id<"workspaces">; slug: string }) => void;
  onCreateProject?: () => void;
}

function WorkspacesSectionContent({
  workspaces,
  filteredCount,
  totalCount,
  showSearch,
  searchValue,
  onSearchChange,
  teamsByWorkspace,
  expandedWorkspaces,
  expandedTeams,
  onToggleWorkspace,
  onToggleTeam,
  orgSlug,
  location,
  onNavClick,
  onCreateTeam,
  onCreateProject,
}: WorkspacesSectionContentProps) {
  return (
    <>
      {showSearch && (
        <li className="list-none">
          <Card variant="ghost" padding="xs">
            <Input
              variant="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search workspaces"
              aria-label="Search workspaces"
            />
          </Card>
        </li>
      )}
      {onCreateProject && (
        <li className="list-none px-1 mb-1">
          <Button
            variant="ghost"
            size="sm"
            chromeSize="listRow"
            onClick={onCreateProject}
            leftIcon={<AppIcon icon={Plus} size="sm" />}
          >
            New Project
          </Button>
        </li>
      )}
      {workspaces.map((workspace: SidebarWorkspace) => (
        <WorkspaceNavItem
          key={workspace._id}
          workspace={workspace}
          orgSlug={orgSlug}
          teams={teamsByWorkspace.get(workspace._id) || []}
          isExpanded={expandedWorkspaces.has(workspace.slug)}
          expandedTeams={expandedTeams}
          onToggleWorkspace={onToggleWorkspace}
          onToggleTeam={onToggleTeam}
          onNavClick={onNavClick}
          onCreateTeam={onCreateTeam}
          location={location}
          itemTestId={TEST_IDS.NAV.WORKSPACE_ITEM}
        />
      ))}
      {showSearch && filteredCount === 0 && (
        <li className="list-none">
          <Typography variant="caption" color="tertiary" className="px-3 py-2">
            No matching workspaces
          </Typography>
        </li>
      )}
      {showSearch && (
        <li className="list-none">
          <NavSubItem
            to={ROUTES.workspaces.list.path}
            params={{ orgSlug }}
            label={`Show all workspaces (${totalCount})`}
            isActive={location.pathname.includes("/workspaces")}
            onClick={onNavClick}
          />
        </li>
      )}
    </>
  );
}

interface WorkspaceNavItemProps {
  workspace: SidebarWorkspace;
  orgSlug: string;
  teams: SidebarTeam[];
  isExpanded: boolean;
  expandedTeams: Set<string>;
  onToggleWorkspace: (slug: string) => void;
  onToggleTeam: (slug: string) => void;
  onNavClick: () => void;
  onCreateTeam: (workspace: { id: Id<"workspaces">; slug: string }) => void;
  location: { pathname: string };
  itemTestId?: string;
}

interface DocumentsSectionContentProps {
  favorites: SidebarFavoriteDocument[];
  documents: SidebarDocument[];
  totalCount: number;
  showSearch: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  orgSlug: string;
  location: { pathname: string };
  onNavClick: () => void;
}

function DocumentsSectionContent({
  favorites,
  documents,
  totalCount,
  showSearch,
  searchValue,
  onSearchChange,
  orgSlug,
  location,
  onNavClick,
}: DocumentsSectionContentProps) {
  return (
    <>
      <li className="list-none">
        <NavSubItem
          to={ROUTES.documents.templates.path}
          params={{ orgSlug }}
          label="Templates"
          isActive={location.pathname.includes("/documents/templates")}
          onClick={onNavClick}
          icon={Copy}
        />
      </li>
      <li className="list-none mx-2" aria-hidden="true">
        <Separator spacing="sm" />
      </li>
      {favorites.length > 0 && (
        <>
          <li className="list-none px-3 pt-1">
            <Flex align="center" gap="xs" className="text-ui-text-tertiary">
              <AppIcon icon={Star} size="xsPlus" tone="warning" className="fill-status-warning" />
              <Typography variant="caption">Favorites</Typography>
            </Flex>
          </li>
          {favorites.map((doc) => (
            <li key={doc._id} className="list-none" data-testid={TEST_IDS.NAV.DOCUMENT_ITEM}>
              <NavSubItem
                to={ROUTES.documents.detail.path}
                params={{ orgSlug, id: doc._id }}
                label={doc.title || "Untitled"}
                isActive={location.pathname.includes(`/documents/${doc._id}`)}
                onClick={onNavClick}
                icon={Star}
              />
            </li>
          ))}
          <li className="list-none mx-2" aria-hidden="true">
            <Separator spacing="sm" />
          </li>
        </>
      )}
      {showSearch && (
        <li className="list-none">
          <Card variant="ghost" padding="xs">
            <Input
              variant="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search documents"
              aria-label="Search documents"
            />
          </Card>
        </li>
      )}
      {documents.map((doc: SidebarDocument) => (
        <li key={doc._id} className="list-none" data-testid={TEST_IDS.NAV.DOCUMENT_ITEM}>
          <NavSubItem
            to={ROUTES.documents.detail.path}
            params={{ orgSlug, id: doc._id }}
            label={doc.title}
            isActive={location.pathname.includes(`/documents/${doc._id}`)}
            onClick={onNavClick}
          />
        </li>
      ))}
      {showSearch && (
        <li className="list-none">
          <NavSubItem
            to={ROUTES.documents.list.path}
            params={{ orgSlug }}
            label={`Show all documents (${totalCount})`}
            isActive={location.pathname.includes("/documents")}
            onClick={onNavClick}
          />
        </li>
      )}
    </>
  );
}

function WorkspaceNavItem({
  workspace,
  orgSlug,
  teams,
  isExpanded,
  expandedTeams,
  onToggleWorkspace,
  onToggleTeam,
  onNavClick,
  onCreateTeam,
  location,
  itemTestId,
}: WorkspaceNavItemProps) {
  const shouldShowTeams = isExpanded;

  return (
    <li className="ml-2 group list-none" data-testid={itemTestId}>
      <Flex align="center" gap="xs">
        <IconButton
          variant="ghost"
          size="compact"
          onClick={() => onToggleWorkspace(workspace.slug)}
          aria-expanded={shouldShowTeams}
          aria-label={shouldShowTeams ? `Collapse ${workspace.name}` : `Expand ${workspace.name}`}
        >
          {shouldShowTeams ? (
            <AppIcon icon={ChevronDown} size="sm" />
          ) : (
            <AppIcon icon={ChevronRight} size="sm" />
          )}
        </IconButton>
        <NavSubItem
          to={ROUTES.workspaces.detail.path}
          params={{ orgSlug, workspaceSlug: workspace.slug }}
          label={workspace.name}
          isActive={location.pathname.includes(`/workspaces/${workspace.slug}`)}
          onClick={onNavClick}
        />
        <IconButton
          variant="ghost"
          size="compact"
          reveal
          onClick={(e) => {
            e.stopPropagation();
            onCreateTeam({ id: workspace._id, slug: workspace.slug });
          }}
          aria-label="Create new team"
        >
          <AppIcon icon={Plus} size="sm" />
        </IconButton>
      </Flex>

      {shouldShowTeams && (
        <ul className="list-none">
          {teams.map((team: SidebarTeam) => (
            <SidebarTeamItem
              key={team._id}
              team={team}
              workspaceSlug={workspace.slug}
              orgSlug={orgSlug}
              isExpanded={expandedTeams.has(team.slug)}
              onToggle={onToggleTeam}
              onNavClick={onNavClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface AppSidebarProps {
  onCreateProject?: () => void;
}

/** Main app sidebar with workspace navigation, documents, and settings. */
export function AppSidebar({ onCreateProject }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarState();

  // Get organization from URL context
  const { orgSlug, organizationName, organizationId } = useOrganization();

  // All hooks must be called unconditionally
  const isAdmin = useAuthenticatedQuery(api.users.isOrganizationAdmin, {});
  const showTimeTracking = isAdmin === true;

  // Section expand states
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [documentSearch, setDocumentSearch] = useState("");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [createTeamWorkspace, setCreateTeamWorkspace] = useState<{
    id: Id<"workspaces">;
    slug: string;
  } | null>(null);

  // Data — use lightweight sidebar-specific queries (no counts, no enrichment)
  const documentsResult = useAuthenticatedQuery(api.documents.listForSidebar, {
    limit: 11,
    organizationId,
  });
  const favoritesResult = useAuthenticatedQuery(api.documents.listFavorites, {
    limit: 5,
    organizationId,
  });
  const documents = documentsResult?.documents;
  const favorites = favoritesResult ?? [];
  const workspaces = useAuthenticatedQuery(api.workspaces.listForSidebar, { organizationId });
  const teams = useAuthenticatedQuery(api.teams.listForSidebar, { organizationId });

  const allDocuments = documents ?? [];
  const favoriteDocumentIds = new Set(favorites.map((favorite) => favorite._id));
  const allWorkspaces = workspaces ?? [];
  const showDocumentSearch = allDocuments.length > DOCUMENT_DISPLAY_LIMIT;
  const showWorkspaceSearch = allWorkspaces.length > WORKSPACE_DISPLAY_LIMIT;

  // Auto-expand the workspace tree when navigating into a workspace route.
  // Only seeds on transition (inactive -> active), so the user can still collapse manually.
  const prevActiveWorkspaceRef = useRef<string | null>(null);
  useEffect(() => {
    const activeSlug = allWorkspaces.find((ws) => {
      const base = ROUTES.workspaces.detail.build(orgSlug, ws.slug);
      return location.pathname === base || location.pathname.startsWith(`${base}/`);
    })?.slug;

    if (activeSlug && prevActiveWorkspaceRef.current !== activeSlug) {
      setExpandedWorkspaces((prev) => {
        if (prev.has(activeSlug)) return prev;
        const next = new Set(prev);
        next.add(activeSlug);
        return next;
      });
    }
    prevActiveWorkspaceRef.current = activeSlug ?? null;
  }, [location.pathname, allWorkspaces, orgSlug]);

  const filteredFavorites = filterItems(favorites, documentSearch, "title");
  const filteredDocuments = (
    showDocumentSearch ? filterItems(allDocuments, documentSearch, "title") : allDocuments
  ).filter((doc) => !favoriteDocumentIds.has(doc._id));
  const displayedDocuments = filteredDocuments.slice(0, DOCUMENT_DISPLAY_LIMIT);

  const filteredWorkspaces = showWorkspaceSearch
    ? filterItems(allWorkspaces, workspaceSearch, "name")
    : allWorkspaces;
  const displayedWorkspaces = filteredWorkspaces.slice(0, WORKSPACE_DISPLAY_LIMIT);

  const teamsByWorkspace = groupTeamsByWorkspace(teams);

  // Mutations
  const { mutate: createDocument } = useAuthenticatedMutation(api.documents.create);
  const { mutate: createWorkspace } = useAuthenticatedMutation(api.workspaces.create);

  const isActive = (pathPart: string) => {
    return location.pathname.includes(pathPart);
  };

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
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const slug = `workspace-${Date.now().toString(36)}`;
      await createWorkspace({
        name: "New Workspace",
        slug,
        organizationId,
      });
      navigate({
        to: ROUTES.workspaces.detail.path,
        params: { orgSlug, workspaceSlug: slug },
      });
      showSuccess("Workspace created");
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create workspace");
    }
  };

  const toggleWorkspace = createSetToggle(setExpandedWorkspaces);
  const toggleTeam = createSetToggle(setExpandedTeams);

  const handleNavClick = () => {
    closeMobile();
  };

  // Determine if we should show the collapsed state
  // On mobile (when open), we always want to show the expanded state
  const showCollapsed = isCollapsed && !isMobileOpen;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay - clickable to close sidebar */}
      {isMobileOpen && (
        <Button
          variant="unstyled"
          chrome="backdrop"
          chromeSize="backdrop"
          className="z-40 lg:hidden cursor-default"
          onClick={closeMobile}
          onKeyDown={(e) => e.key === "Escape" && closeMobile()}
          aria-label="Close sidebar"
        />
      )}

      <aside
        data-testid={TEST_IDS.NAV.SIDEBAR}
        className={cn(
          "fixed lg:relative z-50 lg:z-auto h-screen transition-default",
          isCollapsed ? "w-sidebar lg:w-sidebar-collapsed" : "w-sidebar",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Card recipe="sidebarShell" padding="none" radius="none">
          <Flex direction="column" className="h-full">
            {/* Header with organization name and collapse toggle */}
            <div className={cn(getCardRecipeClassName("sidebarHeaderBar"), "p-2")}>
              <Flex align="center" justify="between">
                {!showCollapsed && (
                  <Tooltip content={organizationName}>
                    <Link
                      to={ROUTES.dashboard.path}
                      params={{ orgSlug }}
                      onClick={handleNavClick}
                      className="min-w-0 grow"
                    >
                      <div className={cn(getCardRecipeClassName("sidebarOrgCard"), "px-3 py-2")}>
                        <Flex align="center" gap="sm">
                          <div
                            className={cn(
                              getCardRecipeClassName("sidebarOrgInitial"),
                              "size-9 shrink-0",
                            )}
                          >
                            <Flex align="center" justify="center" className="h-full">
                              <Typography variant="sidebarOrgInitial">
                                {organizationName.charAt(0).toUpperCase()}
                              </Typography>
                            </Flex>
                          </div>
                          <div className="min-w-0">
                            <Typography variant="eyebrow" color="tertiary">
                              Workspace
                            </Typography>
                            <Typography variant="large" className="max-w-36 truncate">
                              {organizationName}
                            </Typography>
                          </div>
                        </Flex>
                      </div>
                    </Link>
                  </Tooltip>
                )}

                {/* Desktop Toggle Button */}
                <IconButton
                  variant="solid"
                  size="md"
                  onClick={toggleCollapse}
                  className={cn("hidden lg:flex", showCollapsed && "mx-auto")}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <AppIcon icon={PanelLeftOpen} size="md" />
                  ) : (
                    <AppIcon icon={PanelLeftClose} size="md" />
                  )}
                </IconButton>

                {/* Mobile Close Button */}
                <IconButton
                  variant="solid"
                  size="md"
                  onClick={closeMobile}
                  className="lg:hidden"
                  aria-label="Close sidebar"
                >
                  <AppIcon icon={X} size="md" />
                </IconButton>
              </Flex>
            </div>

            {/* Navigation */}
            <FlexItem
              as="nav"
              grow
              className="overflow-y-auto overflow-x-hidden scrollbar-subtle"
              aria-label="Main Navigation"
            >
              <div className="p-1">
                <Stack as="ul" gap="sm" className="list-none">
                  {/* Dashboard */}
                  <NavItem
                    to={ROUTES.dashboard.path}
                    params={{ orgSlug }}
                    icon={Home}
                    label="Dashboard"
                    isActive={isActive(ROUTES.dashboard.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                    data-testid={TEST_IDS.NAV.DASHBOARD_LINK}
                  />
                  {/* Issues */}
                  <NavItem
                    to={ROUTES.issues.list.path}
                    params={{ orgSlug }}
                    icon={ListIcon}
                    label="Issues"
                    isActive={isActive(ROUTES.issues.list.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.myIssues.path}
                    params={{ orgSlug }}
                    icon={FolderKanban}
                    label="My Board"
                    isActive={isActive(ROUTES.myIssues.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.invoices.list.path}
                    params={{ orgSlug }}
                    icon={CreditCard}
                    label="Invoices"
                    isActive={isActive(ROUTES.invoices.list.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.clients.list.path}
                    params={{ orgSlug }}
                    icon={Users}
                    label="Clients"
                    isActive={isActive(ROUTES.clients.list.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.calendar.path}
                    params={{ orgSlug }}
                    icon={Calendar}
                    label="General"
                    isActive={isActive(ROUTES.calendar.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                    data-testid={TEST_IDS.NAV.CALENDAR_LINK}
                  />

                  {/* Products Section */}
                  {!showCollapsed && (
                    <li className="list-none">
                      <div className="p-1 mb-3 mt-5">
                        <Badge variant="sidebarSection" shape="pill">
                          Products
                        </Badge>
                      </div>
                    </li>
                  )}

                  <NavItem
                    to={ROUTES.meetings.path}
                    params={{ orgSlug }}
                    icon={Mic}
                    label="Meetings"
                    isActive={isActive(ROUTES.meetings.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.assistant.path}
                    params={{ orgSlug }}
                    icon={Bot}
                    label="Assistant"
                    isActive={isActive(ROUTES.assistant.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.analytics.path}
                    params={{ orgSlug }}
                    icon={BarChart3}
                    label="Analytics"
                    isActive={isActive(ROUTES.analytics.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.authentication.path}
                    params={{ orgSlug }}
                    icon={ShieldCheck}
                    label="Authentication"
                    isActive={isActive(ROUTES.authentication.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.mcp.path}
                    params={{ orgSlug }}
                    icon={Server}
                    label="MCP Server"
                    isActive={isActive(ROUTES.mcp.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  <NavItem
                    to={ROUTES.addOns.path}
                    params={{ orgSlug }}
                    icon={Puzzle}
                    label="Add-ons"
                    isActive={isActive(ROUTES.addOns.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onClick={handleNavClick}
                  />
                  {/* Documents Section */}
                  <CollapsibleSection
                    icon={FileText}
                    label="Documents"
                    isExpanded={docsExpanded}
                    onToggle={() => setDocsExpanded(!docsExpanded)}
                    isActive={isActive(ROUTES.documents.list.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onAdd={handleCreateDocument}
                    to={ROUTES.documents.list.path}
                    params={{ orgSlug }}
                    onClick={handleNavClick}
                    data-testid={TEST_IDS.NAV.DOCUMENTS_LINK}
                    childrenTestId={TEST_IDS.NAV.DOCUMENT_LIST}
                  >
                    <DocumentsSectionContent
                      favorites={filteredFavorites}
                      documents={displayedDocuments}
                      totalCount={allDocuments.length}
                      showSearch={showDocumentSearch}
                      searchValue={documentSearch}
                      onSearchChange={setDocumentSearch}
                      orgSlug={orgSlug}
                      location={location}
                      onNavClick={handleNavClick}
                    />
                  </CollapsibleSection>
                  {/* Workspaces Section */}
                  <CollapsibleSection
                    icon={FolderKanban}
                    label="Workspaces"
                    isExpanded={workspacesExpanded}
                    onToggle={() => setWorkspacesExpanded(!workspacesExpanded)}
                    isActive={isActive(ROUTES.workspaces.list.path.replace("/$orgSlug", ""))}
                    isCollapsed={showCollapsed}
                    onAdd={handleCreateWorkspace}
                    to={ROUTES.workspaces.list.path}
                    params={{ orgSlug }}
                    onClick={handleNavClick}
                    data-testid={TEST_IDS.NAV.WORKSPACES_LINK}
                    childrenTestId={TEST_IDS.NAV.WORKSPACE_LIST}
                  >
                    <WorkspacesSectionContent
                      workspaces={displayedWorkspaces}
                      filteredCount={filteredWorkspaces.length}
                      totalCount={allWorkspaces.length}
                      showSearch={showWorkspaceSearch}
                      searchValue={workspaceSearch}
                      onSearchChange={setWorkspaceSearch}
                      teamsByWorkspace={teamsByWorkspace}
                      expandedWorkspaces={expandedWorkspaces}
                      expandedTeams={expandedTeams}
                      onToggleWorkspace={toggleWorkspace}
                      onToggleTeam={toggleTeam}
                      orgSlug={orgSlug}
                      location={location}
                      onNavClick={handleNavClick}
                      onCreateTeam={setCreateTeamWorkspace}
                      onCreateProject={onCreateProject}
                    />
                  </CollapsibleSection>
                  {/* Time Tracking (admin only) */}
                  {showTimeTracking && (
                    <NavItem
                      to={ROUTES.timeTracking.path}
                      params={{ orgSlug }}
                      icon={Clock}
                      label="Time Tracking"
                      isActive={isActive(ROUTES.timeTracking.path.replace("/$orgSlug", ""))}
                      isCollapsed={showCollapsed}
                      onClick={handleNavClick}
                      data-testid={TEST_IDS.NAV.TIMESHEET_LINK}
                    />
                  )}
                </Stack>
              </div>
            </FlexItem>

            {/* Bottom section - Settings */}
            <div className={cn(getCardRecipeClassName("sidebarFooterBar"), "p-1")}>
              <ul className="list-none">
                <NavItem
                  to={ROUTES.settings.profile.path}
                  params={{ orgSlug }}
                  icon={Settings}
                  label="Settings"
                  isActive={isActive("/settings")}
                  isCollapsed={showCollapsed}
                  onClick={handleNavClick}
                  data-testid={TEST_IDS.NAV.SETTINGS_LINK}
                />
              </ul>
            </div>
          </Flex>
        </Card>

        <CreateTeamModal
          isOpen={!!createTeamWorkspace}
          onClose={() => setCreateTeamWorkspace(null)}
          workspaceId={createTeamWorkspace?.id}
          workspaceSlug={createTeamWorkspace?.slug}
        />
      </aside>
    </TooltipProvider>
  );
}

// Nav Item Component
type NavItemProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  "data-testid"?: string;
  onClick?: (event: React.MouseEvent) => void;
};

function NavItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  "data-testid": dataTestId,
  to,
  params,
  search,
  onClick,
  ...props
}: NavItemProps) {
  const content = (
    <NavItemBase
      asChild
      active={isActive}
      collapsed={isCollapsed}
      variant="bordered"
      className="group"
    >
      <Link
        to={to}
        params={params}
        search={search}
        onClick={onClick}
        {...props}
        data-testid={dataTestId}
        aria-label={isCollapsed ? label : undefined}
      >
        <SidebarIconShell
          icon={Icon}
          recipe={isActive ? "sidebarPrimaryNavIconActive" : "sidebarPrimaryNavIcon"}
          iconClassName="size-4.5 shrink-0"
        />
        {!isCollapsed && label}
      </Link>
    </NavItemBase>
  );

  if (isCollapsed) {
    return (
      <li>
        <Tooltip content={label} side="right">
          {content}
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
}

// Collapsible Section Component
// We use a union validation here: either it acts as a link (with valid to/params) or it doesn't.
// CollapsibleSection Component
type CollapsibleSectionProps = {
  icon: LucideIcon;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  onAdd: () => void;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  childrenTestId?: string;
  "data-testid"?: string;
} & (
  | (Omit<LinkProps, "to"> & { to: LinkProps["to"] })
  | { to?: never; params?: never; search?: never }
);

function CollapsibleSection({
  icon: Icon,
  label,
  isExpanded,
  onToggle,
  isActive,
  isCollapsed,
  onAdd,
  children,
  childrenTestId,
  "data-testid": dataTestId,
  ...props
}: CollapsibleSectionProps) {
  // Safe type narrowing check
  const isLink = "to" in props && !!props.to;

  if (isCollapsed) {
    return (
      <li>
        <Tooltip content={label} side="right">
          {isLink ? (
            <NavItemBase
              asChild
              active={isActive}
              size="sm"
              className="justify-center"
              aria-label={label}
            >
              <Link
                {...props}
                to={props.to}
                params={props.params}
                search={props.search}
                data-testid={dataTestId}
              >
                <AppIcon icon={Icon} size="md" />
              </Link>
            </NavItemBase>
          ) : (
            <NavItemBase size="sm" className="justify-center">
              <AppIcon icon={Icon} size="md" />
            </NavItemBase>
          )}
        </Tooltip>
      </li>
    );
  }

  return (
    <li>
      {/* Section header */}
      <NavItemBase active={isActive} variant="bordered" className="group">
        <IconButton
          variant="ghost"
          size="compact"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
        >
          {isExpanded ? (
            <AppIcon icon={ChevronDown} size="sm" />
          ) : (
            <AppIcon icon={ChevronRight} size="sm" />
          )}
        </IconButton>
        {isLink ? (
          <Link
            {...props}
            to={props.to}
            params={props.params}
            search={props.search}
            data-testid={dataTestId}
            aria-current={isActive ? "page" : undefined}
            className="min-w-0 grow"
          >
            <Flex align="center" gap="sm" className="min-w-0">
              <SidebarIconShell
                icon={Icon}
                recipe={isActive ? "sidebarSectionIconActive" : "sidebarSectionIcon"}
                iconClassName="size-4.5"
              />
              <span className="truncate">{label}</span>
            </Flex>
          </Link>
        ) : (
          <FlexItem grow>
            <Flex align="center" gap="sm" className="min-w-0">
              <SidebarIconShell icon={Icon} recipe="sidebarSectionIcon" iconClassName="size-4.5" />
              <span className="truncate">{label}</span>
            </Flex>
          </FlexItem>
        )}
        <IconButton
          variant="ghost"
          size="compact"
          reveal
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          aria-label={`Add new ${label.toLowerCase().slice(0, -1)}`}
        >
          <AppIcon icon={Plus} size="sm" />
        </IconButton>
      </NavItemBase>

      {/* Section children */}
      {isExpanded && (
        <Card recipe="sidebarSectionChildren" padding="none" className="ml-5 mt-1.5 p-2">
          <Stack as="ul" gap="xs" className="list-none" data-testid={childrenTestId}>
            {children}
          </Stack>
        </Card>
      )}
    </li>
  );
}
