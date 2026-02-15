import { Flex } from "@/components/ui/Flex";
import { NixeloLogo } from "../Landing/icons";
import { Typography } from "../ui/Typography";

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

      <Flex direction="column" align="center" className="relative gap-8">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-landing-accent/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative animate-in fade-in zoom-in duration-700 ease-out">
            <NixeloLogo size={64} />
          </div>
        </div>

        {/* Loader and Optional Text */}
        <Flex
          direction="column"
          align="center"
          gap="xl"
          className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both"
        >
          {/* Minimal high-end loader - Always show to indicate activity */}
          <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-landing-accent to-landing-accent-alt w-full -translate-x-full animate-shimmer"
              style={{ animation: "shimmer 1.5s infinite linear" }}
            />
          </div>

          {/* Optional Message */}
          {message && (
            <Typography className="text-ui-text-tertiary font-medium tracking-wide">
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
