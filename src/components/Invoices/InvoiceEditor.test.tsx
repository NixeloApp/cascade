import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { InvoiceEditor } from "./InvoiceEditor";

describe("InvoiceEditor", () => {
  it("recomputes the subtotal when line item values change", async () => {
    const user = userEvent.setup();

    render(
      <InvoiceEditor
        initialLineItems={[{ description: "Design", quantity: 2, rate: 150 }]}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Subtotal: $300.00")).toBeInTheDocument();

    const [quantityInput, rateInput] = screen.getAllByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");
    await user.clear(rateInput);
    await user.type(rateInput, "200");

    expect(screen.getByText("Subtotal: $600.00")).toBeInTheDocument();
  });

  it("disables save for blank line items and re-enables it after removal", async () => {
    const user = userEvent.setup();

    render(
      <InvoiceEditor
        initialLineItems={[{ description: "Strategy", quantity: 1, rate: 250 }]}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Save line items" });
    expect(saveButton).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add line" }));

    expect(screen.getAllByPlaceholderText("Line item description")).toHaveLength(2);
    expect(saveButton).toBeDisabled();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[1]);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("Line item description")).toHaveLength(1);
    });
    expect(saveButton).not.toBeDisabled();
  });

  it("saves the edited line items without editor-only ids", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <InvoiceEditor
        initialLineItems={[{ description: "Consulting", quantity: 1, rate: 100 }]}
        onSave={onSave}
      />,
    );

    const [initialDescription] = screen.getAllByPlaceholderText("Line item description");
    await user.clear(initialDescription);
    await user.type(initialDescription, "Consulting retainer");

    const [initialQuantity, initialRate] = screen.getAllByRole("spinbutton");
    await user.clear(initialQuantity);
    await user.type(initialQuantity, "2");
    await user.clear(initialRate);
    await user.type(initialRate, "125");

    await user.click(screen.getByRole("button", { name: "Add line" }));

    const descriptionInputs = screen.getAllByPlaceholderText("Line item description");
    await user.type(descriptionInputs[1], "QA review");

    const spinbuttons = screen.getAllByRole("spinbutton");
    await user.clear(spinbuttons[2]);
    await user.type(spinbuttons[2], "3");
    await user.clear(spinbuttons[3]);
    await user.type(spinbuttons[3], "50");

    await user.click(screen.getByRole("button", { name: "Save line items" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([
        { description: "Consulting retainer", quantity: 2, rate: 125 },
        { description: "QA review", quantity: 3, rate: 50 },
      ]);
    });
  });
});
