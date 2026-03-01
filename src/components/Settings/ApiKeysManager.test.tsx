import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock data storage
let mockApiKeys:
  | {
      id: Id<"apiKeys">;
      name: string;
      keyPrefix: string;
      scopes: string[];
      isActive: boolean;
      usageCount: number;
      rateLimit: number;
      lastUsedAt?: number;
      expiresAt?: number;
    }[]
  | undefined;

let mockUsageStats:
  | {
      totalCalls: number;
      last24Hours: number;
      successCount: number;
      avgResponseTime: number;
      recentLogs: {
        endpoint: string;
        method: string;
        statusCode: number;
        responseTime: number;
        createdAt: number;
        error?: string;
      }[];
    }
  | undefined;

const mockGenerateKey = vi.fn();
const mockRevokeKey = vi.fn();
const mockDeleteKey = vi.fn();

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    // Return usage stats when keyId is provided
    if (typeof args === "object" && args !== null && "keyId" in args) {
      return mockUsageStats;
    }
    return mockApiKeys;
  }),
  useMutation: vi.fn(() => {
    // Return different mock based on what mutation is being called
    return mockGenerateKey;
  }),
}));

// Import after mocks
import { ApiKeysManager } from "./ApiKeysManager";

describe("ApiKeysManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiKeys = undefined;
    mockUsageStats = undefined;
    mockGenerateKey.mockResolvedValue({ apiKey: "nxl_test_key_123" });
    mockRevokeKey.mockResolvedValue({});
    mockDeleteKey.mockResolvedValue({});
  });

  describe("Empty State", () => {
    it("should render empty state when no API keys exist", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(screen.getByText("No API keys yet")).toBeInTheDocument();
      expect(
        screen.getByText("Generate your first API key to access Nixelo programmatically"),
      ).toBeInTheDocument();
    });

    it("should render Generate Your First Key button in empty state", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /Generate Your First Key/i })).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("should render API Keys title", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });

    it("should render description text", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(
        screen.getByText("Generate API keys for CLI tools, AI agents, and external integrations"),
      ).toBeInTheDocument();
    });

    it("should render Generate Key button in header", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /Generate Key/i })).toBeInTheDocument();
    });
  });

  describe("API Keys List", () => {
    it("should render API key cards when keys exist", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "CLI Tool",
          keyPrefix: "nxl_abc123",
          scopes: ["issues:read", "issues:write"],
          isActive: true,
          usageCount: 150,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText("CLI Tool")).toBeInTheDocument();
      expect(screen.getByText("nxl_abc123...")).toBeInTheDocument();
    });

    it("should render Active badge for active keys", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Active Key",
          keyPrefix: "nxl_active",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should render Revoked badge for revoked keys", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Revoked Key",
          keyPrefix: "nxl_revoked",
          scopes: ["issues:read"],
          isActive: false,
          usageCount: 100,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText("Revoked")).toBeInTheDocument();
    });

    it("should render scope badges for each scope", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Multi-Scope Key",
          keyPrefix: "nxl_multi",
          scopes: ["issues:read", "issues:write", "projects:read"],
          isActive: true,
          usageCount: 200,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText("issues:read")).toBeInTheDocument();
      expect(screen.getByText("issues:write")).toBeInTheDocument();
      expect(screen.getByText("projects:read")).toBeInTheDocument();
    });

    it("should render usage count", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Used Key",
          keyPrefix: "nxl_used",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 1234,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText(/1234/)).toBeInTheDocument();
      expect(screen.getByText(/API calls/)).toBeInTheDocument();
    });

    it("should render rate limit", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Rate Limited Key",
          keyPrefix: "nxl_rate",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 200,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByText(/200/)).toBeInTheDocument();
      expect(screen.getByText(/req\/min/)).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should render Revoke button for active keys", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Active Key",
          keyPrefix: "nxl_active",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /Revoke/i })).toBeInTheDocument();
    });

    it("should not render Revoke button for revoked keys", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Revoked Key",
          keyPrefix: "nxl_revoked",
          scopes: ["issues:read"],
          isActive: false,
          usageCount: 100,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.queryByRole("button", { name: /^Revoke$/i })).not.toBeInTheDocument();
    });

    it("should render Delete button", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Test Key",
          keyPrefix: "nxl_test",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /Delete key/i })).toBeInTheDocument();
    });

    it("should render View usage statistics button", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Test Key",
          keyPrefix: "nxl_test",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /View usage statistics/i })).toBeInTheDocument();
    });

    it("should render copy key prefix button", () => {
      mockApiKeys = [
        {
          id: "key-1" as Id<"apiKeys">,
          name: "Test Key",
          keyPrefix: "nxl_test",
          scopes: ["issues:read"],
          isActive: true,
          usageCount: 50,
          rateLimit: 100,
        },
      ];

      render(<ApiKeysManager />);

      expect(screen.getByRole("button", { name: /Copy key prefix/i })).toBeInTheDocument();
    });
  });

  describe("Generate Key Modal", () => {
    it("should open modal when Generate Key is clicked", async () => {
      const user = userEvent.setup();
      mockApiKeys = [];

      render(<ApiKeysManager />);

      await user.click(screen.getByRole("button", { name: /Generate Key/i }));

      // Dialog title renders in h2, button is also present
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText(/Key Name/i)).toBeInTheDocument();
    });

    it("should render permission scopes in modal", async () => {
      const user = userEvent.setup();
      mockApiKeys = [];

      render(<ApiKeysManager />);

      await user.click(screen.getByRole("button", { name: /Generate Key/i }));

      expect(screen.getByText("Read Issues")).toBeInTheDocument();
      expect(screen.getByText("Write Issues")).toBeInTheDocument();
      expect(screen.getByText("Delete Issues")).toBeInTheDocument();
    });

    it("should render rate limit input in modal", async () => {
      const user = userEvent.setup();
      mockApiKeys = [];

      render(<ApiKeysManager />);

      await user.click(screen.getByRole("button", { name: /Generate Key/i }));

      expect(screen.getByLabelText(/Rate Limit/i)).toBeInTheDocument();
    });
  });

  describe("Documentation Link", () => {
    it("should render API documentation link", () => {
      mockApiKeys = [];

      render(<ApiKeysManager />);

      expect(screen.getByText(/Need help\?/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /API Documentation/i })).toBeInTheDocument();
    });
  });
});
