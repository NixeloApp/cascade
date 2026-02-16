import type { KeySequence } from "../hooks/useKeyboardShortcuts";
import { ROUTES } from "./routes";

export interface ShortcutHandlers {
  orgSlug: string;
  navigate: (to: string) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowShortcutsHelp: (show: boolean) => void;
  setShowAIAssistant: (toggle: boolean) => void;
}

export function createKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { orgSlug } = handlers;
  const shortcuts = [
    // Command palette (Cmd/Ctrl+K)
    {
      key: "k",
      meta: true,
      handler: () => handlers.setShowCommandPalette(true),
      description: "Open command palette",
      global: true,
    },
    {
      key: "k",
      ctrl: true,
      handler: () => handlers.setShowCommandPalette(true),
      description: "Open command palette",
      global: true,
    },
    // Help (?)
    {
      key: "?",
      shift: true,
      handler: () => handlers.setShowShortcutsHelp(true),
      description: "Show keyboard shortcuts",
      global: true,
    },
    // AI Assistant (Cmd/Ctrl+Shift+A)
    {
      key: "a",
      meta: true,
      shift: true,
      handler: () => handlers.setShowAIAssistant(true),
      description: "Toggle AI assistant",
      global: true,
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      handler: () => handlers.setShowAIAssistant(true),
      description: "Toggle AI assistant",
      global: true,
    },
    // Quick navigation (Cmd/Ctrl+number)
    {
      key: "1",
      meta: true,
      handler: () => handlers.navigate(ROUTES.dashboard.build(orgSlug)),
      description: "Go to dashboard",
    },
    {
      key: "2",
      meta: true,
      handler: () => handlers.navigate(ROUTES.documents.list.build(orgSlug)),
      description: "Go to documents",
    },
    {
      key: "3",
      meta: true,
      handler: () => handlers.navigate(ROUTES.workspaces.list.build(orgSlug)),
      description: "Go to workspaces",
    },
    // Focus search (/)
    {
      key: "/",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:focus-search"));
      },
      description: "Focus search",
    },
    // Single-key create actions (only when not typing)
    {
      key: "c",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-issue"));
      },
      description: "Create new issue",
    },
    {
      key: "d",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-document"));
      },
      description: "Create new document",
    },
    {
      key: "p",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:create-project"));
      },
      description: "Create new project",
    },
    // Issue actions (when issue is focused/selected)
    {
      key: "e",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:edit-issue"));
      },
      description: "Edit issue",
    },
    {
      key: "a",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:assign-to-me"));
      },
      description: "Assign to me",
    },
    {
      key: "l",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:add-label"));
      },
      description: "Add label",
    },
    {
      key: "t",
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:start-timer"));
      },
      description: "Start time tracking",
    },
    // Shift+key actions
    {
      key: "p",
      shift: true,
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:set-priority"));
      },
      description: "Set priority",
    },
    {
      key: "s",
      shift: true,
      handler: () => {
        window.dispatchEvent(new CustomEvent("nixelo:change-status"));
      },
      description: "Change status",
    },
  ];

  return shortcuts;
}

export function createKeySequences(handlers: ShortcutHandlers): KeySequence[] {
  const { orgSlug } = handlers;
  return [
    // Navigation sequences (g+X)
    {
      keys: ["g", "h"],
      handler: () => handlers.navigate(ROUTES.dashboard.build(orgSlug)),
      description: "Go to home",
    },
    {
      keys: ["g", "w"],
      handler: () => handlers.navigate(ROUTES.workspaces.list.build(orgSlug)),
      description: "Go to workspaces",
    },
    {
      keys: ["g", "d"],
      handler: () => handlers.navigate(ROUTES.documents.list.build(orgSlug)),
      description: "Go to documents",
    },
    {
      keys: ["g", "p"],
      handler: () => handlers.navigate(ROUTES.projects.list.build(orgSlug)),
      description: "Go to projects",
    },
    {
      keys: ["g", "i"],
      handler: () => handlers.navigate(ROUTES.issues.list.build(orgSlug)),
      description: "Go to issues",
    },
    {
      keys: ["g", "a"],
      handler: () => handlers.navigate(ROUTES.analytics.build(orgSlug)),
      description: "Go to analytics",
    },
    {
      keys: ["g", "s"],
      handler: () => handlers.navigate(ROUTES.settings.profile.build(orgSlug)),
      description: "Go to settings",
    },
  ];
}
