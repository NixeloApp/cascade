import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IconPicker, LUCIDE_ICON_PREFIX, TemplateIcon } from "./IconPicker";

describe("IconPicker", () => {
  it("filters icon options by search", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IconPicker value={`${LUCIDE_ICON_PREFIX}FileText`} onChange={onChange} />);

    await user.type(screen.getByLabelText("Search icons"), "rocket");

    expect(screen.getByLabelText("Select Rocket icon")).toBeInTheDocument();
    expect(screen.queryByLabelText("Select File Text icon")).not.toBeInTheDocument();
  });

  it("selects lucide icon values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IconPicker value={`${LUCIDE_ICON_PREFIX}FileText`} onChange={onChange} />);

    await user.click(screen.getByLabelText("Select Rocket icon"));

    expect(onChange).toHaveBeenCalledWith(`${LUCIDE_ICON_PREFIX}Rocket`);
  });

  it("selects emoji fallback values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IconPicker value={`${LUCIDE_ICON_PREFIX}FileText`} onChange={onChange} />);

    await user.click(screen.getByLabelText("Select 📊 emoji"));

    expect(onChange).toHaveBeenCalledWith("📊");
  });

  it("supports keyboard navigation in the icon grid", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<IconPicker value={`${LUCIDE_ICON_PREFIX}FileText`} onChange={onChange} />);

    const firstButton = screen.getByLabelText("Select File Text icon");
    firstButton.focus();
    await user.keyboard("{ArrowRight}{Enter}");

    expect(onChange).toHaveBeenCalledWith(`${LUCIDE_ICON_PREFIX}BookOpen`);
  });
});

describe("TemplateIcon", () => {
  it("renders fallback emoji values", () => {
    render(<TemplateIcon value="📄" />);
    expect(screen.getByText("📄")).toBeInTheDocument();
  });
});
