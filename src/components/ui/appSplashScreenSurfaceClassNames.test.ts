import { describe, expect, it } from "vitest";
import {
  getAppSplashScreenBackdropClassName,
  getAppSplashScreenContentClassName,
  getAppSplashScreenGlowClassName,
  getAppSplashScreenLoaderFillClassName,
  getAppSplashScreenLoaderMotionClassName,
  getAppSplashScreenLogoHaloClassName,
  getAppSplashScreenLogoMotionClassName,
  getAppSplashScreenLogoShellClassName,
  getAppSplashScreenRootClassName,
} from "./appSplashScreenSurfaceClassNames";

describe("appSplashScreenSurfaceClassNames", () => {
  it("returns the owned splash shell classes", () => {
    expect(getAppSplashScreenRootClassName()).toBe("fixed inset-0 z-50 bg-ui-bg-hero");
    expect(getAppSplashScreenBackdropClassName()).toBe(
      "pointer-events-none absolute inset-0 overflow-hidden",
    );
    expect(getAppSplashScreenGlowClassName()).toBe(
      "absolute left-1/2 top-1/2 size-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-accent/10 blur-glow",
    );
    expect(getAppSplashScreenContentClassName()).toBe("relative");
  });

  it("returns the owned splash logo and loader classes", () => {
    expect(getAppSplashScreenLogoShellClassName()).toBe("relative");
    expect(getAppSplashScreenLogoHaloClassName()).toBe(
      "absolute inset-0 rounded-full bg-landing-accent/20 blur-2xl animate-pulse",
    );
    expect(getAppSplashScreenLogoMotionClassName()).toBe(
      "relative animate-in fade-in zoom-in duration-enter ease-out",
    );
    expect(getAppSplashScreenLoaderMotionClassName()).toBe(
      "animate-in fade-in slide-in-from-bottom-4 duration-enter-slow delay-300 fill-mode-both",
    );
    expect(getAppSplashScreenLoaderFillClassName()).toBe(
      "h-full w-full -translate-x-full bg-linear-to-r from-landing-accent to-landing-accent-alt animate-splash-shimmer",
    );
  });
});
