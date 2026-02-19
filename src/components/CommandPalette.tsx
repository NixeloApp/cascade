import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { FileText, FolderKanban, Home, LayoutGrid, Plus } from "@/lib/icons";
import { ISSUE_TYPE_ICONS, type IssueType } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/Command";
import { ShortcutHint } from "./ui/KeyboardShortcut";
import { Typography } from "./ui/Typography";

export interface CommandAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  keywords?: string[];
  action: () => void;
  group?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandAction[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Group commands
  const groupedCommands = commands.reduce(
    (acc: Record<string, CommandAction[]>, cmd: CommandAction) => {
      const group = cmd.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandAction[]>,
  );

  const handleSelect = (cmd: CommandAction) => {
    cmd.action();
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Command
        data-testid={TEST_IDS.EDITOR.COMMAND_PALETTE}
        className="bg-ui-bg"
        filter={(value, search) => {
          const cmd = commands.find((c) => c.id === value);
          if (!cmd) return 0;

          const searchLower = search.toLowerCase();
          const labelMatch = cmd.label.toLowerCase().includes(searchLower);
          const descMatch = cmd.description?.toLowerCase().includes(searchLower);
          const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower));

          return labelMatch || descMatch || keywordMatch ? 1 : 0;
        }}
      >
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          className="text-ui-text"
        />
        <CommandList className="max-h-panel-sm sm:max-h-panel-md">
          <CommandEmpty className="text-ui-text-secondary">No commands found</CommandEmpty>
          {Object.entries(groupedCommands).map(([group, cmds]) => (
            <CommandGroup
              key={group}
              heading={group}
              className="text-ui-text-secondary [&_[cmdk-group-heading]]:text-ui-text-tertiary"
            >
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={() => handleSelect(cmd)}
                  className="cursor-pointer data-[selected=true]:bg-brand-subtle"
                >
                  {cmd.icon && <Icon icon={cmd.icon} size="md" className="mr-2" />}
                  <FlexItem flex="1">
                    <Typography variant="label" as="p">
                      {cmd.label}
                    </Typography>
                    {cmd.description && (
                      <Typography variant="caption">{cmd.description}</Typography>
                    )}
                  </FlexItem>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <Flex
          wrap
          gap="md"
          className="px-4 py-2 border-t border-ui-border bg-ui-bg-secondary text-ui-text-tertiary text-xs"
        >
          <ShortcutHint keys="up+down">Navigate</ShortcutHint>
          <ShortcutHint keys="Enter">Select</ShortcutHint>
          <ShortcutHint keys="Esc">Close</ShortcutHint>
        </Flex>
      </Command>
    </CommandDialog>
  );
}

// Hook to build commands dynamically
export function useCommands({
  onCreateIssue,
  onCreateDocument,
  onCreateProject,
}: {
  onCreateIssue?: () => void;
  onCreateDocument?: () => void;
  onCreateProject?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();
  const projects = useQuery(api.dashboard.getMyProjects);
  const myIssues = useQuery(api.dashboard.getMyIssues, {
    paginationOpts: { numItems: 10, cursor: null },
  });

  const commands: CommandAction[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: Home,
      description: "View your personal dashboard",
      keywords: ["home", "my work"],
      action: () => navigate({ to: ROUTES.dashboard.path, params: { orgSlug } }),
      group: "Navigation",
    },
    {
      id: "nav-documents",
      label: "Go to Documents",
      icon: FileText,
      description: "View all documents",
      keywords: ["docs", "files"],
      action: () => navigate({ to: ROUTES.documents.list.path, params: { orgSlug } }),
      group: "Navigation",
    },
    {
      id: "nav-projects",
      label: "Go to Workspaces",
      icon: FolderKanban,
      description: "View all workspaces",
      keywords: ["boards", "kanban", "projects", "workspaces"],
      action: () => navigate({ to: ROUTES.workspaces.list.path, params: { orgSlug } }),
      group: "Navigation",
    },

    // Projects navigation
    ...(projects?.map((project: Doc<"projects">) => ({
      id: `project-${project._id}`,
      label: project.name,
      icon: LayoutGrid,
      description: `Go to ${project.name} board`,
      keywords: [project.key, "board", "project"],
      action: () =>
        navigate({
          to: ROUTES.projects.board.path,
          params: { orgSlug, key: project.key },
        }),
      group: "Projects",
    })) || []),

    // Create actions
    ...(onCreateIssue
      ? [
          {
            id: "create-issue",
            label: "Create Issue",
            icon: Plus,
            description: "Create a new issue",
            keywords: ["new", "task", "bug"],
            action: onCreateIssue,
            group: "Create",
          },
        ]
      : []),
    ...(onCreateDocument
      ? [
          {
            id: "create-document",
            label: "Create Document",
            icon: FileText,
            description: "Create a new document",
            keywords: ["new", "doc", "page"],
            action: onCreateDocument,
            group: "Create",
          },
        ]
      : []),
    ...(onCreateProject
      ? [
          {
            id: "create-project",
            label: "Create Project",
            icon: FolderKanban,
            description: "Create a new project",
            keywords: ["new", "board", "project"],
            action: onCreateProject,
            group: "Create",
          },
        ]
      : []),

    // Quick access to recent issues
    ...(myIssues?.page
      ?.slice(0, 5)
      ?.map((issue: Doc<"issues"> & { projectName?: string; projectKey: string }) => ({
        id: `issue-${issue._id}`,
        label: issue.title,
        icon: ISSUE_TYPE_ICONS[issue.type as IssueType],
        description: `${issue.key} • ${issue.projectName}`,
        keywords: [issue.projectKey, issue.projectName || ""],
        action: () => {
          navigate({
            to: ROUTES.projects.board.path,
            params: { orgSlug, key: issue.projectKey },
          });
        },
        group: "Recent Issues",
      })) ?? []),
  ];

  return commands;
}
