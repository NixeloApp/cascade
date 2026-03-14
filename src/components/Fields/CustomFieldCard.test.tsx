import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { CustomFieldCard } from "./CustomFieldCard";

vi.mock("../ui/Icon", () => ({
  Icon: ({ icon }: { icon: { name?: string } }) => (
    <span data-testid="field-icon">{icon.name ?? "unknown"}</span>
  ),
}));

const baseField = {
  _id: "field_1" as Id<"customFields">,
  name: "Customer segment",
  fieldKey: "customerSegment",
  fieldType: "select",
  isRequired: true,
  description: "Used for account planning",
  options: ["Enterprise", "SMB"],
};

describe("CustomFieldCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the field metadata, required badge, options, and mapped icon", () => {
    render(<CustomFieldCard field={baseField} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTestId("field-icon")).toBeInTheDocument();
    expect(screen.getByText("Customer segment")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("customerSegment")).toBeInTheDocument();
    expect(screen.getByText("select")).toBeInTheDocument();
    expect(screen.getByText("Used for account planning")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("SMB")).toBeInTheDocument();
  });

  it("omits optional content and falls back to the default icon for unknown field types", () => {
    render(
      <CustomFieldCard
        field={{
          ...baseField,
          name: "Reference doc",
          fieldType: "richtext",
          isRequired: false,
          description: undefined,
          options: [],
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("field-icon")).toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByText("Used for account planning")).not.toBeInTheDocument();
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();
    expect(screen.queryByText("SMB")).not.toBeInTheDocument();
    expect(screen.getByText("richtext")).toBeInTheDocument();
  });

  it("fires the edit and delete callbacks from the action buttons", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<CustomFieldCard field={baseField} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
