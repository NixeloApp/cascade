import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInitialValue,
  getIssueDescriptionPlugins,
  isEmptyValue,
  serializeValue,
} from "@/lib/plate/editor";
import { render, screen } from "@/test/custom-render";
import { IssueDescriptionEditor, IssueDescriptionReadOnly } from "./IssueDescriptionEditor";

vi.mock("platejs/react", () => ({
  Plate: vi.fn(),
  usePlateEditor: vi.fn(),
}));

vi.mock("@/components/ui/PlateRichTextContent", () => ({
  PlateRichTextContent: ({
    placeholder,
    readOnly,
    autoFocus,
    variant,
    className,
    "data-testid": testId,
  }: {
    placeholder?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    variant?: string;
    className?: string;
    "data-testid"?: string;
  }) => (
    <div
      data-testid={testId ?? "plate-rich-text-content"}
      data-placeholder={placeholder}
      data-read-only={readOnly ? "true" : "false"}
      data-auto-focus={autoFocus ? "true" : "false"}
      data-variant={variant}
      data-class-name={className}
    />
  ),
}));

vi.mock("@/lib/plate/editor", () => ({
  getInitialValue: vi.fn(),
  getIssueDescriptionPlugins: vi.fn(),
  isEmptyValue: vi.fn(),
  serializeValue: vi.fn(),
}));

vi.mock("./Plate/FloatingToolbar", () => ({
  FloatingToolbar: () => <div data-testid="floating-toolbar" />,
}));

const mockPlate = vi.mocked(Plate);
const mockUsePlateEditor = vi.mocked(usePlateEditor);
const mockGetInitialValue = vi.mocked(getInitialValue);
const mockGetIssueDescriptionPlugins = vi.mocked(getIssueDescriptionPlugins);
const mockIsEmptyValue = vi.mocked(isEmptyValue);
const mockSerializeValue = vi.mocked(serializeValue);

const initialValue: Value = [{ type: "p", children: [{ text: "" }] }];
const parsedJsonValue: Value = [{ type: "p", children: [{ text: "json value" }] }];
const changedValue: Value = [{ type: "p", children: [{ text: "changed value" }] }];
const editorInstance = { id: "mock-editor" } as NonNullable<ReturnType<typeof usePlateEditor>>;
const plugins: ReturnType<typeof getIssueDescriptionPlugins> = [];
type PlateProps = ComponentProps<typeof Plate>;

let latestPlateProps:
  | {
      onChange?: PlateProps["onChange"];
      readOnly?: boolean;
      children?: ReactNode;
    }
  | undefined;

describe("IssueDescriptionEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    latestPlateProps = undefined;

    mockGetInitialValue.mockReturnValue(initialValue);
    mockGetIssueDescriptionPlugins.mockReturnValue(plugins);
    mockIsEmptyValue.mockReturnValue(false);
    mockSerializeValue.mockReturnValue("serialized-value");
    mockUsePlateEditor.mockReturnValue(editorInstance as never);
    mockPlate.mockImplementation(({ children, onChange, readOnly }) => {
      latestPlateProps = {
        children: children ?? undefined,
        onChange: onChange ?? undefined,
        readOnly: readOnly ?? undefined,
      };
      return <div data-testid="plate-root">{children}</div>;
    });
  });

  it("uses parsed JSON input for the editable editor and renders editable chrome", () => {
    render(
      <IssueDescriptionEditor
        value={JSON.stringify(parsedJsonValue)}
        placeholder="Describe the issue"
        autoFocus
        testId="issue-editor"
      />,
    );

    expect(mockUsePlateEditor).toHaveBeenCalledWith({
      plugins,
      value: parsedJsonValue,
    });
    expect(screen.getByTestId("floating-toolbar")).toBeInTheDocument();

    const content = screen.getByTestId("issue-editor");
    expect(content).toHaveAttribute("data-placeholder", "Describe the issue");
    expect(content).toHaveAttribute("data-read-only", "false");
    expect(content).toHaveAttribute("data-auto-focus", "true");
    expect(content).toHaveAttribute("data-variant", "issueEditor");
  });

  it("falls back to the initial value for invalid stored input and serializes non-empty changes", () => {
    const onChange = vi.fn();

    render(<IssueDescriptionEditor value="Legacy plain text" onChange={onChange} />);

    expect(mockGetInitialValue).toHaveBeenCalled();
    expect(mockUsePlateEditor).toHaveBeenCalledWith({
      plugins,
      value: initialValue,
    });

    latestPlateProps?.onChange?.({ editor: editorInstance, value: changedValue });

    expect(mockIsEmptyValue).toHaveBeenCalledWith(changedValue);
    expect(mockSerializeValue).toHaveBeenCalledWith(changedValue);
    expect(onChange).toHaveBeenCalledWith("serialized-value");
  });

  it("sends an empty string for empty changes and hides editable chrome in read-only mode", () => {
    const onChange = vi.fn();
    mockIsEmptyValue.mockReturnValue(true);

    const { container } = render(
      <IssueDescriptionEditor
        value={null}
        onChange={onChange}
        readOnly
        className="custom-shell"
        testId="readonly-editor"
      />,
    );

    expect(mockGetInitialValue).toHaveBeenCalled();
    expect(screen.queryByTestId("floating-toolbar")).not.toBeInTheDocument();
    expect(screen.getByTestId("readonly-editor")).toHaveAttribute("data-read-only", "true");
    expect(container.firstChild).toHaveClass("bg-ui-bg-secondary");
    expect(container.firstChild).toHaveClass("custom-shell");

    latestPlateProps?.onChange?.({ editor: editorInstance, value: changedValue });

    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("IssueDescriptionReadOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    latestPlateProps = undefined;

    mockGetInitialValue.mockReturnValue(initialValue);
    mockGetIssueDescriptionPlugins.mockReturnValue(plugins);
    mockUsePlateEditor.mockReturnValue(editorInstance as never);
    mockPlate.mockImplementation(({ children, onChange, readOnly }) => {
      latestPlateProps = {
        children: children ?? undefined,
        onChange: onChange ?? undefined,
        readOnly: readOnly ?? undefined,
      };
      return <div data-testid="plate-root">{children}</div>;
    });
  });

  it("returns null for empty values", () => {
    mockIsEmptyValue.mockReturnValue(true);

    const { container } = render(<IssueDescriptionReadOnly value={null} testId="issue-readonly" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the read-only view for non-empty valid JSON values", () => {
    mockIsEmptyValue.mockReturnValue(false);

    render(
      <IssueDescriptionReadOnly
        value={JSON.stringify(parsedJsonValue)}
        className="read-only-shell"
        testId="issue-readonly"
      />,
    );

    expect(mockUsePlateEditor).toHaveBeenCalledWith({
      plugins,
      value: parsedJsonValue,
    });
    expect(screen.getByTestId("issue-readonly")).toHaveAttribute("data-read-only", "true");
    expect(screen.getByTestId("issue-readonly")).toHaveAttribute("data-variant", "issueReadOnly");
    expect(screen.getByTestId("issue-readonly")).toHaveAttribute(
      "data-class-name",
      "read-only-shell",
    );
  });

  it("returns null for invalid stored input", () => {
    mockIsEmptyValue.mockReturnValue(true);

    const { container } = render(
      <IssueDescriptionReadOnly value="Stored plain text" testId="issue-readonly" />,
    );

    expect(mockGetInitialValue).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
