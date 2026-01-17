import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";

export interface CommandAction {
  id: string;
  label: string;
  icon?: string;
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
        data-testid="command-palette"
        className="bg-ui-bg-primary"
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
          className="text-ui-text-primary"
        />
        <CommandList className="max-h-[50vh] sm:max-h-[60vh]">
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
                  className="cursor-pointer data-[selected=true]:bg-brand-50 dark:data-[selected=true]:bg-brand-900/30"
                >
                  {cmd.icon && <span className="text-xl mr-2">{cmd.icon}</span>}
                  <div className="flex-1">
                    <div className="font-medium text-ui-text-primary">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-xs text-ui-text-secondary">{cmd.description}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <Flex
          wrap
          gap="md"
          className="px-4 py-2 border-t border-ui-border-primary bg-ui-bg-secondary text-xs text-ui-text-secondary sm:gap-4"
        >
          <span>
            <CommandShortcut className="bg-ui-bg-primary border border-ui-border-primary px-2 py-1 rounded text-ui-text-primary">
              ↑↓
            </CommandShortcut>{" "}
            Navigate
          </span>
          <span>
            <CommandShortcut className="bg-ui-bg-primary border border-ui-border-primary px-2 py-1 rounded text-ui-text-primary">
              Enter
            </CommandShortcut>{" "}
            Select
          </span>
          <span>
            <CommandShortcut className="bg-ui-bg-primary border border-ui-border-primary px-2 py-1 rounded text-ui-text-primary">
              Esc
            </CommandShortcut>{" "}
            Close
          </span>
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
  const myIssues = useQuery(api.dashboard.getMyIssues);

  const commands: CommandAction[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: "🏠",
      description: "View your personal dashboard",
      keywords: ["home", "my work"],
      action: () => navigate({ to: ROUTES.dashboard.path, params: { orgSlug } }),
      group: "Navigation",
    },
    {
      id: "nav-documents",
      label: "Go to Documents",
      icon: "📄",
      description: "View all documents",
      keywords: ["docs", "files"],
      action: () => navigate({ to: ROUTES.documents.list.path, params: { orgSlug } }),
      group: "Navigation",
    },
    {
      id: "nav-projects",
      label: "Go to Workspaces",
      icon: "📋",
      description: "View all workspaces",
      keywords: ["boards", "kanban", "projects", "workspaces"],
      action: () => navigate({ to: ROUTES.workspaces.list.path, params: { orgSlug } }),
      group: "Navigation",
    },

    // Projects navigation
    ...(projects?.map((project: Doc<"projects">) => ({
      id: `project-${project._id}`,
      label: project.name,
      icon: "⬜",
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
            icon: "➕",
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
            icon: "📝",
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
            icon: "🗂️",
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
        icon: issue.type === "bug" ? "🐛" : issue.type === "story" ? "📖" : "📋",
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
