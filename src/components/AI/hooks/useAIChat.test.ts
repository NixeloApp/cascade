import type { Id } from "@convex/_generated/dataModel";
import { act, renderHook } from "@testing-library/react";
import type { ReactMutation } from "convex/react";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError } from "@/lib/toast";
import { useAIChat } from "./useAIChat";

vi.mock("convex/react", () => ({
  useAction: vi.fn(),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

describe("useAIChat", () => {
  const mockCreateChat = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateChat.mockResolvedValue({ chatId: "chat-1" });
    vi.mocked(useMutation).mockReturnValue(
      mockCreateChat as ReactMutation<FunctionReference<"mutation">>,
    );
    vi.mocked(useAction).mockReturnValue(vi.fn());
    vi.mocked(useQuery).mockReturnValue([]);
  });

  it("shows error toast when clipboard write fails", async () => {
    Object.assign(globalThis.navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });

    const { result } = renderHook(() => useAIChat({ initialChatId: "chat-1" as Id<"aiChats"> }));

    await act(async () => {
      await result.current.copyToClipboard("hello", "message-1");
    });

    expect(showError).toHaveBeenCalledWith(expect.any(Error), "Failed to copy response");
    expect(result.current.copiedMessageId).toBeNull();
  });
});
