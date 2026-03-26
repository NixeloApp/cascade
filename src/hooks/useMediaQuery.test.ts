import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

type MatchMediaController = {
  setMatches: (matches: boolean) => void;
};

function mockMatchMedia(initialMatches: boolean): MatchMediaController {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const mediaQueryList = {
        media: query,
        onchange: null,
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        dispatchEvent: () => true,
      };

      return Object.defineProperty(mediaQueryList, "matches", {
        configurable: true,
        enumerable: true,
        get: () => matches,
      });
    },
  });

  return {
    setMatches(nextMatches) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

describe("useMediaQuery", () => {
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  it("returns the default value when matchMedia is unavailable", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)", true));

    expect(result.current).toBe(true);
  });

  it("tracks media query changes", () => {
    const controller = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));

    expect(result.current).toBe(false);

    act(() => {
      controller.setMatches(true);
    });

    expect(result.current).toBe(true);
  });
});
