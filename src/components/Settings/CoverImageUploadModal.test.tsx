import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { CoverImageUploadModal } from "./CoverImageUploadModal";

interface MockDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
}

interface MockDropzoneProps {
  acceptedTypes: string[];
  helperText: string;
  maxSizeLabel: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

vi.mock("@convex/_generated/api", () => ({
  api: {
    files: {
      generateUploadUrl: "files.generateUploadUrl",
    },
    users: {
      uploadCoverImage: "users.uploadCoverImage",
      removeCoverImage: "users.removeCoverImage",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ open, title, description, children }: MockDialogProps) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {description ? <div>{description}</div> : null}
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/ui/ImageUploadDropzone", () => ({
  ImageUploadDropzone: ({
    acceptedTypes,
    helperText,
    maxSizeLabel,
    onInputChange,
  }: MockDropzoneProps) => (
    <div>
      <div>{helperText}</div>
      <div>{maxSizeLabel}</div>
      <input
        type="file"
        aria-label="Cover image file input"
        accept={acceptedTypes.join(",")}
        onChange={onInputChange}
      />
    </div>
  ),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockGenerateUploadUrl = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUploadCoverImage = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockRemoveCoverImage = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

function installMockFileReader(result = "data:image/png;base64,cover-preview") {
  class MockFileReader {
    onload: ((event: { target: { result: string } }) => void) | null = null;

    readAsDataURL() {
      if (this.onload) {
        this.onload({ target: { result } });
      }
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);
}

describe("CoverImageUploadModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMockFileReader();
    let hookCall = 0;
    const mutationResults = [
      { mutate: mockGenerateUploadUrl, canAct: true, isAuthLoading: false },
      { mutate: mockUploadCoverImage, canAct: true, isAuthLoading: false },
      { mutate: mockRemoveCoverImage, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[hookCall % mutationResults.length];
      hookCall += 1;
      return result;
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the current cover image and removes it when requested", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockRemoveCoverImage.mockResolvedValue(undefined);

    render(
      <CoverImageUploadModal
        open={true}
        onOpenChange={onOpenChange}
        currentImage="https://example.com/cover.png"
      />,
    );

    expect(screen.getByAltText("Cover preview")).toHaveAttribute(
      "src",
      "https://example.com/cover.png",
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(mockRemoveCoverImage).toHaveBeenCalledWith({});
    expect(mockShowSuccess).toHaveBeenCalledWith("Cover image removed");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("rejects invalid file types before upload", () => {
    render(<CoverImageUploadModal open={true} onOpenChange={vi.fn()} currentImage={null} />);

    const invalidFile = new File(["bad"], "cover.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Cover image file input"), {
      target: { files: [invalidFile] },
    });

    expect(mockShowError).toHaveBeenCalledWith("Please select a JPG, PNG, GIF, or WebP image");
    expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
  });

  it("uploads a selected cover image and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockGenerateUploadUrl.mockResolvedValue({ uploadUrl: "https://upload.example.com" });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ storageId: "storage-1" }),
    } as Response);
    mockUploadCoverImage.mockResolvedValue({ success: true });

    render(<CoverImageUploadModal open={true} onOpenChange={onOpenChange} currentImage={null} />);

    const validFile = new File(["image"], "cover.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Cover image file input"), validFile);

    expect(screen.getByText("cover.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(mockGenerateUploadUrl).toHaveBeenCalledWith({});
    });

    expect(fetch).toHaveBeenCalledWith("https://upload.example.com", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: validFile,
    });
    expect(mockUploadCoverImage).toHaveBeenCalledWith({ storageId: "storage-1" });
    expect(mockShowSuccess).toHaveBeenCalledWith("Cover image updated successfully");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
