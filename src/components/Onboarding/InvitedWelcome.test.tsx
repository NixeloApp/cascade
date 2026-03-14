import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { InvitedWelcome } from "./InvitedWelcome";

describe("InvitedWelcome", () => {
  it("renders the inviter copy, capability list, and footer note", () => {
    render(<InvitedWelcome inviterName="Alex Rivera" onStartTour={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Welcome to Nixelo!" })).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("invited you to collaborate")).toBeInTheDocument();

    expect(screen.getByText("What you can do in Nixelo:")).toBeInTheDocument();
    expect(screen.getByText("View and work on project issues assigned to you")).toBeInTheDocument();
    expect(screen.getByText("Collaborate on documents in real-time")).toBeInTheDocument();
    expect(screen.getByText("Track time and participate in sprints")).toBeInTheDocument();
    expect(screen.getByText("Get notifications for mentions and updates")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Your team lead will add you to projects. You'll see them on your dashboard.",
      ),
    ).toBeInTheDocument();
  });

  it("calls the tour and skip handlers from the action buttons", async () => {
    const user = userEvent.setup();
    const onStartTour = vi.fn();
    const onSkip = vi.fn();

    render(<InvitedWelcome inviterName="Taylor Chen" onStartTour={onStartTour} onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: "Take a quick tour" }));
    await user.click(screen.getByRole("button", { name: "Skip to dashboard" }));

    expect(onStartTour).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
