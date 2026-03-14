import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { FloatingToolbar } from "./FloatingToolbar";

const {
  mockUseEditorRef,
  mockUseEditorSelection,
  mockUseMarkToolbarButton,
  mockUseMarkToolbarButtonState,
} = vi.hoisted(() => ({
  mockUseEditorRef: vi.fn(),
  mockUseEditorSelection: vi.fn(),
  mockUseMarkToolbarButton: vi.fn(),
  mockUseMarkToolbarButtonState: vi.fn(),
}));

vi.mock("platejs/react", () => ({
  useEditorRef: mockUseEditorRef,
  useEditorSelection: mockUseEditorSelection,
  useMarkToolbarButton: mockUseMarkToolbarButton,
  useMarkToolbarButtonState: mockUseMarkToolbarButtonState,
}));

vi.mock("./ColorPickerButton", () => ({
  ColorPickerButton: ({ type }: { type: "fontColor" | "backgroundColor" }) => (
    <button type="button">
      {type === "fontColor" ? "Font color picker" : "Background color picker"}
    </button>
  ),
}));

function setDomSelection({
  text = "Selected text",
  rect = new DOMRect(24, 40, 120, 18),
  rangeCount = 1,
}: {
  text?: string;
  rect?: DOMRect;
  rangeCount?: number;
} = {}) {
  const range = document.createRange();
  Object.defineProperty(range, "getBoundingClientRect", {
    configurable: true,
    value: () => rect,
  });
  Object.defineProperty(range, "toString", {
    configurable: true,
    value: () => text,
  });

  const getRangeAt = vi.fn(() => range);

  const selection: Selection = {
    anchorNode: null,
    anchorOffset: 0,
    direction: "forward",
    focusNode: null,
    focusOffset: text.length,
    isCollapsed: rangeCount === 0 || text.length === 0,
    rangeCount,
    type: rangeCount === 0 ? "None" : "Range",
    addRange: vi.fn(),
    collapse: vi.fn(),
    collapseToEnd: vi.fn(),
    collapseToStart: vi.fn(),
    containsNode: vi.fn(() => false),
    deleteFromDocument: vi.fn(),
    empty: vi.fn(),
    extend: vi.fn(),
    getComposedRanges: vi.fn(() => []),
    getRangeAt,
    modify: vi.fn(),
    removeAllRanges: vi.fn(),
    removeRange: vi.fn(),
    selectAllChildren: vi.fn(),
    setBaseAndExtent: vi.fn(),
    setPosition: vi.fn(),
    toString: () => text,
  };

  vi.spyOn(window, "getSelection").mockImplementation(() => selection);

  return { getRangeAt };
}

describe("FloatingToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorRef.mockReturnValue({});
    mockUseEditorSelection.mockReturnValue(null);
    mockUseMarkToolbarButtonState.mockImplementation(({ nodeType }: { nodeType: string }) => ({
      nodeType,
      pressed: nodeType === "bold",
    }));
    mockUseMarkToolbarButton.mockImplementation((state: { nodeType: string }) => ({
      props: {
        onMouseDown: vi.fn(),
        "data-node-type": state.nodeType,
      },
    }));
    setDomSelection();
  });

  it("does not render when the editor selection is missing or collapsed", () => {
    const { rerender } = render(<FloatingToolbar />);

    expect(screen.queryByRole("button", { name: "Bold (Ctrl+B)" })).not.toBeInTheDocument();

    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });

    rerender(<FloatingToolbar />);

    expect(screen.queryByRole("button", { name: "Bold (Ctrl+B)" })).not.toBeInTheDocument();
  });

  it("does not open when the DOM selection has no usable text rect", () => {
    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 4 },
    });
    setDomSelection({ text: "   " });

    const { rerender } = render(<FloatingToolbar />);
    expect(screen.queryByRole("button", { name: "Bold (Ctrl+B)" })).not.toBeInTheDocument();

    setDomSelection({ text: "Selected text", rect: new DOMRect(24, 40, 0, 0) });
    rerender(<FloatingToolbar />);

    expect(screen.queryByRole("button", { name: "Bold (Ctrl+B)" })).not.toBeInTheDocument();
  });

  it("renders the toolbar for a valid selection and wires mark buttons plus color pickers", () => {
    const onBoldMouseDown = vi.fn();
    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 4 },
    });
    mockUseMarkToolbarButton.mockImplementation((state: { nodeType: string }) => ({
      props: {
        onMouseDown: state.nodeType === "bold" ? onBoldMouseDown : vi.fn(),
      },
    }));
    setDomSelection({ rect: new DOMRect(20, 50, 100, 16) });

    const { container } = render(<FloatingToolbar />);

    const boldButton = screen.getByRole("button", { name: "Bold (Ctrl+B)" });
    expect(boldButton).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic (Ctrl+I)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inline Code (Ctrl+`)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Font color picker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Background color picker" })).toBeInTheDocument();

    fireEvent.mouseDown(boldButton);
    expect(onBoldMouseDown).toHaveBeenCalledTimes(1);

    const anchor = container.querySelector('[style*="position: fixed"]');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveStyle({
      left: "70px",
      top: "42px",
      width: "1px",
      height: "1px",
    });
  });

  it("prompts for a link when the insert-link action is clicked", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("https://example.com");
    mockUseEditorSelection.mockReturnValue({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 4 },
    });
    setDomSelection();

    render(<FloatingToolbar />);

    await user.click(screen.getByRole("button", { name: "Insert Link" }));

    expect(promptSpy).toHaveBeenCalledWith("Enter URL:");

    promptSpy.mockRestore();
  });
});
