import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { DragHandle, DragHandleWrapper } from "./DragHandle";

const { mockUseEditorRef, mockUseElement, mockUseNodePath } = vi.hoisted(() => ({
  mockUseEditorRef: vi.fn(),
  mockUseElement: vi.fn(),
  mockUseNodePath: vi.fn(),
}));

vi.mock("platejs/react", () => ({
  useEditorRef: mockUseEditorRef,
  useElement: mockUseElement,
  useNodePath: mockUseNodePath,
}));

function createEditorMock() {
  return {
    tf: {
      insertNodes: vi.fn(),
      removeNodes: vi.fn(),
      select: vi.fn(),
    },
  };
}

describe("DragHandle", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockUseElement.mockReturnValue({ type: "p" });
    mockUseNodePath.mockReturnValue([2]);
  });

  it("adds a paragraph block above and focuses the inserted node", async () => {
    const user = userEvent.setup();
    const editor = createEditorMock();
    mockUseEditorRef.mockReturnValue(editor);

    render(<DragHandle visible />);

    await user.click(screen.getByRole("button", { name: "Block actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Add block above" }));

    expect(editor.tf.insertNodes).toHaveBeenCalledWith(
      {
        type: "p",
        children: [{ text: "" }],
      },
      { at: [2] },
    );
    expect(editor.tf.select).toHaveBeenCalledWith({ path: [2, 0], offset: 0 });
  });

  it("adds a paragraph block below and deletes the current block", async () => {
    const user = userEvent.setup();
    const editor = createEditorMock();
    mockUseEditorRef.mockReturnValue(editor);

    render(<DragHandle visible />);

    await user.click(screen.getByRole("button", { name: "Block actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Add block below" }));

    expect(editor.tf.insertNodes).toHaveBeenCalledWith(
      {
        type: "p",
        children: [{ text: "" }],
      },
      { at: [3] },
    );
    expect(editor.tf.select).toHaveBeenCalledWith({ path: [3, 0], offset: 0 });

    await user.click(screen.getByRole("button", { name: "Block actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete block" }));

    expect(editor.tf.removeNodes).toHaveBeenCalledWith({ at: [2] });
  });

  it("sets drag metadata and clears the preview element on drag end", async () => {
    vi.useFakeTimers();
    const editor = createEditorMock();
    mockUseEditorRef.mockReturnValue(editor);

    render(<DragHandle visible />);

    const trigger = screen.getByRole("button", { name: "Block actions" });
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };

    fireEvent.dragStart(trigger, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/x-plate-drag",
      JSON.stringify({ path: [2] }),
    );
    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setDragImage).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveTextContent("Moving block...");
    expect(trigger).toHaveStyle({ opacity: "1" });

    vi.runAllTimers();
    expect(document.body).not.toHaveTextContent("Moving block...");

    fireEvent.dragEnd(trigger);

    expect(trigger).toHaveStyle({ opacity: "1" });
    vi.useRealTimers();
  });

  it("reveals the handle on hover and hides it again after blur leaves the wrapper", () => {
    const editor = createEditorMock();
    mockUseEditorRef.mockReturnValue(editor);

    const { container } = render(
      <DragHandleWrapper>
        <button type="button">Inner content</button>
      </DragHandleWrapper>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    if (!wrapper) {
      throw new Error("Expected wrapper element");
    }

    const trigger = screen.getByRole("button", { name: "Block actions" });
    expect(trigger).toHaveStyle({ opacity: "0" });

    fireEvent.mouseEnter(wrapper);
    expect(trigger).toHaveStyle({ opacity: "1" });

    fireEvent.focus(trigger);
    expect(trigger).toHaveStyle({ opacity: "1" });

    fireEvent.blur(trigger, { relatedTarget: document.body });
    expect(trigger).toHaveStyle({ opacity: "0" });
  });
});
