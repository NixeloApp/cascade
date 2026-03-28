export function getAppSplashScreenRootClassName() {
  return "fixed inset-0 z-50 bg-ui-bg-hero";
}

export function getAppSplashScreenBackdropClassName() {
  return "pointer-events-none absolute inset-0 overflow-hidden";
}

export function getAppSplashScreenGlowClassName() {
  return "absolute left-1/2 top-1/2 size-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-accent/10 blur-glow";
}

export function getAppSplashScreenContentClassName() {
  return "relative";
}

export function getAppSplashScreenLogoShellClassName() {
  return "relative";
}

export function getAppSplashScreenLogoHaloClassName() {
  return "absolute inset-0 rounded-full bg-landing-accent/20 blur-2xl animate-pulse";
}

export function getAppSplashScreenLogoMotionClassName() {
  return "relative animate-in fade-in zoom-in duration-enter ease-out";
}

export function getAppSplashScreenLoaderMotionClassName() {
  return "animate-in fade-in slide-in-from-bottom-4 duration-enter-slow delay-300 fill-mode-both";
}

export function getAppSplashScreenLoaderFillClassName() {
  return "h-full w-full -translate-x-full bg-linear-to-r from-landing-accent to-landing-accent-alt animate-splash-shimmer";
}
