import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link, type LinkProps, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { CreateTeamModal } from "@/components/CreateTeamModal";
import { SidebarTeamItem } from "@/components/Sidebar/SidebarTeamItem";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  Archive,
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FolderKanban,
  Home,
  ListIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Puzzle,
  Server,
  Settings,
  ShieldCheck,
} from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { Tooltip, TooltipProvider } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarState();

  // Get organization from URL context
  const { orgSlug, organizationName, organizationId } = useOrganization();

  // All hooks must be called unconditionally
  const isAdmin = useQuery(api.users.isOrganizationAdmin);
  const showTimeTracking = isAdmin === true;

  // Section expand states
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [createTeamWorkspace, setCreateTeamWorkspace] = useState<{
    id: Id<"workspaces">;
    slug: string;
  } | null>(null);

  // Data
  const documentsResult = useQuery(api.documents.list, { limit: 11, organizationId });
  const documents = documentsResult?.documents;
  const workspaces = useQuery(api.workspaces.list, { organizationId });
  const teams = useQuery(api.teams.getOrganizationTeams, { organizationId });
  const myProjects = useQuery(api.dashboard.getMyProjects);
  const defaultProject = myProjects?.[0];

  // Group teams by workspace - O(T) once, not O(W*T) per render
  const teamsByWorkspace = useMemo(() => {
    const map = new Map<Id<"workspaces">, Doc<"teams">[]>();
    if (!teams) return map;
    for (const team of teams) {
      const existing = map.get(team.workspaceId);
      if (existing) {
        existing.push(team);
      } else {
        map.set(team.workspaceId, [team]);
      }
    }
    return map;
  }, [teams]);

  // Mutations
  const createDocument = useMutation(api.documents.create);
  const createWorkspace = useMutation(api.workspaces.create);
  // const createProject = useMutation(api.projects.createProject); // TODO: Add project creation UI

  const isActive = (pathPart: string) => {
    return location.pathname.includes(pathPart);
  };

  const handleCreateDocument = async () => {
    try {
      const docId = await createDocument({
        title: "Untitled Document",
        isPublic: false,
        organizationId,
      });
      navigate({
        to: ROUTES.documents.detail.path,
        params: { orgSlug, id: docId },
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

  const toggleWorkspace = (workspaceSlug: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceSlug)) {
        next.delete(workspaceSlug);
      } else {
        next.add(workspaceSlug);
      }
      return next;
    });
  };

  const toggleTeam = (teamSlug: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamSlug)) {
        next.delete(teamSlug);
      } else {
        next.add(teamSlug);
      }
      return next;
    });
  };

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay - clickable to close sidebar */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ui-bg-overlay z-40 lg:hidden"
          onClick={closeMobile}
          onKeyDown={(e) => e.key === "Escape" && closeMobile()}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative z-50 lg:z-auto h-screen overflow-hidden",
          "bg-ui-bg-sidebar",
          "border-r border-ui-border",
          "transition-default",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Flex direction="column" className="h-full">
          {/* Header with organization name and collapse toggle */}
          <Flex align="center" justify="between" className="p-4 border-b border-ui-border">
            {!isCollapsed && (
              <Link to={ROUTES.dashboard.path} params={{ orgSlug }} onClick={handleNavClick}>
                <Typography variant="large" className="truncate max-w-40">
                  {organizationName}
                </Typography>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={cn("h-9 w-9", isCollapsed && "mx-auto")}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>
          </Flex>

          {/* Navigation */}
          <Flex
            as="nav"
            direction="column"
            gap="xs"
            className="flex-1 overflow-y-auto p-2 scrollbar-subtle"
          >
            {/* Dashboard */}
            <NavItem
              to={ROUTES.dashboard.path}
              params={{ orgSlug }}
              icon={Home}
              label="Dashboard"
              isActive={isActive("/dashboard")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
              data-tour="nav-dashboard"
            />
            {/* Issues */}
            <NavItem
              to={ROUTES.issues.list.path}
              params={{ orgSlug }}
              icon={ListIcon}
              label="Issues"
              isActive={isActive("/issues")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
              data-tour="nav-issues"
            />
            {/* Archives */}
            <NavItem
              to={ROUTES.archives.path}
              params={{ orgSlug }}
              icon={Archive}
              label="Archives"
              isActive={isActive("/archives")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            {/* Calendar - Links to first project's calendar */}
            {defaultProject && (
              <NavItem
                to={ROUTES.projects.calendar.path}
                params={{ orgSlug, key: defaultProject.key }}
                icon={Calendar}
                label="General"
                isActive={isActive("/calendar")}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
                data-tour="nav-calendar"
              />
            )}

            {/* Products Section */}
            {!isCollapsed && (
              <Typography
                variant="small"
                color="tertiary"
                className="px-3 mt-4 mb-2 text-caption font-bold uppercase tracking-wider"
              >
                Products
              </Typography>
            )}

            <NavItem
              to={ROUTES.assistant.path}
              params={{ orgSlug }}
              icon={Bot}
              label="Assistant"
              isActive={isActive("/assistant")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              to={ROUTES.analytics.path}
              params={{ orgSlug }}
              icon={BarChart3}
              label="Analytics"
              isActive={isActive("/analytics")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              to={ROUTES.authentication.path}
              params={{ orgSlug }}
              icon={ShieldCheck}
              label="Authentication"
              isActive={isActive("/authentication")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              to={ROUTES.mcp.path}
              params={{ orgSlug }}
              icon={Server}
              label="MCP Server"
              isActive={isActive("/mcp-server")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              to={ROUTES.addOns.path}
              params={{ orgSlug }}
              icon={Puzzle}
              label="Add-ons"
              isActive={isActive("/add-ons")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
            {/* Documents Section */}
            <CollapsibleSection
              icon={FileText}
              label="Documents"
              isExpanded={docsExpanded}
              onToggle={() => setDocsExpanded(!docsExpanded)}
              isActive={isActive("/documents")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateDocument}
              to={ROUTES.documents.list.path}
              params={{ orgSlug }}
              onClick={handleNavClick}
              data-tour="nav-documents"
            >
              <NavSubItem
                to={ROUTES.documents.templates.path}
                params={{ orgSlug }}
                label="Templates"
                isActive={location.pathname.includes("/documents/templates")}
                onClick={handleNavClick}
                icon={Copy}
              />
              <div className="h-px bg-ui-border my-1 mx-2" />
              {(documents ?? []).slice(0, 10).map((doc: Doc<"documents">) => (
                <NavSubItem
                  key={doc._id}
                  to={ROUTES.documents.detail.path}
                  params={{ orgSlug, id: doc._id }}
                  label={doc.title}
                  isActive={location.pathname.includes(`/documents/${doc._id}`)}
                  onClick={handleNavClick}
                />
              ))}
              {(documents?.length ?? 0) > 10 && (
                <Typography variant="p" color="tertiary" className="px-3 py-1 text-xs">
                  +{(documents?.length ?? 0) - 10} more
                </Typography>
              )}
            </CollapsibleSection>
            {/* Workspaces Section */}
            <CollapsibleSection
              icon={FolderKanban}
              label="Workspaces"
              isExpanded={workspacesExpanded}
              onToggle={() => setWorkspacesExpanded(!workspacesExpanded)}
              isActive={isActive("/workspaces")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateWorkspace}
              to={ROUTES.workspaces.list.path}
              params={{ orgSlug }}
              onClick={handleNavClick}
              data-tour="nav-projects"
            >
              {workspaces?.map((workspace: Doc<"workspaces">) => {
                // O(1) lookup from pre-computed Map instead of O(T) filter
                const workspaceTeams = teamsByWorkspace.get(workspace._id) || [];
                const isWorkspaceExpanded = expandedWorkspaces.has(workspace.slug);

                return (
                  <div key={workspace._id} className="ml-2 group">
                    {/* Workspace Item */}
                    <Flex align="center" gap="xs">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleWorkspace(workspace.slug)}
                        className="h-6 w-6 p-0.5"
                        aria-expanded={isWorkspaceExpanded}
                        aria-label={
                          isWorkspaceExpanded
                            ? `Collapse ${workspace.name}`
                            : `Expand ${workspace.name}`
                        }
                      >
                        {isWorkspaceExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <NavSubItem
                        to={ROUTES.workspaces.detail.path}
                        params={{ orgSlug, workspaceSlug: workspace.slug }}
                        label={workspace.name}
                        isActive={location.pathname.includes(`/workspaces/${workspace.slug}`)}
                        onClick={handleNavClick}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateTeamWorkspace({ id: workspace._id, slug: workspace.slug });
                        }}
                        className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label="Create new team"
                      >
                        <Plus className="w-4 h-4 text-ui-text-tertiary" />
                      </Button>
                    </Flex>

                    {/* Teams under workspace */}
                    {isWorkspaceExpanded &&
                      workspaceTeams.map((team: Doc<"teams">) => (
                        <SidebarTeamItem
                          key={team._id}
                          team={team}
                          workspaceSlug={workspace.slug}
                          orgSlug={orgSlug}
                          isExpanded={expandedTeams.has(team.slug)}
                          onToggle={toggleTeam}
                          onNavClick={handleNavClick}
                        />
                      ))}
                  </div>
                );
              })}
            </CollapsibleSection>
            {/* Time Tracking (admin only) */}
            {showTimeTracking && (
              <NavItem
                to={ROUTES.timeTracking.path}
                params={{ orgSlug }}
                icon={Clock}
                label="Time Tracking"
                isActive={isActive("/time-tracking")}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
                data-tour="nav-timesheet"
              />
            )}
          </Flex>

          {/* Bottom section - Settings */}
          <div className="p-2 border-t border-ui-border">
            <NavItem
              to={ROUTES.settings.profile.path}
              params={{ orgSlug }}
              icon={Settings}
              label="Settings"
              isActive={isActive("/settings")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
              data-tour="nav-settings"
            />
          </div>
        </Flex>

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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  "data-tour"?: string;
  onClick?: (event: React.MouseEvent) => void;
};

function NavItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  "data-tour": dataTour,
  to,
  params,
  search,
  onClick,
  ...props
}: NavItemProps) {
  const content = (
    <Link
      to={to}
      params={params}
      search={search}
      onClick={onClick}
      {...props}
      data-tour={dataTour}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-default",
        "text-sm font-medium",
        isActive
          ? "bg-ui-bg-hover text-ui-text border-l-2 border-brand"
          : "text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text",
        isCollapsed && "justify-center px-2 border-l-0",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && label}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

// Collapsible Section Component
// We use a union validation here: either it acts as a link (with valid to/params) or it doesn't.
// CollapsibleSection Component
type CollapsibleSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  onAdd: () => void;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  "data-tour"?: string;
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
  "data-tour": dataTour,
  ...props
}: CollapsibleSectionProps) {
  // Safe type narrowing check
  const isLink = "to" in props && !!props.to;

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {isLink ? (
          <Link
            {...props}
            to={props.to}
            params={props.params}
            search={props.search}
            data-tour={dataTour}
            className={cn(
              "flex items-center justify-center px-2 py-2 rounded-md transition-default",
              isActive
                ? "bg-ui-bg-hover text-ui-text"
                : "text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text",
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ) : (
          <Flex
            align="center"
            justify="center"
            className="px-2 py-2 rounded-md text-ui-text-secondary transition-default hover:bg-ui-bg-hover"
          >
            <Icon className="w-5 h-5" />
          </Flex>
        )}
      </Tooltip>
    );
  }

  return (
    <div>
      {/* Section header */}
      <Flex
        align="center"
        gap="sm"
        className={cn(
          "px-3 py-2 rounded-md transition-default group",
          isActive ? "bg-ui-bg-hover border-l-2 border-brand" : "hover:bg-ui-bg-hover",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-6 w-6 p-0.5"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-ui-text-tertiary" />
          )}
        </Button>
        {isLink ? (
          <Link
            {...props}
            to={props.to}
            className={cn(
              "flex-1 flex items-center gap-2 text-sm font-medium transition-default",
              isActive ? "text-ui-text" : "text-ui-text-secondary hover:text-ui-text",
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ) : (
          <Flex
            align="center"
            gap="sm"
            className="flex-1 text-sm font-medium text-ui-text-secondary transition-default"
          >
            <Icon className="w-5 h-5" />
            {label}
          </Flex>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={`Add new ${label.toLowerCase().slice(0, -1)}`}
        >
          <Plus className="w-4 h-4 text-ui-text-tertiary" />
        </Button>
      </Flex>

      {/* Section children */}
      {isExpanded && (
        <Flex direction="column" gap="none" className="ml-4 mt-1">
          {children}
        </Flex>
      )}
    </div>
  );
}

// Sub-item Component
type NavSubItemProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  label: string;
  isActive: boolean;
  icon?: React.ComponentType<{ className?: string }>;
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
    <Link
      to={to}
      params={params}
      {...props}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm truncate transition-default",
        isActive
          ? "bg-ui-bg-hover text-ui-text"
          : "text-ui-text-tertiary hover:bg-ui-bg-hover hover:text-ui-text-secondary",
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </Link>
  );
}
