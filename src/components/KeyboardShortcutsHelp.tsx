import { Flex } from "@/components/ui/Flex";
import { Dialog } from "./ui/Dialog";
import { KeyboardShortcut } from "./ui/KeyboardShortcut";
import { Typography } from "./ui/Typography";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["⌘+K", "Ctrl+K"], description: "Open command palette" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["/"], description: "Focus search" },
        { keys: ["Esc"], description: "Close modal or cancel" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["G", "H"], description: "Go to home" },
        { keys: ["G", "B"], description: "Go to board" },
        { keys: ["G", "R"], description: "Go to roadmap" },
        { keys: ["G", "A"], description: "Go to analytics" },
        { keys: ["G", "S"], description: "Go to settings" },
      ],
    },
    {
      category: "Actions",
      items: [
        { keys: ["C"], description: "Create new issue" },
        { keys: ["D"], description: "Create new document" },
        { keys: ["P"], description: "Create new project" },
      ],
    },
    {
      category: "Issue Actions",
      items: [
        { keys: ["E"], description: "Edit issue" },
        { keys: ["A"], description: "Assign to me" },
        { keys: ["L"], description: "Add label" },
        { keys: ["Shift", "P"], description: "Set priority" },
        { keys: ["Shift", "S"], description: "Change status" },
        { keys: ["T"], description: "Start time tracking" },
      ],
    },
    {
      category: "Editor",
      items: [
        { keys: ["⌘+B", "Ctrl+B"], description: "Bold" },
        { keys: ["⌘+I", "Ctrl+I"], description: "Italic" },
        { keys: ["⌘+U", "Ctrl+U"], description: "Underline" },
        { keys: ["⌘+Z", "Ctrl+Z"], description: "Undo" },
        { keys: ["⌘+Shift+Z", "Ctrl+Shift+Z"], description: "Redo" },
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard Shortcuts"
      className="sm:max-w-2xl"
    >
      <div className="space-y-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-3">
              {section.category}
            </Typography>
            <div className="space-y-2">
              {section.items.map((shortcut) => (
                <Flex align="center" justify="between" className="py-2" key={shortcut.description}>
                  <Typography variant="p" className="text-sm">
                    {shortcut.description}
                  </Typography>
                  <Flex gap="sm">
                    {shortcut.keys.map((key) => (
                      <KeyboardShortcut key={key} shortcut={key} />
                    ))}
                  </Flex>
                </Flex>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-ui-border">
          <Typography variant="muted" className="text-sm">
            <strong>Tip:</strong> Press <KeyboardShortcut shortcut="⌘+K" /> to quickly access all
            commands and features.
          </Typography>
        </div>
      </div>
    </Dialog>
  );
}
