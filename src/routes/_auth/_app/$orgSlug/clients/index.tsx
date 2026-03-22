import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { Users } from "lucide-react";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDate } from "@/lib/dates";
import { showError, showSuccess } from "@/lib/toast";
export const Route = createFileRoute("/_auth/_app/$orgSlug/clients/")({
  component: ClientsListPage,
});

const clientPortalApi = anyApi.clientPortal;

type ClientPortalTokenRow = {
  _id: string;
  isRevoked: boolean;
  expiresAt?: number;
  lastAccessedAt?: number;
  updatedAt: number;
};

function PortalTokenDetails({
  clientId,
  onRevokePortalToken,
  tokens,
}: {
  clientId: string;
  onRevokePortalToken: (clientId: string, tokenId: string) => void;
  tokens: ClientPortalTokenRow[];
}) {
  return tokens.map((token) => (
    <div key={token._id} className="mt-2 border-t border-ui-border p-3">
      <Typography variant="caption" className="block">
        Token: {token._id}
      </Typography>
      <Typography variant="caption" className="block">
        Status: {token.isRevoked ? "revoked" : "active"}
      </Typography>
      <Typography variant="caption" className="block">
        Updated: {formatDate(token.updatedAt)}
      </Typography>
      {token.lastAccessedAt ? (
        <Typography variant="caption" className="block">
          Last accessed: {formatDate(token.lastAccessedAt)}
        </Typography>
      ) : null}
      {token.expiresAt ? (
        <Typography variant="caption" className="block">
          Expires: {formatDate(token.expiresAt)}
        </Typography>
      ) : null}
      {!token.isRevoked ? (
        <Button
          variant="ghost"
          className="mt-1"
          onClick={() => onRevokePortalToken(clientId, token._id)}
        >
          Revoke token
        </Button>
      ) : null}
    </div>
  ));
}

function ClientCard({
  client,
  generatedPortalLink,
  onGeneratePortalLink,
  onRefreshPortalTokens,
  onRevokePortalToken,
  portalTokens,
}: {
  client: Doc<"clients">;
  generatedPortalLink?: string;
  onGeneratePortalLink: (clientId: string) => void;
  onRefreshPortalTokens: (clientId: string) => void;
  onRevokePortalToken: (clientId: string, tokenId: string) => void;
  portalTokens: ClientPortalTokenRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="xs" className="pt-4">
          <Typography variant="small">{client.email}</Typography>
          {client.company ? (
            <Typography variant="small" color="secondary">
              {client.company}
            </Typography>
          ) : null}
          <Typography variant="small" color="secondary">
            Default rate: ${client.hourlyRate?.toFixed(2) ?? "0.00"}
          </Typography>
          <div className="pt-2">
            <Flex wrap gap="sm">
              <Button variant="secondary" onClick={() => onGeneratePortalLink(client._id)}>
                Generate portal link
              </Button>
              <Button variant="ghost" onClick={() => onRefreshPortalTokens(client._id)}>
                Refresh tokens
              </Button>
            </Flex>
            {generatedPortalLink ? (
              <Typography variant="caption" className="mt-2 block text-brand">
                {generatedPortalLink}
              </Typography>
            ) : null}
            <PortalTokenDetails
              clientId={client._id}
              onRevokePortalToken={onRevokePortalToken}
              tokens={portalTokens}
            />
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ClientsListPage() {
  const { organizationId } = useOrganization();
  const clients = useAuthenticatedQuery(api.clients.list, { organizationId }) as
    | Doc<"clients">[]
    | undefined;
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const { mutate: createClient } = useAuthenticatedMutation(api.clients.create);
  const generatePortalToken = useMutation(clientPortalApi.generateToken);
  const listPortalTokens = useMutation(clientPortalApi.listTokensByClient);
  const revokePortalToken = useMutation(clientPortalApi.revokeToken);

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
      showSuccess("Client created");
    } catch (error) {
      showError(error, "Failed to create client");
    }
  };

  const handleGeneratePortalLink = async (clientId: string) => {
    try {
      const scopedProject = projects?.page.find(
        (project: { organizationId: string }) => project.organizationId === organizationId,
      );
      if (!scopedProject) {
        showError(
          "No project available",
          "Create at least one project before generating a portal link",
        );
        return;
      }

      const response = await generatePortalToken({
        organizationId,
        clientId,
        projectIds: [scopedProject._id],
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

  const handleRefreshPortalTokens = async (clientId: string) => {
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

  const handleRevokePortalToken = async (clientId: string, tokenId: string) => {
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

  return (
    <PageLayout>
      <PageHeader title="Clients" description="Manage billing contacts and default rates." />

      <Stack gap="md">
        <Card>
          <CardHeader>
            <CardTitle>New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap="md">
              <Grid cols={1} colsLg={4} gap="sm" className="pt-4">
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
              <div>
                <Button onClick={handleCreateClient} disabled={!name.trim() || !email.trim()}>
                  Create client
                </Button>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first billing contact above to get started."
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
              />
            ))}
          </Grid>
        )}
      </Stack>
    </PageLayout>
  );
}
