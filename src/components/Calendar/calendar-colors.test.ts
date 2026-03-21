import { describe, expect, it } from "vitest";
import {
  getDotColorClass,
  getEventBadgeClass,
  getEventColorClasses,
  PALETTE_COLORS,
} from "./calendar-colors";

describe("calendar-colors", () => {
  it("keeps the palette colors list stable", () => {
    expect(PALETTE_COLORS).toEqual([
      "blue",
      "red",
      "green",
      "amber",
      "orange",
      "purple",
      "pink",
      "teal",
      "indigo",
      "gray",
    ]);
  });

  it("returns type-based badge defaults when no explicit color is provided", () => {
    expect(getEventBadgeClass("meeting")).toBe("bg-palette-blue-bg text-palette-blue-text");
    expect(getEventBadgeClass("deadline")).toBe("bg-palette-red-bg text-palette-red-text");
    expect(getEventBadgeClass("unknown")).toBe("bg-palette-blue-bg text-palette-blue-text");
  });

  it("prefers explicit event colors for badge styling", () => {
    expect(getEventBadgeClass("meeting", "teal")).toBe("bg-palette-teal-bg text-palette-teal-text");
    expect(getEventBadgeClass("meeting", "amber")).toBe(
      "bg-palette-amber-bg text-palette-amber-text",
    );
  });

  it("falls back to blue for invalid dot colors", () => {
    expect(getDotColorClass("purple")).toBe("bg-palette-purple");
    expect(getDotColorClass("not-a-color")).toBe("bg-palette-blue");
  });

  it("returns full event card styling and preserves amber text contrast", () => {
    expect(getEventColorClasses("amber")).toEqual({
      bg: "bg-palette-amber-solid",
      hover: "hover:bg-palette-amber-solid/85",
      border: "",
      text: "text-ui-text",
    });
    expect(getEventColorClasses("missing")).toEqual(getEventColorClasses("blue"));
  });
});
