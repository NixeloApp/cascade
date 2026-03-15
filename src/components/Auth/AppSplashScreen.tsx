import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { NixeloLogo } from "../Landing/Icons";
import { Typography } from "../ui/Typography";

/**
 * Full-screen splash screen shown during app initialization.
 */
export function AppSplashScreen({ message }: { message?: string }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="fixed inset-0 bg-ui-bg-hero z-50"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-landing-accent/10 rounded-full blur-glow" />
      </div>

      <Flex direction="column" align="center" gap="2xl" className="relative">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-landing-accent/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative animate-in fade-in zoom-in duration-enter ease-out">
            <NixeloLogo size={64} />
          </div>
        </div>

        {/* Loader and Optional Text */}
        <Flex
          direction="column"
          align="center"
          gap="xl"
          className="animate-in fade-in slide-in-from-bottom-4 duration-enter-slow delay-300 fill-mode-both"
        >
          {/* Minimal high-end loader - Always show to indicate activity */}
          <Card recipe="authSplashLoaderRail" padding="none">
            <div
              data-loading-skeleton
              className="h-full bg-linear-to-r from-landing-accent to-landing-accent-alt w-full -translate-x-full animate-shimmer"
              style={{ animation: "shimmer 1.5s infinite linear" }}
            />
          </Card>

          {/* Optional Message */}
          {message && (
            <Typography variant="small" color="tertiary">
              {message}
            </Typography>
          )}
        </Flex>
      </Flex>

      <style>
        {`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        `}
      </style>
    </Flex>
  );
}
