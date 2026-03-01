/**
 * Rich Text Editor for Issue Descriptions
 *
 * Lightweight version of PlateEditor focused on issue descriptions.
 * Supports: formatting, lists, code blocks, blockquotes, @mentions
 * Excludes: tables, images, slash commands (simpler UX for issues)
 */

import type { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
  getInitialValue,
  getIssueDescriptionPlugins,
  isEmptyValue,
  plainTextToValue,
  serializeValue,
} from "@/lib/plate/editor";
import { cn } from "@/lib/utils";
import { FloatingToolbar } from "./Plate/FloatingToolbar";

interface IssueDescriptionEditorProps {
  /** Serialized JSON string value, or plain text (for backwards compat) */
  value?: string | null;
  /** Called with serialized JSON string when content changes */
  onChange?: (value: string) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Validate that parsed JSON has the expected Plate node structure.
 * Each node must have a children array (the basic Slate/Plate node shape).
 */
function isValidPlateValue(candidate: unknown): candidate is Value {
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return false;
  }
  return candidate.every(
    (node) =>
      typeof node === "object" &&
      node !== null &&
      "children" in node &&
      Array.isArray((node as { children: unknown }).children),
  );
}

/**
 * Parse initial value - handles both JSON and plain text
 */
function parseInitialValue(value: string | null | undefined): Value {
  if (!value) {
    return getInitialValue();
  }

  // Try parsing as JSON first
  try {
    const parsed: unknown = JSON.parse(value);
    if (isValidPlateValue(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as plain text
  }

  // Convert plain text to editor value
  return plainTextToValue(value);
}

/**
 * Issue Description Editor Component
 */
export function IssueDescriptionEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "Add a description...",
  className,
  minHeight = 120,
  autoFocus = false,
  testId,
}: IssueDescriptionEditorProps) {
  // Parse initial value (handles both JSON and plain text)
  const initialValue = useMemo(() => parseInitialValue(value), [value]);

  // Create editor with lightweight plugins
  const editor = usePlateEditor({
    plugins: getIssueDescriptionPlugins(),
    value: initialValue,
  });

  // Handle content changes
  const handleChange = useCallback(
    ({ value: newValue }: { value: Value }) => {
      if (onChange) {
        // Serialize to JSON for storage
        // If empty, send empty string to allow clearing
        if (isEmptyValue(newValue)) {
          onChange("");
        } else {
          onChange(serializeValue(newValue));
        }
      }
    },
    [onChange],
  );

  return (
    <Card
      padding="none"
      className={cn("overflow-hidden", readOnly && "bg-ui-bg-secondary", className)}
    >
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        {!readOnly && <FloatingToolbar />}
        <PlateContent
          className={cn(
            "p-3 prose prose-sm max-w-none focus-visible:outline-none",
            "text-ui-text leading-relaxed",
            "[&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_pre]:my-2",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-ui-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ui-text-secondary",
            "[&_code]:bg-ui-bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
            "[&_pre]:bg-ui-bg-secondary [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto",
          )}
          style={{ minHeight }}
          placeholder={placeholder}
          readOnly={readOnly}
          autoFocus={autoFocus}
          data-testid={testId}
        />
      </Plate>
    </Card>
  );
}

/**
 * Read-only renderer for issue descriptions
 * For displaying descriptions without editing capabilities
 */
export function IssueDescriptionReadOnly({
  value,
  className,
  testId,
}: {
  value?: string | null;
  className?: string;
  testId?: string;
}) {
  // Parse value (handles both JSON and plain text)
  const parsedValue = useMemo(() => parseInitialValue(value), [value]);

  // Create read-only editor (must be called unconditionally for React hooks rules)
  const editor = usePlateEditor({
    plugins: getIssueDescriptionPlugins(),
    value: parsedValue,
  });

  // Check if empty (after hooks)
  const isEmpty = !value || isEmptyValue(parsedValue);

  if (isEmpty) {
    return null;
  }

  return (
    <Plate editor={editor} readOnly>
      <PlateContent
        className={cn(
          "prose prose-sm max-w-none",
          "text-ui-text leading-relaxed",
          "[&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_pre]:my-2",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-ui-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ui-text-secondary",
          "[&_code]:bg-ui-bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
          "[&_pre]:bg-ui-bg-secondary [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto",
          className,
        )}
        readOnly
        data-testid={testId}
      />
    </Plate>
  );
}
