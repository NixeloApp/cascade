import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SwimlanSelector } from "./SwimlanSelector";

describe("SwimlanSelector", () => {
  describe("Rendering", () => {
    it("should render trigger button", () => {
      render(<SwimlanSelector value="none" onChange={vi.fn()} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display 'Swimlanes' when value is 'none'", () => {
      render(<SwimlanSelector value="none" onChange={vi.fn()} />);

      expect(screen.getByText("Swimlanes")).toBeInTheDocument();
    });

    it("should display 'Priority' when value is 'priority'", () => {
      render(<SwimlanSelector value="priority" onChange={vi.fn()} />);

      expect(screen.getByText("Priority")).toBeInTheDocument();
    });

    it("should display 'Assignee' when value is 'assignee'", () => {
      render(<SwimlanSelector value="assignee" onChange={vi.fn()} />);

      expect(screen.getByText("Assignee")).toBeInTheDocument();
    });

    it("should display 'Type' when value is 'type'", () => {
      render(<SwimlanSelector value="type" onChange={vi.fn()} />);

      expect(screen.getByText("Type")).toBeInTheDocument();
    });

    it("should display 'Label' when value is 'label'", () => {
      render(<SwimlanSelector value="label" onChange={vi.fn()} />);

      expect(screen.getByText("Label")).toBeInTheDocument();
    });
  });

  describe("Dropdown Menu", () => {
    it("should open dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<SwimlanSelector value="none" onChange={vi.fn()} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("should display all swimlane options", async () => {
      const user = userEvent.setup();
      render(<SwimlanSelector value="none" onChange={vi.fn()} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("menuitemcheckbox", { name: "No Swimlanes" })).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Priority" })).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Assignee" })).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Type" })).toBeInTheDocument();
      expect(screen.getByRole("menuitemcheckbox", { name: "Label" })).toBeInTheDocument();
    });

    it("should show current value as checked", async () => {
      const user = userEvent.setup();
      render(<SwimlanSelector value="priority" onChange={vi.fn()} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("menuitemcheckbox", { name: "Priority" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemcheckbox", { name: "No Swimlanes" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });

  describe("Selection", () => {
    it("should call onChange when option is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SwimlanSelector value="none" onChange={onChange} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Priority" }));

      expect(onChange).toHaveBeenCalledWith("priority");
    });

    it("should call onChange with 'none' when No Swimlanes is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SwimlanSelector value="priority" onChange={onChange} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "No Swimlanes" }));

      expect(onChange).toHaveBeenCalledWith("none");
    });

    it("should call onChange with 'assignee' when Assignee is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SwimlanSelector value="none" onChange={onChange} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Assignee" }));

      expect(onChange).toHaveBeenCalledWith("assignee");
    });

    it("should call onChange with 'type' when Type is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SwimlanSelector value="none" onChange={onChange} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Type" }));

      expect(onChange).toHaveBeenCalledWith("type");
    });

    it("should call onChange with 'label' when Label is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SwimlanSelector value="none" onChange={onChange} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Label" }));

      expect(onChange).toHaveBeenCalledWith("label");
    });
  });
});
