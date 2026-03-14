import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { AvatarUploadModal } from "./AvatarUploadModal";

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
      uploadAvatar: "users.uploadAvatar",
      removeAvatar: "users.removeAvatar",
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
        aria-label="Avatar file input"
        accept={acceptedTypes.join(",")}
        onChange={onInputChange}
      />
    </div>
  ),
}));

vi.mock("@/components/ui/Avatar", () => ({
  Avatar: ({ src, name }: { src?: string | null; name?: string | null }) => (
    <div>{src ? `Avatar: ${src}` : (name ?? "No avatar")}</div>
  ),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockGenerateUploadUrl = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUploadAvatar = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockRemoveAvatar = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

function installMockFileReader(result = "data:image/png;base64,preview") {
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

describe("AvatarUploadModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMockFileReader();
    let hookCall = 0;
    const mutationResults = [
      { mutate: mockGenerateUploadUrl, canAct: true, isAuthLoading: false },
      { mutate: mockUploadAvatar, canAct: true, isAuthLoading: false },
      { mutate: mockRemoveAvatar, canAct: true, isAuthLoading: false },
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

  it("shows the current avatar and removes it when requested", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockRemoveAvatar.mockResolvedValue(undefined);

    render(
      <AvatarUploadModal
        open={true}
        onOpenChange={onOpenChange}
        currentImage="https://example.com/avatar.png"
        userName="Test User"
      />,
    );

    expect(screen.getByText("Avatar: https://example.com/avatar.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(mockRemoveAvatar).toHaveBeenCalledWith({});
    expect(mockShowSuccess).toHaveBeenCalledWith("Avatar removed");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("rejects invalid file types before upload", async () => {
    render(<AvatarUploadModal open={true} onOpenChange={vi.fn()} userName="Test User" />);

    const invalidFile = new File(["bad"], "avatar.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Avatar file input"), {
      target: { files: [invalidFile] },
    });

    expect(mockShowError).toHaveBeenCalledWith("Please select a JPG, PNG, GIF, or WebP image");
    expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
  });

  it("uploads a selected avatar and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockGenerateUploadUrl.mockResolvedValue({ uploadUrl: "https://upload.example.com" });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ storageId: "storage-1" }),
    } as Response);
    mockUploadAvatar.mockResolvedValue({ success: true });

    render(
      <AvatarUploadModal
        open={true}
        onOpenChange={onOpenChange}
        currentImage={null}
        userName="Test User"
      />,
    );

    const validFile = new File(["image"], "avatar.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Avatar file input"), validFile);

    expect(screen.getByText("avatar.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(mockGenerateUploadUrl).toHaveBeenCalledWith({});
    });

    expect(fetch).toHaveBeenCalledWith("https://upload.example.com", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: validFile,
    });
    expect(mockUploadAvatar).toHaveBeenCalledWith({ storageId: "storage-1" });
    expect(mockShowSuccess).toHaveBeenCalledWith("Avatar updated successfully");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
