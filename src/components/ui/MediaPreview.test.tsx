import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MediaPreviewAction,
  MediaPreviewEmptyState,
  MediaPreviewFileCard,
  MediaPreviewFrame,
  MediaPreviewImage,
} from "./MediaPreview";

describe("MediaPreview", () => {
  it("renders the cover frame with its owned preview shell", () => {
    render(
      <MediaPreviewFrame surface="cover" data-testid="cover-frame">
        <MediaPreviewImage alt="Preview" src="https://example.com/cover.png" />
      </MediaPreviewFrame>,
    );

    expect(screen.getByTestId("cover-frame").className).toContain("h-32");
    expect(screen.getByAltText("Preview").className).toContain("object-cover");
  });

  it("renders the profile cover shell with the owned empty gradient tone", () => {
    render(
      <MediaPreviewFrame
        surface="profileCover"
        tone="profileEmpty"
        data-testid="profile-cover-frame"
      >
        <span>Empty cover</span>
      </MediaPreviewFrame>,
    );

    expect(screen.getByTestId("profile-cover-frame").className).toContain("from-brand/18");
  });

  it("renders file metadata through the shared summary card", () => {
    const file = new File(["image"], "avatar.png", { type: "image/png" });

    render(<MediaPreviewFileCard file={file} />);

    expect(screen.getByText("avatar.png")).toBeInTheDocument();
    expect(screen.getByText("0 KB")).toBeInTheDocument();
  });

  it("positions avatar and cover actions through owned placements", () => {
    render(
      <>
        <MediaPreviewAction placement="avatarUpload">
          <button type="button">Avatar action</button>
        </MediaPreviewAction>
        <MediaPreviewEmptyState>
          <MediaPreviewAction placement="coverCorner">
            <button type="button">Cover action</button>
          </MediaPreviewAction>
        </MediaPreviewEmptyState>
      </>,
    );

    expect(screen.getByText("Avatar action").parentElement?.className).toContain("-bottom-1");
    expect(screen.getByText("Cover action").parentElement?.className).toContain("backdrop-blur-sm");
  });
});
