import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy load Settings component
const Settings = lazy(() => import("@/components/Settings").then((m) => ({ default: m.Settings })));

export const Route = createFileRoute("/_auth/_app/$orgSlug/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <Suspense
      fallback={
        <Flex align="center" justify="center" className="h-full">
          <LoadingSpinner size="lg" />
        </Flex>
      }
    >
      <Settings />
    </Suspense>
  );
}
