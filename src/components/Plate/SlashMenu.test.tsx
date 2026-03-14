import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { SlashMenu } from "./SlashMenu";

const { mockUseEditorRef, mockUseEditorSelection } = vi.hoisted(() => ({
  mockUseEditorRef: vi.fn(),
  mockUseEditorSelection: vi.fn(),
}));

vi.mock("platejs/react", () => ({
  useEditorRef: mockUseEditorRef,
  useEditorSelection: mockUseEditorSelection,
}));

vi.mock("@/components/ui/Command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children, heading }: { children: ReactNode; heading?: string }) => (
    <section>
      {heading ? <div>{heading}</div> : null}
      {children}
    </section>
  ),
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.("")}>
      {children}
    </button>
  ),
}));

function setDomSelection({
  text,
  cursorOffset,
  rect = new DOMRect(20, 40, 90, 16),
}: {
  text: string;
  cursorOffset: number;
  rect?: DOMRect;
}) {
  const textNode = document.createTextNode(text);
  const range = document.createRange();
  range.setStart(textNode, cursorOffset);
  range.setEnd(textNode, cursorOffset);
  Object.defineProperty(range, "getBoundingClientRect", {
    configurable: true,
    value: () => rect,
  });

  const selection: Selection = {
    anchorNode: textNode,
    anchorOffset: cursorOffset,
    direction: "forward",
    focusNode: textNode,
    focusOffset: cursorOffset,
    isCollapsed: true,
    rangeCount: 1,
    type: "Caret",
    addRange: vi.fn(),
    collapse: vi.fn(),
    collapseToEnd: vi.fn(),
    collapseToStart: vi.fn(),
    containsNode: vi.fn(() => false),
    deleteFromDocument: vi.fn(),
    empty: vi.fn(),
    extend: vi.fn(),
    getComposedRanges: vi.fn(() => []),
    getRangeAt: vi.fn(() => range),
    modify: vi.fn(),
    removeAllRanges: vi.fn(),
    removeRange: vi.fn(),
    selectAllChildren: vi.fn(),
    setBaseAndExtent: vi.fn(),
    setPosition: vi.fn(),
    toString: () => "",
  };

  Object.defineProperty(window, "getSelection", {
    configurable: true,
    value: () => selection,
  });
}

describe("SlashMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorRef.mockReturnValue({
      tf: {
        deleteBackward: vi.fn(),
        insertNodes: vi.fn(),
        setNodes: vi.fn(),
      },
    });
    mockUseEditorSelection.mockReturnValue(null);
  });

  it("stays hidden without a valid collapsed slash trigger", () => {
    const { rerender } = render(<SlashMenu />);

    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();

    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 4 },
    });
    rerender(<SlashMenu />);

    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();

    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 7 },
      focus: { path: [0, 0], offset: 7 },
    });
    setDomSelection({ text: "alpha/beta", cursorOffset: 10 });
    rerender(<SlashMenu />);

    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();
  });

  it("renders filtered slash items for a valid trigger and closes on escape", () => {
    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
    setDomSelection({ text: "/co", cursorOffset: 3 });

    render(<SlashMenu />);

    expect(screen.getByText("Basic blocks")).toBeInTheDocument();
    expect(screen.getByText("Code Block")).toBeInTheDocument();
    expect(screen.getByText("Code with syntax highlighting")).toBeInTheDocument();
    expect(screen.queryByText("Quote")).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();
  });

  it("deletes the slash text and applies the selected block action", async () => {
    const user = userEvent.setup();
    const editor = {
      tf: {
        deleteBackward: vi.fn(),
        insertNodes: vi.fn(),
        setNodes: vi.fn(),
      },
    };
    mockUseEditorRef.mockReturnValue(editor);
    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
    setDomSelection({ text: "/co", cursorOffset: 3 });

    render(<SlashMenu />);

    await user.click(screen.getByText("Code Block"));

    expect(editor.tf.deleteBackward).toHaveBeenCalledTimes(3);
    expect(editor.tf.setNodes).toHaveBeenCalledWith({ type: "code_block" });
    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();
  });
});
