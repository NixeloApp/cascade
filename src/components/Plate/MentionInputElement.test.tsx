import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { fireEvent, render, screen } from "@/test/custom-render";
import { MentionInputElement } from "./MentionInputElement";

const { mockUseComboboxInput, mockGetMentionOnSelectItem, mockUseEditorRef } = vi.hoisted(() => ({
  mockUseComboboxInput: vi.fn(),
  mockGetMentionOnSelectItem: vi.fn(),
  mockUseEditorRef: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@platejs/combobox/react", () => ({
  useComboboxInput: mockUseComboboxInput,
}));

vi.mock("@platejs/mention", () => ({
  getMentionOnSelectItem: mockGetMentionOnSelectItem,
}));

vi.mock("platejs/react", () => ({
  useEditorRef: mockUseEditorRef,
}));

type MentionInputElementProps = ComponentProps<typeof MentionInputElement>;

const baseAttributes = {
  "data-slate-node": "element" as const,
  ref: () => {},
};

function createMentionInputProps(
  overrides: Partial<MentionInputElementProps>,
): MentionInputElementProps {
  return {
    api: {},
    attributes: baseAttributes,
    children: null,
    className: undefined,
    editor: {},
    element: {
      type: "mention_input",
      trigger: "@",
      children: [{ text: "" }],
    },
    getOptions: () => ({}),
    path: [0],
    plugin: {},
    setOptions: () => {},
    tf: {},
    type: "mention_input",
    ...overrides,
  } as MentionInputElementProps;
}

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

describe("MentionInputElement", () => {
  it("shows the empty prompt and forwards unhandled keys to the combobox input", () => {
    const onKeyDown = vi.fn();
    const onBlur = vi.fn();
    const removeInput = vi.fn();

    mockUseEditorRef.mockReturnValue({ editorId: "editor-1" });
    mockUseAuthenticatedQuery.mockReturnValue([]);
    mockUseComboboxInput.mockReturnValue({
      props: { onKeyDown, onBlur },
      removeInput,
    });
    mockGetMentionOnSelectItem.mockReturnValue(vi.fn());

    render(<MentionInputElement {...createMentionInputProps({})}>a</MentionInputElement>);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveTextContent("@a");
    expect(screen.getByText("Type to search users...")).toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: "x" });
    fireEvent.blur(combobox);

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(removeInput).not.toHaveBeenCalled();
  });

  it("shows a no-results state when search text has no matches", () => {
    mockUseEditorRef.mockReturnValue({ editorId: "editor-1" });
    mockUseAuthenticatedQuery.mockReturnValue([]);
    mockUseComboboxInput.mockReturnValue({
      props: { onKeyDown: vi.fn(), onBlur: vi.fn() },
      removeInput: vi.fn(),
    });
    mockGetMentionOnSelectItem.mockReturnValue(vi.fn());

    render(
      <MentionInputElement
        {...createMentionInputProps({
          element: {
            type: "mention_input",
            trigger: "@",
            children: [{ text: "Alex" }],
          },
        })}
      >
        Alex
      </MentionInputElement>,
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(expect.anything(), {
      query: "alex",
      limit: 5,
    });
  });

  it("renders users and selects the highlighted result with keyboard navigation", () => {
    const editor = { editorId: "editor-1" };
    const onSelectMention = vi.fn();
    const onKeyDown = vi.fn();
    const onBlur = vi.fn();
    const removeInput = vi.fn();

    mockUseEditorRef.mockReturnValue(editor);
    mockUseAuthenticatedQuery.mockReturnValue([
      {
        _id: "user_1",
        name: "Alex Rivera",
        email: "alex@example.com",
        image: "/alex.png",
      },
      {
        _id: "user_2",
        name: "Sam Lee",
        email: "sam@example.com",
        image: null,
      },
    ]);
    mockUseComboboxInput.mockReturnValue({
      props: { onKeyDown, onBlur },
      removeInput,
    });
    mockGetMentionOnSelectItem.mockReturnValue(onSelectMention);

    render(
      <MentionInputElement
        {...createMentionInputProps({
          element: {
            type: "mention_input",
            trigger: "@",
            children: [{ text: "Sa" }],
          },
        })}
      >
        Sa
      </MentionInputElement>,
    );

    const combobox = screen.getByRole("combobox");
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "Enter" });

    expect(onSelectMention).toHaveBeenCalledWith(
      editor,
      {
        id: "user_2",
        key: "user_2",
        text: "Sam Lee",
        email: "sam@example.com",
        image: null,
      },
      "sa",
    );
    expect(removeInput).toHaveBeenCalledWith(true);
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
  });
});
