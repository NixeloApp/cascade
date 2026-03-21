import { FolderKanban } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { AnalyticsInsightCard } from "./AnalyticsInsightCard";

describe("AnalyticsInsightCard", () => {
  it("renders the summary value, description, and metadata", () => {
    render(
      <AnalyticsInsightCard
        title="Flow Snapshot"
        value="22 open issues"
        description="Todo is the biggest queue right now."
        icon={FolderKanban}
        meta={["3 done", "Top work type: Task"]}
      />,
    );

    expect(screen.getByText("Flow Snapshot")).toBeInTheDocument();
    expect(screen.getByText("22 open issues")).toBeInTheDocument();
    expect(screen.getByText("Todo is the biggest queue right now.")).toBeInTheDocument();
    expect(screen.getByText(/3 done/i)).toBeInTheDocument();
    expect(screen.getByText(/top work type: task/i)).toBeInTheDocument();
  });
});
