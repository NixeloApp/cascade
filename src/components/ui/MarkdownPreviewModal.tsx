import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, FileText } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Flex } from "./Flex";
import { Icon } from "./Icon";
import { Typography } from "./Typography";

interface MarkdownPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  markdown: string;
  filename: string;
}

/**
 * Preview markdown content before importing
 * Shows both raw markdown and rendered preview
 */
export function MarkdownPreviewModal({
  open,
  onOpenChange,
  onConfirm,
  markdown,
  filename,
}: MarkdownPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "preview">("preview");

  // Count blocks for preview stats
  const lines = markdown.split("\n");
  const headings = lines.filter((line) => line.match(/^#{1,6}\s/)).length;
  const lists = lines.filter((line) => line.match(/^\s*[-*]\s/)).length;
  const codeBlocks = (markdown.match(/```/g) || []).length / 2;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Preview Markdown Import"
      description="Preview content before importing"
      className="sm:max-w-4xl"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary">
            Import & Replace Content
          </Button>
        </>
      }
    >
      {/* File Info */}
      <div className="mb-4 p-3 bg-ui-bg-secondary rounded-lg">
        <Flex align="center" justify="between" className="text-sm">
          <Flex align="center" gap="xs" className="font-medium text-ui-text">
            <Icon icon={FileText} size="sm" />
            {filename}
          </Flex>
          <span className="text-ui-text-tertiary">
            {lines.length} lines • {headings} headings • {lists} lists • {codeBlocks} code blocks
          </span>
        </Flex>
      </div>

      {/* Warning */}
      {/* Warning */}
      <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning/30 rounded-lg">
        <Flex align="start" gap="sm">
          <Icon icon={AlertTriangle} size="md" className="text-status-warning" />
          <div className="flex-1">
            <Typography variant="small" className="font-medium text-status-warning">
              This will replace all current document content
            </Typography>
            <Typography variant="muted" className="text-xs text-status-warning/90 mt-1">
              Make sure you have a backup or export the current version first.
            </Typography>
          </div>
        </Flex>
      </div>

      {/* Tab Selector */}
      <Flex className="border-b border-ui-border mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "preview"
              ? "border-brand-ring text-brand"
              : "border-transparent text-ui-text-tertiary hover:text-ui-text-secondary",
          )}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("raw")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "raw"
              ? "border-brand-ring text-brand"
              : "border-transparent text-ui-text-tertiary hover:text-ui-text-secondary",
          )}
        >
          Raw Markdown
        </button>
      </Flex>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto border border-ui-border rounded-lg">
        {activeTab === "preview" ? (
          <div className="p-4 prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <pre className="p-4 text-sm text-ui-text whitespace-pre-wrap font-mono">{markdown}</pre>
        )}
      </div>
    </Dialog>
  );
}
