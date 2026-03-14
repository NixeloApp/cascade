import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@/test/custom-render";
import { LazyPostHog } from "./LazyPostHog";

vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({
    apiKey,
    options,
    children,
  }: {
    apiKey: string;
    options: { api_host: string };
    children: React.ReactNode;
  }) => (
    <div data-api-host={options.api_host} data-api-key={apiKey} data-testid="posthog-provider">
      {children}
    </div>
  ),
}));

describe("LazyPostHog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps rendering children without analytics when no api key is provided", () => {
    render(
      <LazyPostHog apiKey="" options={{ api_host: "https://us.i.posthog.com" }}>
        <div>workspace shell</div>
      </LazyPostHog>,
    );

    expect(screen.getByText("workspace shell")).toBeInTheDocument();
    expect(screen.queryByTestId("posthog-provider")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId("posthog-provider")).not.toBeInTheDocument();
  });

  it("loads the provider after the idle timeout", async () => {
    render(
      <LazyPostHog apiKey="ph_test_key" options={{ api_host: "https://us.i.posthog.com" }}>
        <div>dashboard app</div>
      </LazyPostHog>,
    );

    expect(screen.getByText("dashboard app")).toBeInTheDocument();
    expect(screen.queryByTestId("posthog-provider")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("posthog-provider")).toHaveAttribute("data-api-key", "ph_test_key");
    expect(screen.getByTestId("posthog-provider")).toHaveAttribute(
      "data-api-host",
      "https://us.i.posthog.com",
    );
  });

  it("loads the provider on first user interaction before the timeout", async () => {
    render(
      <LazyPostHog apiKey="ph_interaction_key" options={{ api_host: "https://eu.i.posthog.com" }}>
        <div>client portal</div>
      </LazyPostHog>,
    );

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("posthog-provider")).toHaveAttribute(
      "data-api-key",
      "ph_interaction_key",
    );
    expect(screen.getByTestId("posthog-provider")).toHaveAttribute(
      "data-api-host",
      "https://eu.i.posthog.com",
    );
  });
});
