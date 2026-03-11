/**
 * Plate Editor Instance Factory
 *
 * Creates and configures Plate editor instances with all plugins.
 * Used by the PlateEditor component.
 */

import type { Value } from "platejs";
import { initialValue, issueDescriptionPlugins, platePlugins } from "./plugins";

/**
 * Options for creating a Plate editor
 */
export interface CreatePlateEditorOptions {
  /** Initial document value (Slate nodes) */
  value?: Value;
  /** Unique ID for the editor instance */
  id?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

/**
 * Get the plugins array for usePlateEditor hook
 */
export function getEditorPlugins() {
  return platePlugins;
}

/**
 * Get lightweight plugins for issue descriptions
 * Excludes tables, images, DnD - focused on text formatting
 */
export function getIssueDescriptionPlugins() {
  return issueDescriptionPlugins;
}

/**
 * Get initial value for a new document
 */
export function getInitialValue(): Value {
  return initialValue as Value;
}

/**
 * Serialize editor value to JSON string for storage
 */
export function serializeValue(value: Value): string {
  return JSON.stringify(value);
}

/**
 * Deserialize JSON string to editor value
 * Returns initial value if parsing fails
 */
export function deserializeValue(json: string | null | undefined): Value {
  if (!json) {
    return getInitialValue();
  }

  try {
    const parsed = JSON.parse(json) as Value;
    // Basic validation - must be an array with at least one element
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getInitialValue();
  } catch {
    return getInitialValue();
  }
}

interface ProseMirrorMark {
  type?: string;
}

interface ProseMirrorNodeLike {
  attrs?: {
    level?: number;
  };
  content?: ProseMirrorNodeLike[];
  marks?: ProseMirrorMark[];
  text?: string;
  type?: string;
}

interface ProseMirrorSnapshotLike {
  content?: ProseMirrorNodeLike[];
  type?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function applyTextMarks(leaf: Record<string, unknown>, marks: ProseMirrorMark[] | undefined) {
  for (const mark of marks ?? []) {
    if (mark.type === "bold") leaf.bold = true;
    if (mark.type === "italic") leaf.italic = true;
    if (mark.type === "underline") leaf.underline = true;
    if (mark.type === "strike") leaf.strikethrough = true;
    if (mark.type === "code") leaf.code = true;
  }
}

function toTextLeaf(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  if (node.type === "text") {
    const leaf: Record<string, unknown> = { text: node.text ?? "" };
    applyTextMarks(leaf, node.marks);
    return [leaf];
  }

  if (node.type === "hardBreak") {
    return [{ text: "\n" }];
  }

  return toTextLeaves(node.content);
}

function toTextLeaves(nodes: ProseMirrorNodeLike[] | undefined): Array<Record<string, unknown>> {
  if (!nodes || nodes.length === 0) {
    return [{ text: "" }];
  }

  const leaves = nodes.flatMap(toTextLeaf);

  return leaves.length > 0 ? leaves : [{ text: "" }];
}

function toBlockFromNode(node: ProseMirrorNodeLike) {
  if (node.type === "heading") {
    const level = node.attrs?.level;
    const headingType =
      level && level >= 1 && level <= 6 ? (`h${level}` as const) : ("h2" as const);

    return [
      {
        type: headingType,
        children: toTextLeaves(node.content),
      },
    ];
  }

  if (node.type === "blockquote") {
    return [
      {
        type: "blockquote",
        children: toTextLeaves(node.content),
      },
    ];
  }

  if (node.type === "codeBlock") {
    return [
      {
        type: "code_block",
        children: [
          {
            type: "code_line",
            children: toTextLeaves(node.content),
          },
        ],
      },
    ];
  }

  if (node.type === "paragraph") {
    return [
      {
        type: "p",
        children: toTextLeaves(node.content),
      },
    ];
  }

  return node.content ? toPlateBlocks(node.content) : [];
}

function toPlateBlocks(nodes: ProseMirrorNodeLike[] | undefined): Value {
  if (!nodes || nodes.length === 0) {
    return getInitialValue();
  }

  const blocks = nodes.flatMap(toBlockFromNode);

  return blocks.length > 0 ? (blocks as Value) : getInitialValue();
}

/**
 * Convert a stored ProseMirror snapshot into Plate/Slate value for initial hydration.
 * Supports the common block types used in seeded documents and version history.
 */
export function proseMirrorSnapshotToValue(snapshot: unknown): Value {
  if (!isRecord(snapshot)) {
    return getInitialValue();
  }

  const parsedSnapshot = snapshot as ProseMirrorSnapshotLike;
  if (parsedSnapshot.type !== "doc") {
    return getInitialValue();
  }

  return toPlateBlocks(parsedSnapshot.content);
}

/** Check if a node is an empty text node */
function isEmptyTextNode(node: unknown): boolean {
  return (
    node !== null &&
    typeof node === "object" &&
    "text" in node &&
    (node as { text: string }).text === ""
  );
}

/** Check if children array represents empty content */
function hasEmptyChildren(children: unknown[]): boolean {
  if (children.length === 0) return true;
  if (children.length === 1 && isEmptyTextNode(children[0])) return true;
  return false;
}

/** Check if a node is an empty paragraph */
function isEmptyParagraph(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  if (!("type" in node) || node.type !== "p") return false;
  if (!("children" in node) || !Array.isArray(node.children)) return false;
  return hasEmptyChildren(node.children);
}

/**
 * Check if a value is empty (only contains empty paragraph)
 */
export function isEmptyValue(value: Value): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;
  if (value.length > 1) return false;
  return isEmptyParagraph(value[0]);
}

/**
 * Convert plain text to editor Value format
 * Splits by newlines and creates paragraphs
 */
export function plainTextToValue(text: string | null | undefined): Value {
  if (!text || text.trim() === "") {
    return getInitialValue();
  }

  // Split by newlines and create paragraphs
  const lines = text.split("\n");
  return lines.map((line) => ({
    type: "p",
    children: [{ text: line }],
  })) as Value;
}

/**
 * Convert editor Value to plain text
 * Extracts text content from all nodes
 */
export function valueToPlainText(value: Value): string {
  if (!Array.isArray(value)) return "";

  const extractText = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";

    // Text node
    if ("text" in node && typeof (node as { text: string }).text === "string") {
      return (node as { text: string }).text;
    }

    // Element with children
    if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
      return (node as { children: unknown[] }).children.map(extractText).join("");
    }

    return "";
  };

  return value.map(extractText).join("\n");
}
