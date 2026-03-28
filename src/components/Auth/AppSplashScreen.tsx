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
} from "@/components/ui/appSplashScreenSurfaceClassNames";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { TEST_IDS } from "@/lib/test-ids";
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
      className={getAppSplashScreenRootClassName()}
    >
      {/* Background Glow */}
      <div className={getAppSplashScreenBackdropClassName()}>
        <div className={getAppSplashScreenGlowClassName()} />
      </div>

      <Flex
        direction="column"
        align="center"
        gap="2xl"
        className={getAppSplashScreenContentClassName()}
      >
        {/* Animated Logo Container */}
        <div className={getAppSplashScreenLogoShellClassName()}>
          <div className={getAppSplashScreenLogoHaloClassName()} />
          <div className={getAppSplashScreenLogoMotionClassName()}>
            <NixeloLogo size={64} />
          </div>
        </div>

        {/* Loader and Optional Text */}
        <Flex
          direction="column"
          align="center"
          gap="xl"
          className={getAppSplashScreenLoaderMotionClassName()}
        >
          {/* Minimal high-end loader - Always show to indicate activity */}
          <Card recipe="authSplashLoaderRail" padding="none">
            <div
              data-testid={TEST_IDS.LOADING.SKELETON}
              className={getAppSplashScreenLoaderFillClassName()}
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
    </Flex>
  );
}
