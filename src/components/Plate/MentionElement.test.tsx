import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { MentionElement } from "./MentionElement";

type MentionElementProps = ComponentProps<typeof MentionElement>;

const baseAttributes = {
  "data-slate-node": "element" as const,
  ref: () => {},
};

function createMentionProps(overrides: Partial<MentionElementProps>): MentionElementProps {
  return {
    api: {},
    attributes: baseAttributes,
    children: null,
    className: undefined,
    editor: {},
    element: {
      type: "mention",
      children: [{ text: "" }],
    },
    getOptions: () => ({}),
    path: [0],
    plugin: {},
    setOptions: () => {},
    tf: {},
    type: "mention",
    ...overrides,
  } as MentionElementProps;
}

describe("MentionElement", () => {
  it("renders the mention badge with the user text and avatar when an image is present", () => {
    const { container } = render(
      <MentionElement
        {...createMentionProps({
          attributes: { ...baseAttributes, "data-mention-id": "user-1" },
          className: "mention-pill",
          element: {
            type: "mention",
            value: {
              id: "user-1",
              text: "Alex Rivera",
              image: "/alex.png",
            },
            children: [{ text: "" }],
          },
        })}
      >
        ignored fallback
      </MentionElement>,
    );

    const badge = screen.getByText("@", { exact: false });
    expect(badge).toHaveAttribute("data-mention-id", "user-1");
    expect(badge).toHaveAttribute("contenteditable", "false");
    expect(badge).toHaveClass("mention-pill");
    expect(screen.getByText("@Alex Rivera")).toBeInTheDocument();
    expect(container.querySelector(".w-5.h-5")).not.toBeNull();
  });

  it("falls back to children when the mention value has no text", () => {
    render(
      <MentionElement
        {...createMentionProps({
          element: {
            type: "mention",
            value: {
              id: "user-2",
              text: "",
            },
            children: [{ text: "" }],
          },
        })}
      >
        Unknown teammate
      </MentionElement>,
    );

    expect(screen.getByText("@Unknown teammate")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to children when the mention value is missing", () => {
    render(
      <MentionElement
        {...createMentionProps({
          element: {
            type: "mention",
            children: [{ text: "" }],
          },
        })}
      >
        External guest
      </MentionElement>,
    );

    expect(screen.getByText("@External guest")).toBeInTheDocument();
  });
});
