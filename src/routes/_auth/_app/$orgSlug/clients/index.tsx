import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ClientPortalTokenRow } from "@/components/Clients/ClientCard";
import { ClientCard } from "@/components/Clients/ClientCard";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Plus, Users } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/clients/")({
  component: ClientsListPage,
});

function ClientsListPage() {
  const { organizationId } = useOrganization();
  const clients = useAuthenticatedQuery(api.clients.list, { organizationId }) as
    | Doc<"clients">[]
    | undefined;
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const { mutate: createClient } = useAuthenticatedMutation(api.clients.create);
  const { mutate: generatePortalToken } = useAuthenticatedMutation(api.clientPortal.generateToken);
  const { mutate: listPortalTokens } = useAuthenticatedMutation(
    api.clientPortal.listTokensByClient,
  );
  const { mutate: revokePortalToken } = useAuthenticatedMutation(api.clientPortal.revokeToken);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [generatedPortalLinks, setGeneratedPortalLinks] = useState<Record<string, string>>({});
  const [portalTokensByClient, setPortalTokensByClient] = useState<
    Record<string, ClientPortalTokenRow[]>
  >({});

  const handleCreateClient = async () => {
    try {
      await createClient({
        organizationId,
        name,
        email,
        company: company.trim() ? company : undefined,
        hourlyRate: Number.parseFloat(hourlyRate || "0"),
      });
      setName("");
      setEmail("");
      setCompany("");
      setHourlyRate("0");
      setShowCreateModal(false);
      showSuccess("Client created");
    } catch (error) {
      showError(error, "Failed to create client");
    }
  };

  const handleGeneratePortalLink = async (clientId: Id<"clients">, projectId: string) => {
    try {
      if (!projectId) {
        showError("Select a project to scope the portal link");
        return;
      }

      const response = await generatePortalToken({
        organizationId,
        clientId,
        projectIds: [projectId as Id<"projects">],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: true,
          addComments: false,
        },
      });

      setGeneratedPortalLinks((previous) => ({
        ...previous,
        [clientId]: response.portalPath,
      }));
      showSuccess("Portal link generated");
    } catch (error) {
      showError(error, "Failed to generate portal link");
    }
  };

  const handleRefreshPortalTokens = async (clientId: Id<"clients">) => {
    try {
      const tokens = await listPortalTokens({
        organizationId,
        clientId,
      });
      setPortalTokensByClient((previous) => ({
        ...previous,
        [clientId]: tokens,
      }));
    } catch (error) {
      showError(error, "Failed to load client portal tokens");
    }
  };

  const handleRevokePortalToken = async (
    clientId: Id<"clients">,
    tokenId: Id<"clientPortalTokens">,
  ) => {
    try {
      await revokePortalToken({
        organizationId,
        tokenId,
      });
      showSuccess("Portal token revoked");
      await handleRefreshPortalTokens(clientId);
    } catch (error) {
      showError(error, "Failed to revoke portal token");
    }
  };

  if (!clients) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  const projectOptions =
    projects?.page
      .filter((p: { organizationId: string }) => p.organizationId === organizationId)
      .map((p: { _id: string; name: string }) => ({
        _id: p._id,
        name: p.name,
      })) ?? [];

  return (
    <PageLayout>
      <PageHeader
        title="Clients"
        description="Manage billing contacts and default rates."
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Icon icon={Plus} size="sm" />}
          >
            New Client
          </Button>
        }
      />

      <Dialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="New Client"
        description="Add a new billing contact to your organization."
        size="md"
      >
        <Stack gap="md">
          <Grid cols={1} colsMd={2} gap="sm">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Client name"
            />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="client@example.com"
            />
            <Input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
              placeholder="Hourly rate"
            />
          </Grid>
          <Flex justify="end" gap="sm">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClient} disabled={!name.trim() || !email.trim()}>
              Create Client
            </Button>
          </Flex>
        </Stack>
      </Dialog>

      <Stack gap="md">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Click 'New Client' to add your first billing contact."
            action={
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Icon icon={Plus} size="sm" />}
              >
                New Client
              </Button>
            }
          />
        ) : (
          <Grid cols={1} colsLg={2} gap="md">
            {clients.map((client: Doc<"clients">) => (
              <ClientCard
                key={client._id}
                client={client}
                generatedPortalLink={generatedPortalLinks[client._id]}
                onGeneratePortalLink={handleGeneratePortalLink}
                onRefreshPortalTokens={handleRefreshPortalTokens}
                onRevokePortalToken={handleRevokePortalToken}
                portalTokens={portalTokensByClient[client._id] || []}
                projects={projectOptions}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </PageLayout>
  );
}
