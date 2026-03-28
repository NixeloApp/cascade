import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { forwardRef, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { MentionInput } from "./MentionInput";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("./CommentRenderer", () => ({
  CommentRenderer: ({ content }: { content: string }) => <div>{`preview:${content}`}</div>,
}));

vi.mock("./ui/Avatar", () => ({
  Avatar: ({ name }: { name?: string }) => <div>{`avatar:${name ?? "unknown"}`}</div>,
}));

vi.mock("./ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandItem: ({
    children,
    onSelect,
    value,
  }: {
    children: ReactNode;
    onSelect?: (value: string) => void;
    value: string;
  }) => (
    <button type="button" onClick={() => onSelect?.(value)}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Popover", async () => await import("@/test/__tests__/popoverMock"));

vi.mock("./ui/Textarea", () => ({
  Textarea: forwardRef(function Textarea(
    {
      value,
      onChange,
      onKeyDown,
      onClick,
      onKeyUp,
      placeholder,
      rows,
      className,
    }: {
      value: string;
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
      onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
      onClick?: (event: React.MouseEvent<HTMLTextAreaElement>) => void;
      onKeyUp?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
      placeholder?: string;
      rows?: number;
      className?: string;
    },
    ref: React.ForwardedRef<HTMLTextAreaElement>,
  ) {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onKeyUp={onKeyUp}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
    );
  }),
}));

vi.mock("./ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const projectId = "project_1" as Id<"projects">;

function MentionInputHarness({
  initialValue = "",
  enablePreview = true,
}: {
  initialValue?: string;
  enablePreview?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [mentions, setMentions] = useState<Id<"users">[]>([]);

  return (
    <div>
      <MentionInput
        projectId={projectId}
        value={value}
        onChange={setValue}
        onMentionsChange={setMentions}
        enablePreview={enablePreview}
      />
      <div>{`value:${value}`}</div>
      <div>{`mentions:${mentions.join(",")}`}</div>
    </div>
  );
}

describe("MentionInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedQuery.mockReturnValue([
      {
        _id: "member_1",
        userId: "user_1" as Id<"users">,
        userName: "Alice",
      },
      {
        _id: "member_2",
        userId: "user_2" as Id<"users">,
        userName: "Bob",
      },
    ]);
  });

  it("shows mention suggestions and inserts the selected member with keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<MentionInputHarness />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    await user.type(textarea, "@a");
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Add a comment...")).toHaveValue("@[Alice](user_1) ");
    });
    expect(
      screen.getByText((_, element) => element?.textContent === "mentions:user_1"),
    ).toBeInTheDocument();
    expect(screen.queryByText("avatar:Alice")).not.toBeInTheDocument();
  });

  it("toggles preview mode and renders the comment preview with current content", async () => {
    const user = userEvent.setup();

    render(<MentionInputHarness initialValue="**Ship it**" />);

    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByText("preview:**Ship it**")).toBeInTheDocument();
    expect(
      screen.getByText("Supports **bold**, *italic*, `code`, ~~strikethrough~~, and [links](url)"),
    ).toBeInTheDocument();
  });

  it("inserts emoji into the textarea and keeps markdown helper text in write mode", async () => {
    const user = userEvent.setup();

    render(<MentionInputHarness initialValue="Hello " />);

    const textarea = screen.getByPlaceholderText("Add a comment...") as HTMLTextAreaElement;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    fireEvent.click(textarea);

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.click(screen.getByRole("button", { name: "😀" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Add a comment...")).toHaveValue("Hello 😀");
    });
    expect(
      screen.getByText("Type @ to mention team members. Supports markdown formatting."),
    ).toBeInTheDocument();
  });

  it("extracts existing mention ids from typed markdown mention syntax", async () => {
    const user = userEvent.setup();

    render(<MentionInputHarness enablePreview={false} />);

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, {
      target: { value: "@[Bob](user_2) please review", selectionStart: 27 },
    });

    expect(
      screen.getByText((_, element) => element?.textContent === "mentions:user_2"),
    ).toBeInTheDocument();
  });
});
