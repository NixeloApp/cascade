import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, waitFor } from "@/test/custom-render";
import { RoleSelector } from "./RoleSelector";

describe("RoleSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets pending state when role selection rejects", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn().mockRejectedValue(new Error("selection failed"));

    render(<RoleSelector onSelect={onSelect} />);

    const teamLeadCard = screen.getByTestId(TEST_IDS.ONBOARDING.TEAM_LEAD_CARD);

    await user.click(teamLeadCard);
    expect(teamLeadCard).toBeDisabled();
    expect(teamLeadCard).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("team_lead"));
    await waitFor(() => expect(teamLeadCard).not.toBeDisabled());
    await waitFor(() => expect(teamLeadCard).toHaveAttribute("aria-pressed", "false"));
  });
});
