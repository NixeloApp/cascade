import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
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

function ClientsListPage() {
  const { organizationId } = useOrganization();
  const clients = useQuery(api.clients.list, { organizationId }) as Doc<"clients">[] | undefined;
  const projects = useQuery(api.projects.getCurrentUserProjects, {});
  const createClient = useMutation(api.clients.create);
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

      <Card>
        <CardHeader>
          <CardTitle>New Client</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-4 lg:grid-cols-4">
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
          <div className="lg:col-span-4">
            <Button onClick={handleCreateClient} disabled={!name.trim() || !email.trim()}>
              Create client
            </Button>
          </div>
        </CardContent>
      </Card>

      <Grid cols={1} gap="md" className="mt-4 lg:grid-cols-2">
        {clients.map((client: Doc<"clients">) => (
          <Card key={client._id}>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-4">
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
                  <Button variant="secondary" onClick={() => handleGeneratePortalLink(client._id)}>
                    Generate portal link
                  </Button>
                  <Button variant="ghost" onClick={() => handleRefreshPortalTokens(client._id)}>
                    Refresh tokens
                  </Button>
                </Flex>
                {generatedPortalLinks[client._id] ? (
                  <Typography variant="caption" className="mt-2 block text-brand">
                    {generatedPortalLinks[client._id]}
                  </Typography>
                ) : null}
                {(portalTokensByClient[client._id] || []).map((token) => (
                  <Card key={token._id} padding="sm" className="mt-2">
                    <Typography variant="caption" className="block">
                      Token: {token._id}
                    </Typography>
                    <Typography variant="caption" className="block">
                      Status: {token.isRevoked ? "revoked" : "active"}
                    </Typography>
                    <Typography variant="caption" className="block">
                      Updated: {new Date(token.updatedAt).toISOString().slice(0, 10)}
                    </Typography>
                    {token.lastAccessedAt ? (
                      <Typography variant="caption" className="block">
                        Last accessed: {new Date(token.lastAccessedAt).toISOString().slice(0, 10)}
                      </Typography>
                    ) : null}
                    {token.expiresAt ? (
                      <Typography variant="caption" className="block">
                        Expires: {new Date(token.expiresAt).toISOString().slice(0, 10)}
                      </Typography>
                    ) : null}
                    {!token.isRevoked ? (
                      <Button
                        variant="ghost"
                        className="mt-1"
                        onClick={() => handleRevokePortalToken(client._id, token._id)}
                      >
                        Revoke token
                      </Button>
                    ) : null}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </PageLayout>
  );
}
