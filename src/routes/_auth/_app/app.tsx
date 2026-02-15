import { createFileRoute } from "@tanstack/react-router";
import { AppSplashScreen } from "@/components/Auth/AppSplashScreen";

export const Route = createFileRoute("/_auth/_app/app")({
  component: AppPage,
});

/**
 * AppPage - Gateway splash screen.
 * The parent /app route layout handles redirect logic via getRedirectDestination.
 * This page shows a splash screen while that logic executes.
 */
function AppPage() {
  return <AppSplashScreen />;
}
