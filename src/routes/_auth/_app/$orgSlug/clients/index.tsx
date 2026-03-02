import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/clients/")({
  component: ClientsListPage,
});

function ClientsListPage() {
  const { organizationId } = useOrganization();
  const clients = useQuery(api.clients.list, { organizationId }) as Doc<"clients">[] | undefined;
  const createClient = useMutation(api.clients.create);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");

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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
