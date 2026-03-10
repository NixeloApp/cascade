import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { isSettingsTabValue, type SettingsTabValue } from "@/components/Settings/settingsTabs";

// Lazy load Settings component
const Settings = lazy(() => import("@/components/Settings").then((m) => ({ default: m.Settings })));

interface SettingsProfileSearch {
  tab?: SettingsTabValue;
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/settings/profile")({
  validateSearch: (search: Record<string, unknown>): SettingsProfileSearch => ({
    tab: isSettingsTabValue(search.tab) ? search.tab : undefined,
  }),
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const handleTabChange = (tab: SettingsTabValue) =>
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        tab: tab === "profile" ? undefined : tab,
      }),
    });

  return (
    <Suspense fallback={<PageContent isLoading>{null}</PageContent>}>
      <PageLayout maxWidth="md">
        <PageHeader
          title="Settings"
          description="Manage your account, integrations, and preferences"
        />
        <Settings activeTab={search.tab ?? "profile"} onTabChange={handleTabChange} />
      </PageLayout>
    </Suspense>
  );
}
