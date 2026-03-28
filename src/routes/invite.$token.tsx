/**
 * Legacy Invite Route — Redirect to /join/$token
 *
 * Preserves backwards compatibility for invite emails sent before
 * the route was renamed from /invite/$token to /join/$token.
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/invite/$token")({
  component: InviteRedirect,
  ssr: false,
});

function InviteRedirect() {
  const { token } = Route.useParams();
  return <Navigate to="/join/$token" params={{ token }} replace />;
}
