import { EDITOR_HIGHLIGHT_COLOR_OPTIONS, EDITOR_TEXT_COLOR_OPTIONS } from "@convex/shared/colors";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { ColorPickerButton } from "./ColorPickerButton";

const { mockUseEditorRef } = vi.hoisted(() => ({
  mockUseEditorRef: vi.fn(),
}));

vi.mock("platejs/react", () => ({
  useEditorRef: mockUseEditorRef,
}));

describe("ColorPickerButton", () => {
  it("renders the font color trigger and all text color swatches", async () => {
    const user = userEvent.setup();
    const addMark = vi.fn();
    const removeMark = vi.fn();

    mockUseEditorRef.mockReturnValue({
      tf: {
        addMark,
        removeMark,
      },
    });

    render(<ColorPickerButton type="fontColor" />);

    const trigger = screen.getByTestId(TEST_IDS.EDITOR.FONT_COLOR_TRIGGER);
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    for (const color of EDITOR_TEXT_COLOR_OPTIONS) {
      expect(
        await screen.findByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH(color.name)),
      ).toBeInTheDocument();
    }

    expect(addMark).not.toHaveBeenCalled();
    expect(removeMark).not.toHaveBeenCalled();
  });

  it("adds a font color mark and remembers the selected swatch", async () => {
    const user = userEvent.setup();
    const addMark = vi.fn();
    const removeMark = vi.fn();

    mockUseEditorRef.mockReturnValue({
      tf: {
        addMark,
        removeMark,
      },
    });

    render(<ColorPickerButton type="fontColor" />);

    const trigger = screen.getByTestId(TEST_IDS.EDITOR.FONT_COLOR_TRIGGER);
    await user.click(trigger);
    await user.click(await screen.findByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH("Gray")));

    expect(addMark).toHaveBeenCalledWith("fontColor", "#6b7280");
    expect(removeMark).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(
        screen.queryByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH("Gray")),
      ).not.toBeInTheDocument(),
    );

    await user.click(trigger);
    const graySwatch = await screen.findByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH("Gray"));
    expect(graySwatch).toHaveStyle({
      boxShadow: "0 0 0 2px var(--color-brand), 0 0 0 3px var(--color-ui-bg)",
    });
  });

  it("removes the background color mark when selecting the empty option", async () => {
    const user = userEvent.setup();
    const addMark = vi.fn();
    const removeMark = vi.fn();

    mockUseEditorRef.mockReturnValue({
      tf: {
        addMark,
        removeMark,
      },
    });

    render(<ColorPickerButton type="backgroundColor" />);

    const trigger = screen.getByRole("button", { name: "Highlight" });
    await user.click(trigger);
    await user.click(await screen.findByTitle("Yellow"));

    expect(addMark).toHaveBeenCalledWith("backgroundColor", "#fef08a");

    await waitFor(() => expect(screen.queryByTitle("Yellow")).not.toBeInTheDocument());

    await user.click(trigger);
    const noneSwatch = await screen.findByTitle(EDITOR_HIGHLIGHT_COLOR_OPTIONS[0].name);
    const noneButton = noneSwatch.closest("button");
    expect(noneButton).not.toBeNull();
    if (!noneButton) {
      throw new Error("Expected empty swatch button");
    }
    expect(within(noneButton).getByText("×")).toBeInTheDocument();

    await user.click(noneSwatch);

    expect(removeMark).toHaveBeenCalledWith("backgroundColor");
  });

  it("does nothing when no editor instance is available", async () => {
    const user = userEvent.setup();
    mockUseEditorRef.mockReturnValue(null);

    render(<ColorPickerButton type="fontColor" />);

    await user.click(screen.getByTestId(TEST_IDS.EDITOR.FONT_COLOR_TRIGGER));
    await user.click(await screen.findByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH("Red")));

    await waitFor(() =>
      expect(screen.getByTestId(TEST_IDS.EDITOR.FONT_COLOR_SWATCH("Red"))).toBeInTheDocument(),
    );
  });
});
