import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { useOnlineStatus } from "@/hooks/useOffline";
import { OfflineBanner } from "./OfflineBanner";

// Mock the useOnlineStatus hook
vi.mock("@/hooks/useOffline", () => ({
  useOnlineStatus: vi.fn(),
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when online", () => {
    it("should not render anything", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(true);

      const { container } = render(<OfflineBanner />);

      expect(container.firstChild).toBeNull();
    });

    it("should not show offline message", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(true);

      render(<OfflineBanner />);

      expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();
    });
  });

  describe("when offline", () => {
    it("should render the banner", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);

      const { container } = render(<OfflineBanner />);

      expect(container.firstChild).not.toBeNull();
    });

    it("should display offline message", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);

      render(<OfflineBanner />);

      expect(
        screen.getByText("You're offline. Changes will sync when you reconnect."),
      ).toBeInTheDocument();
    });

    it("should display wifi-off icon", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);

      const { container } = render(<OfflineBanner />);

      // Lucide icons have class lucide lucide-wifi-off
      const icon = container.querySelector(".lucide-wifi-off");
      expect(icon).toBeInTheDocument();
    });

    it("should have warning styling", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);

      const { container } = render(<OfflineBanner />);

      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("bg-status-warning");
    });

    it("should have animation class", () => {
      vi.mocked(useOnlineStatus).mockReturnValue(false);

      const { container } = render(<OfflineBanner />);

      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain("animate-slide-up");
    });
  });

  describe("reactivity", () => {
    it("should appear when going offline", () => {
      // Start online
      vi.mocked(useOnlineStatus).mockReturnValue(true);
      const { container, rerender } = render(<OfflineBanner />);

      expect(container.firstChild).toBeNull();

      // Go offline
      vi.mocked(useOnlineStatus).mockReturnValue(false);
      rerender(<OfflineBanner />);

      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });

    it("should disappear when coming online", () => {
      // Start offline
      vi.mocked(useOnlineStatus).mockReturnValue(false);
      const { container, rerender } = render(<OfflineBanner />);

      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();

      // Come online
      vi.mocked(useOnlineStatus).mockReturnValue(true);
      rerender(<OfflineBanner />);

      expect(container.firstChild).toBeNull();
    });
  });
});
