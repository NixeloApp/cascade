import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { UserProfile } from "./UserProfile";

vi.mock("./Settings/ProfileContent", () => ({
  ProfileContent: ({ userId }: { userId?: Id<"users"> }) => (
    <div>{`profile-content:${userId ?? "current-user"}`}</div>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="profile-card" data-class-name={className}>
      {children}
    </div>
  ),
}));

vi.mock("./ui/Dialog", () => ({
  Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

describe("UserProfile", () => {
  it("does not render the dialog while closed", () => {
    render(<UserProfile open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("dialog", { name: "User Profile" })).not.toBeInTheDocument();
  });

  it("renders the dialog wrapper and forwards an explicit user id to profile content", () => {
    render(<UserProfile userId={"user_1" as Id<"users">} open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "User Profile" })).toBeInTheDocument();
    expect(screen.getByText("profile-content:user_1")).toBeInTheDocument();
    expect(screen.getByTestId("profile-card")).toHaveAttribute(
      "data-class-name",
      "overflow-y-auto pt-0",
    );
  });

  it("renders current-user profile content when no user id is provided", () => {
    render(<UserProfile open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("profile-content:current-user")).toBeInTheDocument();
  });
});
