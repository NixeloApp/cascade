import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// PointerEvent polyfill for Radix Tooltip hover tests in CI environments
if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

// React 19 doesn't export act, so we implement a simple version
const actImpl = (callback: () => void | Promise<void>) => {
  const result = callback();
  if (result && typeof result.then === "function") {
    return result.then(() => undefined);
  }
  return Promise.resolve();
};

// Patch test-utils
vi.mock("react-dom/test-utils", async () => {
  const actual =
    await vi.importActual<typeof import("react-dom/test-utils")>("react-dom/test-utils");
  return {
    ...actual,
    act: actImpl,
  };
});

// Mock ResizeObserver for components that use it (like cmdk)
class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Cleanup after each test
afterEach(() => {
  cleanup();
});
