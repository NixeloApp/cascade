import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import {
  ImportExportFormatSelector,
  ImportExportInfoAlert,
  ImportExportPanelChrome,
} from "./ImportExportPanelChrome";

describe("ImportExportPanelChrome", () => {
  it("renders shared import/export panel anatomy and switches formats", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ImportExportPanelChrome>
        <ImportExportFormatSelector
          label="Select Export Format"
          value="csv"
          onValueChange={onValueChange}
        />
        <ImportExportInfoAlert
          title="Export Information"
          variant="info"
          items={[
            { id: "csv-note", content: "CSV exports open cleanly in spreadsheet tools." },
            { id: "scope", content: "All issues in this project will be exported." },
          ]}
        />
      </ImportExportPanelChrome>,
    );

    expect(screen.getByText("Select Export Format")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Export Information")).toBeInTheDocument();
    expect(screen.getByText("All issues in this project will be exported.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /json/i }));

    expect(onValueChange).toHaveBeenCalledWith("json");
  });
});
