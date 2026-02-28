/**
 * Plate Editor Plugin Configuration
 *
 * Configures all Plate plugins for the document editor:
 * - Basic nodes (headings, paragraphs, blockquotes)
 * - Basic marks (bold, italic, underline, strikethrough, code)
 * - Lists (bullet, numbered, todo)
 * - Code blocks with syntax highlighting
 * - Tables
 * - Media (images)
 * - Mentions (@user)
 * - Drag and drop
 */

// Basic nodes and marks
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  HighlightPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
// Code blocks
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@platejs/code-block/react";
// DnD (no /react export)
import { DndPlugin } from "@platejs/dnd";
// Lists
import { ListPlugin } from "@platejs/list/react";
// Media
import { ImagePlugin } from "@platejs/media/react";
// Mentions
import { MentionInputPlugin, MentionPlugin } from "@platejs/mention/react";
// Slash command (no /react export, uses Base prefix)
import { BaseSlashPlugin } from "@platejs/slash-command";
// Tables
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react";
// Core
import { BaseParagraphPlugin, createPlatePlugin } from "platejs";
import { MentionElement } from "@/components/Plate/MentionElement";
import { MentionInputElement } from "@/components/Plate/MentionInputElement";

/**
 * All plugins for the Plate editor
 * Order matters: plugins are applied in order
 */
export const platePlugins = [
  // Core
  BaseParagraphPlugin,

  // Basic formatting marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  HighlightPlugin,

  // Custom color marks (font color and background color with color picker)
  createPlatePlugin({
    key: "fontColor",
    node: {
      isLeaf: true,
    },
    inject: {
      leafProps: ({ element }) => {
        const fontColor = element?.fontColor as string | undefined;
        if (fontColor) {
          return { style: { color: fontColor } };
        }
        return {};
      },
    },
  }),
  createPlatePlugin({
    key: "backgroundColor",
    node: {
      isLeaf: true,
    },
    inject: {
      leafProps: ({ element }) => {
        const bgColor = element?.backgroundColor as string | undefined;
        if (bgColor) {
          return { style: { backgroundColor: bgColor } };
        }
        return {};
      },
    },
  }),

  // Block elements
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,

  // Lists
  ListPlugin,

  // Code blocks
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,

  // Tables
  TablePlugin,
  TableRowPlugin,
  TableCellPlugin,
  TableCellHeaderPlugin,

  // Media
  ImagePlugin,

  // Mentions (@user)
  MentionPlugin.configure({
    render: { node: MentionElement },
    options: {
      trigger: "@",
      triggerPreviousCharPattern: /^$|^[\s"']$/,
      insertSpaceAfterMention: true,
    },
  }),
  MentionInputPlugin.configure({
    render: { node: MentionInputElement },
  }),

  // Interaction
  DndPlugin,
  BaseSlashPlugin,
];

/**
 * Initial empty document value
 */
export const initialValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

/**
 * Slate node types used in our editor
 */
export const NODE_TYPES = {
  // Blocks
  paragraph: "p",
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  heading4: "h4",
  heading5: "h5",
  heading6: "h6",
  blockquote: "blockquote",
  codeBlock: "code_block",
  codeLine: "code_line",

  // Lists
  bulletedList: "ul",
  numberedList: "ol",
  todoList: "todo_li",
  listItem: "li",

  // Tables
  table: "table",
  tableRow: "tr",
  tableCell: "td",
  tableCellHeader: "th",

  // Media
  image: "img",

  // Inline elements
  mention: "mention",
  mentionInput: "mention_input",

  // Marks (inline formatting)
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  code: "code",
  highlight: "highlight",
  fontColor: "fontColor",
  backgroundColor: "backgroundColor",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
