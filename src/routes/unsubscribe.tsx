import { createFileRoute } from "@tanstack/react-router";
import { UnsubscribePage } from "@/components/UnsubscribePage";

interface UnsubscribeSearch {
  token?: string;
}

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribeRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): UnsubscribeSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
});

function UnsubscribeRoute() {
  const { token } = Route.useSearch();
  return <UnsubscribePage token={token ?? ""} />;
}
